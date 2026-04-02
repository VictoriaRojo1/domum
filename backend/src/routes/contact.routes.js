const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/contacts
 * Get all contacts with optional filters
 */
router.get('/',
  authenticate,
  requireModule(MODULES.CONTACTOS),
  asyncHandler(async (req, res) => {
    const { type, search, page = 1, limit = 50 } = req.query;

    const where = {};

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Search by name, email, phone or company
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
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
 * GET /api/contacts/:id
 * Get a single contact by ID
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.CONTACTOS),
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    res.json({ contact });
  })
);

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post('/',
  authenticate,
  requireModule(MODULES.CONTACTOS),
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('type').optional().trim(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('referredBy').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, company, type, address, notes, referredBy } = req.body;

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        company,
        type,
        address,
        notes,
        referredBy
      }
    });

    res.status(201).json({
      message: 'Contacto creado exitosamente',
      contact
    });
  })
);

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.CONTACTOS),
  [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('type').optional().trim(),
    body('address').optional().trim(),
    body('notes').optional().trim(),
    body('referredBy').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const { name, email, phone, company, type, address, notes, referredBy } = req.body;

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(type !== undefined && { type }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(referredBy !== undefined && { referredBy })
      }
    });

    res.json({
      message: 'Contacto actualizado',
      contact
    });
  })
);

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.CONTACTOS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    await prisma.contact.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contacto eliminado' });
  })
);

module.exports = router;
