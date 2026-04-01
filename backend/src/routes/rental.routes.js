const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/rentals
 * Get all rentals with optional filters
 */
router.get('/',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const { status, property, propietario, inquilino, page = 1, limit = 50 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }
    if (property) {
      where.propertyId = property;
    }
    if (propietario) {
      where.propietarioId = propietario;
    }
    if (inquilino) {
      where.inquilinoId = inquilino;
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true, address: true, type: true }
          },
          propietario: {
            select: { id: true, name: true, email: true, phone: true }
          },
          inquilino: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.rental.count({ where })
    ]);

    res.json({
      rentals,
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
 * GET /api/rentals/expiring
 * Get rentals expiring within specified days
 */
router.get('/expiring',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const { days = 90 } = req.query;
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + parseInt(days));

    const rentals = await prisma.rental.findMany({
      where: {
        status: 'ACTIVO',
        endDate: {
          gte: today,
          lte: limit
        }
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        propietario: {
          select: { id: true, name: true }
        },
        inquilino: {
          select: { id: true, name: true }
        }
      },
      orderBy: { endDate: 'asc' }
    });

    res.json({ rentals });
  })
);

/**
 * GET /api/rentals/adjustments
 * Get upcoming rent adjustments
 */
router.get('/adjustments',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + parseInt(days));

    const rentals = await prisma.rental.findMany({
      where: {
        status: 'ACTIVO',
        nextAdjustmentDate: {
          gte: today,
          lte: limit
        }
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        propietario: {
          select: { id: true, name: true }
        },
        inquilino: {
          select: { id: true, name: true }
        }
      },
      orderBy: { nextAdjustmentDate: 'asc' }
    });

    res.json({ rentals });
  })
);

/**
 * GET /api/rentals/stats
 * Get rental statistics
 */
router.get('/stats',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);
    const ninetyDays = new Date();
    ninetyDays.setDate(today.getDate() + 90);

    const [
      totalContracts,
      activeContracts,
      expiringContracts,
      upcomingAdjustments,
      activeRentals
    ] = await Promise.all([
      prisma.rental.count(),
      prisma.rental.count({ where: { status: 'ACTIVO' } }),
      prisma.rental.count({
        where: {
          status: 'ACTIVO',
          endDate: { gte: today, lte: ninetyDays }
        }
      }),
      prisma.rental.count({
        where: {
          status: 'ACTIVO',
          nextAdjustmentDate: { gte: today, lte: thirtyDays }
        }
      }),
      prisma.rental.findMany({
        where: { status: 'ACTIVO' },
        select: { monthlyRent: true, currency: true }
      })
    ]);

    let monthlyIncomeARS = 0;
    let monthlyIncomeUSD = 0;

    activeRentals.forEach(r => {
      const rent = parseFloat(r.monthlyRent);
      if (r.currency === 'ARS') {
        monthlyIncomeARS += rent;
      } else {
        monthlyIncomeUSD += rent;
      }
    });

    res.json({
      stats: {
        totalContracts,
        activeContracts,
        expiringContracts,
        upcomingAdjustments,
        monthlyIncomeARS,
        monthlyIncomeUSD
      }
    });
  })
);

/**
 * GET /api/rentals/:id
 * Get a single rental by ID
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const rental = await prisma.rental.findUnique({
      where: { id: req.params.id },
      include: {
        property: {
          select: { id: true, title: true, address: true, type: true }
        },
        propietario: {
          select: { id: true, name: true, email: true, phone: true }
        },
        inquilino: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    res.json({ rental });
  })
);

/**
 * POST /api/rentals
 * Create a new rental
 */
