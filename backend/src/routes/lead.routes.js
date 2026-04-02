const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule, attachPermissions } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/leads
 * Get all leads
 * - SUPERADMIN/ADMIN: See all leads
 * - VENDEDOR: Only see assigned leads
 */
router.get('/',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const { stage, source, assignedTo, search, page = 1, limit = 50 } = req.query;

    const where = {};

    // VENDEDOR can only see their assigned leads
    if (!req.permissions.canViewAllLeads) {
      where.assignedToId = req.user.id;
    } else if (assignedTo) {
      // Filter by assigned user if specified
      where.assignedToId = assignedTo;
    }

    // Filter by stage
    if (stage) {
      where.stage = stage;
    }

    // Filter by source
    if (source) {
      where.source = source;
    }

    // Search by name, email, or phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          },
          property: {
            select: { id: true, title: true }
          },
          _count: {
            select: { activities: true }
          },
          activities: {
            where: {
              followUpRequired: true,
              followUpDate: { not: null }
            },
            orderBy: { followUpDate: 'asc' },
            take: 1,
            select: {
              id: true,
              followUpDate: true,
              type: true,
              notes: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    // Process leads to add followUp info
    // Use date-only comparison to avoid timezone issues
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "2026-03-20"

    const processedLeads = leads.map(lead => {
      const nextFollowUp = lead.activities?.[0];
      let followUp = null;

      if (nextFollowUp) {
        // Extract just the date part for comparison
        const followUpDateStr = new Date(nextFollowUp.followUpDate).toISOString().split('T')[0];

        followUp = {
          date: nextFollowUp.followUpDate,
          type: nextFollowUp.type,
          isOverdue: followUpDateStr < todayStr,
          isToday: followUpDateStr === todayStr
        };
      }

      // Remove activities array and add followUp
      const { activities, ...leadWithoutActivities } = lead;
      return {
        ...leadWithoutActivities,
        followUp
      };
    });

    res.json({
      leads: processedLeads,
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
 * GET /api/leads/stats
 * Get lead statistics
 */
router.get('/stats',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const where = {};

    // VENDEDOR only sees their own stats
    if (!req.permissions.canViewAllLeads) {
      where.assignedToId = req.user.id;
    }

    const [byStage, bySource, total] = await Promise.all([
      prisma.lead.groupBy({
        by: ['stage'],
        where,
        _count: { id: true }
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: { id: true }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      total,
      byStage: byStage.reduce((acc, item) => {
        acc[item.stage] = item._count.id;
        return acc;
      }, {}),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count.id;
        return acc;
      }, {})
    });
  })
);

/**
 * GET /api/leads/follow-ups/pending
 * Get pending follow-ups (for notifications)
 * Returns activities where followUpRequired=true and followUpDate <= today
 */
router.get('/follow-ups/pending',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const where = {
      followUpRequired: true,
      followUpDate: {
        lte: today
      }
    };

    // VENDEDOR only sees follow-ups for their assigned leads
    if (!req.permissions.canViewAllLeads) {
      where.lead = {
        assignedToId: req.user.id
      };
    }

    const followUps = await prisma.leadActivity.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            assignedTo: {
              select: { id: true, name: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { followUpDate: 'asc' },
      take: 20
    });

    // Mark which are overdue vs today using date-only comparison
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "2026-03-20"

    const notifications = followUps.map(f => {
      const followUpDateStr = new Date(f.followUpDate).toISOString().split('T')[0];

      return {
        id: f.id,
        leadId: f.leadId,
        leadName: f.lead.name,
        leadPhone: f.lead.phone,
        type: f.type,
        notes: f.notes,
        subject: f.subject,
        followUpDate: f.followUpDate,
        isOverdue: followUpDateStr < todayStr,
        isToday: followUpDateStr === todayStr,
        createdBy: f.createdBy
      };
    });

    res.json({
      total: notifications.length,
      notifications
    });
  })
);

/**
 * GET /api/leads/:id
 * Get single lead
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, phone: true }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        property: {
          select: { id: true, title: true, address: true, price: true, currency: true }
        },
        activities: {
          include: {
            createdBy: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { date: 'desc' },
          take: 20
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // VENDEDOR can only view their assigned leads
    if (!req.permissions.canViewAllLeads && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este lead' });
    }

    res.json({ lead });
  })
);

/**
 * POST /api/leads
 * Create new lead
 * - VENDEDOR: Lead is automatically assigned to themselves
 * - ADMIN/SUPERADMIN: Can assign to any user
 */
router.post('/',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').optional().trim(),
    body('source').optional().isIn([
      'REFERIDO', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE', 'DIRECTO', 'OTRO'
    ]).withMessage('Fuente inválida'),
    body('stage').optional().isIn([
      'NUEVO', 'EN_PROCESO', 'NEGOCIACION', 'CERRADO', 'PERDIDO'
    ]).withMessage('Etapa inválida'),
    body('budgetMin').optional({ values: 'falsy' }),
    body('budgetMax').optional({ values: 'falsy' }),
    body('budgetCurrency').optional().isIn(['USD', 'ARS']).withMessage('Moneda inválida'),
    body('interests').optional().isArray().withMessage('Intereses debe ser un array'),
    body('preferredZones').optional().isArray().withMessage('Zonas preferidas debe ser un array'),
    body('notes').optional().trim(),
    body('propertyId').optional({ values: 'falsy' }),
    body('assignedToId').optional({ values: 'falsy' })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, email, phone, source, stage,
      budgetMin, budgetMax, budgetCurrency,
      interests, preferredZones, notes,
      propertyId, assignedToId
    } = req.body;

    // VENDEDOR: Auto-assign to themselves, cannot assign to others
    let finalAssignedToId = req.user.id;

    if (req.permissions.canViewAllLeads && assignedToId) {
      // ADMIN/SUPERADMIN can assign to any user
      finalAssignedToId = assignedToId;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        source: source || 'REFERIDO',
        stage: stage || 'NUEVO',
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        budgetCurrency: budgetCurrency || 'USD',
        interests: interests || [],
        preferredZones: preferredZones || [],
        notes,
        propertyId,
        assignedToId: finalAssignedToId,
        createdById: req.user.id
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        },
        property: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(201).json({
      message: 'Lead creado correctamente',
      lead
    });
  })
);

