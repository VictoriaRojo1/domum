const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/events
 * Get all events with optional filters
 */
router.get('/',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  asyncHandler(async (req, res) => {
    const { type, status, date, dateFrom, dateTo, agent, page = 1, limit = 50 } = req.query;

    const where = {};

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by specific date
    if (date) {
      where.date = new Date(date);
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Filter by agent
    if (agent) {
      where.agentId = agent;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true, address: true }
          },
          lead: {
            select: { id: true, name: true, email: true, phone: true }
          },
          agent: {
            select: { id: true, name: true, avatar: true }
          },
          contact: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
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
 * GET /api/events/upcoming
 * Get upcoming events
 */
router.get('/upcoming',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await prisma.event.findMany({
      where: {
        date: { gte: today },
        status: { in: ['PENDIENTE', 'CONFIRMADO'] }
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        lead: {
          select: { id: true, name: true }
        },
        agent: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: parseInt(limit)
    });

    res.json({ events });
  })
);

/**
 * GET /api/events/:id
 * Get a single event by ID
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        lead: {
          select: { id: true, name: true, email: true, phone: true }
        },
        agent: {
          select: { id: true, name: true, avatar: true, email: true, phone: true }
        },
        contact: {
          select: { id: true, name: true, email: true, phone: true }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json({ event });
  })
);

/**
 * POST /api/events
 * Create a new event
 */
router.post('/',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  [
    body('type').notEmpty().withMessage('El tipo es requerido'),
    body('title').trim().notEmpty().withMessage('El título es requerido'),
    body('date').isISO8601().withMessage('Fecha inválida'),
    body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora de inicio inválida (HH:mm)'),
    body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora de fin inválida (HH:mm)'),
    body('description').optional().trim(),
    body('location').optional().trim(),
    body('status').optional().isIn(['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO']),
    body('reminder').optional().isInt({ min: 0 }),
    body('propertyId').optional().trim(),
    body('leadId').optional().trim(),
    body('agentId').optional().trim(),
    body('contactId').optional().trim(),
    body('notes').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type, title, description, date, startTime, endTime,
      location, status, reminder, notes,
      propertyId, leadId, agentId, contactId
    } = req.body;

    const event = await prisma.event.create({
      data: {
        type,
        title,
        description,
        date: new Date(date),
        startTime,
        endTime,
        location,
        status: status || 'PENDIENTE',
        reminder,
        notes,
        propertyId,
        leadId,
        agentId,
        contactId,
        createdById: req.user.id
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        lead: {
          select: { id: true, name: true }
        },
        agent: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      message: 'Evento creado exitosamente',
      event
    });
  })
);

/**
 * PUT /api/events/:id
 * Update an event
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  [
    body('type').optional().notEmpty().withMessage('El tipo no puede estar vacío'),
    body('title').optional().trim().notEmpty().withMessage('El título no puede estar vacío'),
    body('date').optional().isISO8601().withMessage('Fecha inválida'),
    body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora de inicio inválida'),
    body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora de fin inválida'),
    body('status').optional().isIn(['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO']),
    body('reminder').optional().isInt({ min: 0 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const {
      type, title, description, date, startTime, endTime,
      location, status, reminder, notes,
      propertyId, leadId, agentId, contactId
    } = req.body;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status }),
        ...(reminder !== undefined && { reminder }),
        ...(notes !== undefined && { notes }),
        ...(propertyId !== undefined && { propertyId }),
        ...(leadId !== undefined && { leadId }),
        ...(agentId !== undefined && { agentId }),
        ...(contactId !== undefined && { contactId })
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        lead: {
          select: { id: true, name: true }
        },
        agent: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      message: 'Evento actualizado',
      event
    });
  })
);

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.CALENDARIO),
  asyncHandler(async (req, res) => {
    const existing = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await prisma.event.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Evento eliminado' });
  })
);

module.exports = router;