router.post('/',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  [
    body('propertyId').notEmpty().withMessage('La propiedad es requerida'),
    body('propietarioId').notEmpty().withMessage('El propietario es requerido'),
    body('inquilinoId').notEmpty().withMessage('El inquilino es requerido'),
    body('startDate').isISO8601().withMessage('Fecha de inicio inválida'),
    body('endDate').isISO8601().withMessage('Fecha de fin inválida'),
    body('monthlyRent').isNumeric().withMessage('Alquiler mensual inválido'),
    body('currency').optional().isIn(['ARS', 'USD']),
    body('adjustmentFrequency').notEmpty().withMessage('Frecuencia de ajuste requerida'),
    body('adjustmentPercentage').isNumeric().withMessage('Porcentaje de ajuste inválido'),
    body('nextAdjustmentDate').isISO8601().withMessage('Fecha de próximo ajuste inválida'),
    body('paymentDay').isInt({ min: 1, max: 31 }).withMessage('Día de pago inválido'),
    body('depositAmount').isNumeric().withMessage('Depósito inválido')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      propertyId, propietarioId, inquilinoId,
      startDate, endDate, monthlyRent, currency,
      adjustmentFrequency, adjustmentPercentage, nextAdjustmentDate,
      paymentDay, depositAmount,
      guarantorName, guarantorPhone, guarantorRelationship,
      status, notes
    } = req.body;

    const rental = await prisma.rental.create({
      data: {
        propertyId,
        propietarioId,
        inquilinoId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: parseFloat(monthlyRent),
        currency: currency || 'ARS',
        adjustmentFrequency,
        adjustmentPercentage: parseFloat(adjustmentPercentage),
        nextAdjustmentDate: new Date(nextAdjustmentDate),
        paymentDay: parseInt(paymentDay),
        depositAmount: parseFloat(depositAmount),
        guarantorName,
        guarantorPhone,
        guarantorRelationship,
        status: status || 'ACTIVO',
        notes
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        propietario: {
          select: { id: true, name: true }
        },
        inquilino: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      message: 'Contrato creado exitosamente',
      rental
    });
  })
);

/**
 * PUT /api/rentals/:id
 * Update a rental
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('monthlyRent').optional().isNumeric(),
    body('adjustmentPercentage').optional().isNumeric(),
    body('nextAdjustmentDate').optional().isISO8601(),
    body('paymentDay').optional().isInt({ min: 1, max: 31 }),
    body('depositAmount').optional().isNumeric(),
    body('status').optional().isIn(['ACTIVO', 'VENCIDO', 'RESCINDIDO', 'RENOVADO'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await prisma.rental.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const {
      startDate, endDate, monthlyRent, currency,
      adjustmentFrequency, adjustmentPercentage, nextAdjustmentDate,
      paymentDay, depositAmount,
      guarantorName, guarantorPhone, guarantorRelationship,
      status, notes
    } = req.body;

    const rental = await prisma.rental.update({
      where: { id: req.params.id },
      data: {
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(monthlyRent !== undefined && { monthlyRent: parseFloat(monthlyRent) }),
        ...(currency !== undefined && { currency }),
        ...(adjustmentFrequency !== undefined && { adjustmentFrequency }),
        ...(adjustmentPercentage !== undefined && { adjustmentPercentage: parseFloat(adjustmentPercentage) }),
        ...(nextAdjustmentDate !== undefined && { nextAdjustmentDate: new Date(nextAdjustmentDate) }),
        ...(paymentDay !== undefined && { paymentDay: parseInt(paymentDay) }),
        ...(depositAmount !== undefined && { depositAmount: parseFloat(depositAmount) }),
        ...(guarantorName !== undefined && { guarantorName }),
        ...(guarantorPhone !== undefined && { guarantorPhone }),
        ...(guarantorRelationship !== undefined && { guarantorRelationship }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes })
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        propietario: {
          select: { id: true, name: true }
        },
        inquilino: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      message: 'Contrato actualizado',
      rental
    });
  })
);

/**
 * DELETE /api/rentals/:id
 * Delete a rental
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.ALQUILERES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.rental.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    await prisma.rental.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contrato eliminado' });
  })
);

module.exports = router;