/**
 * PUT /api/leads/:id
 * Update lead
 * - VENDEDOR: Can only update their assigned leads
 * - ADMIN/SUPERADMIN: Can update any lead
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').optional().trim(),
    body('source').optional().isIn([
      'REFERIDO', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'GOOGLE', 'DIRECTO', 'OTRO'
    ]).withMessage('Fuente inválida'),
    body('stage').optional().isIn([
      'NUEVO', 'EN_PROCESO', 'NEGOCIACION', 'CERRADO', 'PERDIDO'
    ]).withMessage('Etapa inválida'),
    body('score').optional().isInt({ min: 0, max: 100 }).withMessage('Score debe ser entre 0 y 100'),
    body('assignedToId').optional().isString()
  ],
  asyncHandler(async (req, res) => {
    const leadId = req.params.id;

    // Get current lead
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // VENDEDOR can only update their assigned leads
    if (!req.permissions.canEditAnyLead && existingLead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este lead' });
    }

    // VENDEDOR cannot reassign leads
    if (!req.permissions.canEditAnyLead && req.body.assignedToId && req.body.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No puedes reasignar leads' });
    }

    const {
      name, email, phone, source, stage, score,
      budgetMin, budgetMax, budgetCurrency,
      interests, preferredZones, notes,
      propertyId, assignedToId, lostReason, closedDate, closedAmount
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (source !== undefined) updateData.source = source;
    if (stage !== undefined) updateData.stage = stage;
    if (score !== undefined) updateData.score = score;
    if (budgetMin !== undefined) updateData.budgetMin = budgetMin ? parseFloat(budgetMin) : null;
    if (budgetMax !== undefined) updateData.budgetMax = budgetMax ? parseFloat(budgetMax) : null;
    if (budgetCurrency !== undefined) updateData.budgetCurrency = budgetCurrency;
    if (interests !== undefined) updateData.interests = interests;
    if (preferredZones !== undefined) updateData.preferredZones = preferredZones;
    if (notes !== undefined) updateData.notes = notes;
    if (propertyId !== undefined) {
      if (propertyId) {
        updateData.property = { connect: { id: propertyId } };
      } else {
        updateData.property = { disconnect: true };
      }
    }
    if (assignedToId !== undefined && req.permissions.canEditAnyLead) {
      updateData.assignedTo = { connect: { id: assignedToId } };
    }
    if (lostReason !== undefined) updateData.lostReason = lostReason;
    if (closedDate !== undefined) updateData.closedDate = new Date(closedDate);
    if (closedAmount !== undefined) updateData.closedAmount = parseFloat(closedAmount);

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        },
        property: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({
      message: 'Lead actualizado correctamente',
      lead
    });
  })
);

/**
 * DELETE /api/leads/:id
 * Delete lead (ADMIN/SUPERADMIN only)
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    if (!req.permissions.canEditAnyLead) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar leads' });
    }

    await prisma.lead.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Lead eliminado correctamente' });
  })
);

/**
 * GET /api/leads/:id/activities
 * Get activities for a lead
 */
