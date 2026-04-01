const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule, requirePermission } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/transactions
 * Get all transactions (SUPERADMIN only - caja module)
 */
router.get('/',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  asyncHandler(async (req, res) => {
    const {
      type, category, startDate, endDate,
      minAmount, maxAmount, currency,
      search, page = 1, limit = 50
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (currency) where.currency = currency;

    // Date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Amount range
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    // Search
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [transactions, total, totals] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true }
      })
    ]);

    // Calculate totals
    const ingresos = totals.find(t => t.type === 'INGRESO')?._sum.amount || 0;
    const egresos = totals.find(t => t.type === 'EGRESO')?._sum.amount || 0;

    res.json({
      transactions,
      summary: {
        ingresos: parseFloat(ingresos),
        egresos: parseFloat(egresos),
        balance: parseFloat(ingresos) - parseFloat(egresos)
      },
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
 * GET /api/transactions/summary
 * Get financial summary (SUPERADMIN only)
 */
router.get('/summary',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [byType, byCategory, recentTransactions] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 10
      })
    ]);

    const ingresos = byType.find(t => t.type === 'INGRESO');
    const egresos = byType.find(t => t.type === 'EGRESO');

    res.json({
      summary: {
        ingresos: {
          total: parseFloat(ingresos?._sum.amount || 0),
          count: ingresos?._count.id || 0
        },
        egresos: {
          total: parseFloat(egresos?._sum.amount || 0),
          count: egresos?._count.id || 0
        },
        balance: parseFloat(ingresos?._sum.amount || 0) - parseFloat(egresos?._sum.amount || 0)
      },
      byCategory: byCategory.map(c => ({
        category: c.category,
        total: parseFloat(c._sum.amount),
        count: c._count.id
      })),
      recentTransactions
    });
  })
);

/**
 * GET /api/transactions/:id
 * Get single transaction (SUPERADMIN only)
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json({ transaction });
  })
);

/**
 * POST /api/transactions
 * Create transaction (SUPERADMIN only)
 */
router.post('/',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  [
    body('type').isIn(['INGRESO', 'EGRESO']).withMessage('Tipo inválido'),
    body('category').isIn([
      'COMISION_VENTA', 'COMISION_ALQUILER', 'HONORARIOS', 'PUBLICIDAD',
      'SERVICIOS', 'IMPUESTOS', 'SUELDOS', 'ALQUILER_OFICINA', 'OTROS'
    ]).withMessage('Categoría inválida'),
    body('amount').isDecimal().withMessage('Monto requerido'),
    body('currency').optional().isIn(['USD', 'ARS']).withMessage('Moneda inválida'),
    body('description').trim().notEmpty().withMessage('Descripción requerida'),
    body('date').isISO8601().withMessage('Fecha inválida')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, category, amount, currency, description, date, reference, notes } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        currency: currency || 'ARS',
        description,
        date: new Date(date),
        reference,
        notes
      }
    });

    res.status(201).json({
      message: 'Transacción creada correctamente',
      transaction
    });
  })
);

/**
 * PUT /api/transactions/:id
 * Update transaction (SUPERADMIN only)
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  asyncHandler(async (req, res) => {
    const transactionId = req.params.id;

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    const { type, category, amount, currency, description, date, reference, notes } = req.body;

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (currency !== undefined) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (reference !== undefined) updateData.reference = reference;
    if (notes !== undefined) updateData.notes = notes;

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData
    });

    res.json({
      message: 'Transacción actualizada correctamente',
      transaction
    });
  })
);

/**
 * DELETE /api/transactions/:id
 * Delete transaction (SUPERADMIN only)
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.CAJA),
  requirePermission('canViewCaja'),
  asyncHandler(async (req, res) => {
    await prisma.transaction.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Transacción eliminada correctamente' });
  })
);

module.exports = router;
