const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireModule, attachPermissions } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/properties
 * Get all properties
 * - Public endpoint (optional auth)
 * - All roles can view all properties
 */
router.get('/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      type, operation, status, city, neighborhood,
      minPrice, maxPrice, currency,
      minRooms, maxRooms, featured,
      search, page = 1, limit = 20
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (operation) where.operation = operation;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    if (currency) where.currency = currency;
    if (featured === 'true') where.featured = true;

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Rooms range
    if (minRooms || maxRooms) {
      where.rooms = {};
      if (minRooms) where.rooms.gte = parseInt(minRooms);
      if (maxRooms) where.rooms.lte = parseInt(maxRooms);
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, phone: true, email: true }
          },
          _count: {
            select: { leads: true }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.property.count({ where })
    ]);

    res.json({
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

/**
 * GET /api/properties/:id
 * Get single property
 */
router.get('/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, phone: true, email: true, avatar: true }
        },
        leads: {
          select: { id: true, name: true, stage: true },
          take: 10
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    res.json({ property });
  })
);

/**
 * POST /api/properties
 * Create new property (ADMIN/SUPERADMIN only)
 */
router.post('/',
  authenticate,
  requireModule(MODULES.PROPIEDADES),
  attachPermissions,
  [
    body('title').trim().notEmpty().withMessage('Título requerido'),
    body('type').isIn([
      'DEPARTAMENTO', 'CASA', 'PH', 'LOCAL', 'OFICINA', 'TERRENO', 'COCHERA', 'QUINTA', 'EDIFICIO'
    ]).withMessage('Tipo inválido'),
    body('operation').isIn(['VENTA', 'ALQUILER', 'ALQUILER_TEMPORARIO']).withMessage('Operación inválida'),
    body('price').isDecimal().withMessage('Precio requerido'),
    body('currency').optional().isIn(['USD', 'ARS']).withMessage('Moneda inválida'),
    body('address').trim().notEmpty().withMessage('Dirección requerida'),
    body('city').trim().notEmpty().withMessage('Ciudad requerida')
  ],
  asyncHandler(async (req, res) => {
    // VENDEDOR cannot create properties
    if (!req.permissions.canEditAnyProperty) {
      return res.status(403).json({ error: 'No tienes permiso para crear propiedades' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, type, operation, status,
      price, currency, address, city, neighborhood, zipCode,
      latitude, longitude, totalArea, coveredArea,
      rooms, bedrooms, bathrooms, parkingSpaces,
      amenities, images, attachments, featured, assignedToId
    } = req.body;

    const property = await prisma.property.create({
      data: {
        title,
        description,
        type,
        operation,
        status: status || 'DISPONIBLE',
        price: parseFloat(price),
        currency: currency || 'USD',
        address,
        city,
        neighborhood,
        zipCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        coveredArea: coveredArea ? parseFloat(coveredArea) : null,
        rooms: rooms ? parseInt(rooms) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : null,
        amenities: amenities || [],
        images: images || [],
        attachments: attachments || [],
        featured: featured || false,
        assignedToId
      },
      include: {
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      message: 'Propiedad creada correctamente',
      property
    });
  })
);

/**
 * PUT /api/properties/:id
 * Update property (ADMIN/SUPERADMIN only)
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.PROPIEDADES),
  attachPermissions,
  asyncHandler(async (req, res) => {
    // VENDEDOR cannot edit properties
    if (!req.permissions.canEditAnyProperty) {
      return res.status(403).json({ error: 'No tienes permiso para editar propiedades' });
    }

    const propertyId = req.params.id;

    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    const {
      title, description, type, operation, status,
      price, currency, address, city, neighborhood, zipCode,
      latitude, longitude, totalArea, coveredArea,
      rooms, bedrooms, bathrooms, parkingSpaces,
      amenities, images, attachments, featured, assignedToId
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (operation !== undefined) updateData.operation = operation;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (totalArea !== undefined) updateData.totalArea = totalArea ? parseFloat(totalArea) : null;
    if (coveredArea !== undefined) updateData.coveredArea = coveredArea ? parseFloat(coveredArea) : null;
    if (rooms !== undefined) updateData.rooms = rooms ? parseInt(rooms) : null;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms) : null;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(bathrooms) : null;
    if (parkingSpaces !== undefined) updateData.parkingSpaces = parkingSpaces ? parseInt(parkingSpaces) : null;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (images !== undefined) updateData.images = images;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (featured !== undefined) updateData.featured = featured;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      message: 'Propiedad actualizada correctamente',
      property
    });
  })
);

/**
 * DELETE /api/properties/:id
 * Delete property (SUPERADMIN only)
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.PROPIEDADES),
  attachPermissions,
  asyncHandler(async (req, res) => {
    // Only SUPERADMIN can delete properties
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede eliminar propiedades' });
    }

    await prisma.property.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Propiedad eliminada correctamente' });
  })
);

module.exports = router;