router.get('/:id/activities',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const leadId = req.params.id;
    const { type, outcome, page = 1, limit = 50 } = req.query;

    // Check access
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!req.permissions.canViewAllLeads && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este lead' });
    }

    const where = { leadId };
    if (type) where.type = type;
    if (outcome) where.outcome = outcome;

    const [activities, total] = await Promise.all([
      prisma.leadActivity.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { date: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.leadActivity.count({ where })
    ]);

    res.json({
      activities,
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
 * POST /api/leads/:id/activities
 * Add activity to lead
 */
router.post('/:id/activities',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('type').isIn([
      'LLAMADA_ENTRANTE', 'LLAMADA_SALIENTE', 'WHATSAPP', 'EMAIL',
      'VISITA', 'REUNION', 'NOTA', 'OFERTA', 'SEGUIMIENTO'
    ]).withMessage('Tipo de actividad inválido'),
    body('date').isISO8601().withMessage('Fecha inválida'),
    body('subject').optional().trim(),
    body('notes').optional().trim(),
    body('duration').optional({ values: 'null' }).isInt({ min: 0 }).withMessage('Duración debe ser un número positivo'),
    body('outcome').optional().isIn([
      'EXITOSO', 'SIN_RESPUESTA', 'OCUPADO', 'RECHAZADO', 'PENDIENTE', 'NO_APLICA'
    ]).withMessage('Resultado inválido'),
    body('followUpRequired').optional().isBoolean(),
    body('followUpDate').optional().isISO8601().withMessage('Fecha de seguimiento inválida')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const leadId = req.params.id;

    // Check access
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!req.permissions.canEditAnyLead && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este lead' });
    }

    const { type, date, subject, notes, duration, outcome, followUpRequired, followUpDate } = req.body;

    const activity = await prisma.leadActivity.create({
      data: {
        type,
        date: new Date(date),
        subject,
        notes,
        duration: duration ? parseInt(duration) : null,
        outcome: outcome || 'NO_APLICA',
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        leadId,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      message: 'Actividad registrada',
      activity
    });
  })
);

/**
 * PUT /api/leads/:leadId/activities/:activityId
 * Update activity
 */
router.put('/:leadId/activities/:activityId',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('type').optional().isIn([
      'LLAMADA_ENTRANTE', 'LLAMADA_SALIENTE', 'WHATSAPP', 'EMAIL',
      'VISITA', 'REUNION', 'NOTA', 'OFERTA', 'SEGUIMIENTO'
    ]).withMessage('Tipo de actividad inválido'),
    body('date').optional().isISO8601().withMessage('Fecha inválida'),
    body('subject').optional().trim(),
    body('notes').optional().trim(),
    body('duration').optional().isInt({ min: 0 }),
    body('outcome').optional().isIn([
      'EXITOSO', 'SIN_RESPUESTA', 'OCUPADO', 'RECHAZADO', 'PENDIENTE', 'NO_APLICA'
    ]),
    body('followUpRequired').optional().isBoolean(),
    body('followUpDate').optional().isISO8601()
  ],
  asyncHandler(async (req, res) => {
    const { leadId, activityId } = req.params;

    // Check lead access
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!req.permissions.canEditAnyLead && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este lead' });
    }

    // Check activity exists
    const existingActivity = await prisma.leadActivity.findUnique({
      where: { id: activityId }
    });

    if (!existingActivity || existingActivity.leadId !== leadId) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    const { type, date, subject, notes, duration, outcome, followUpRequired, followUpDate } = req.body;

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (subject !== undefined) updateData.subject = subject;
    if (notes !== undefined) updateData.notes = notes;
    if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
    if (outcome !== undefined) updateData.outcome = outcome;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;

    const activity = await prisma.leadActivity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      message: 'Actividad actualizada',
      activity
    });
  })
);

/**
 * DELETE /api/leads/:leadId/activities/:activityId
 * Delete activity
 */
router.delete('/:leadId/activities/:activityId',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const { leadId, activityId } = req.params;

    // Check lead access
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!req.permissions.canEditAnyLead && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a este lead' });
    }

    // Check activity exists
    const existingActivity = await prisma.leadActivity.findUnique({
      where: { id: activityId }
    });

    if (!existingActivity || existingActivity.leadId !== leadId) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    await prisma.leadActivity.delete({
      where: { id: activityId }
    });

    res.json({ message: 'Actividad eliminada' });
  })
);

module.exports = router;
