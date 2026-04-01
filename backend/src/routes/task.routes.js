const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule, attachPermissions } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/tasks
 * Get all tasks (filtered by user permissions)
 */
router.get('/',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const { status, priority, leadId, assignedTo, overdue, page = 1, limit = 50 } = req.query;

    const where = {};

    // VENDEDOR can only see their assigned tasks
    if (!req.permissions.canViewAllLeads) {
      where.assignedToId = req.user.id;
    } else if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by priority
    if (priority) {
      where.priority = priority;
    }

    // Filter by lead
    if (leadId) {
      where.leadId = leadId;
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETADA', 'CANCELADA'] };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          lead: {
            select: { id: true, name: true, stage: true }
          },
          property: {
            select: { id: true, title: true, address: true }
          },
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { priority: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
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
 * GET /api/tasks/my-tasks
 * Get tasks assigned to current user
 */
router.get('/my-tasks',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, includeCompleted } = req.query;

    const where = {
      assignedToId: req.user.id
    };

    if (status) {
      where.status = status;
    } else if (includeCompleted !== 'true') {
      where.status = { notIn: ['COMPLETADA', 'CANCELADA'] };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        lead: {
          select: { id: true, name: true, stage: true }
        },
        property: {
          select: { id: true, title: true }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ],
      take: 50
    });

    // Group by status
    const overdue = tasks.filter(t =>
      new Date(t.dueDate) < new Date() &&
      !['COMPLETADA', 'CANCELADA'].includes(t.status)
    );
    const today = tasks.filter(t => {
      const due = new Date(t.dueDate);
      const now = new Date();
      return due.toDateString() === now.toDateString() &&
        !['COMPLETADA', 'CANCELADA'].includes(t.status);
    });
    const upcoming = tasks.filter(t => {
      const due = new Date(t.dueDate);
      const now = new Date();
      return due > now && due.toDateString() !== now.toDateString() &&
        !['COMPLETADA', 'CANCELADA'].includes(t.status);
    });

    res.json({
      tasks,
      summary: {
        total: tasks.length,
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        pending: tasks.filter(t => t.status === 'PENDIENTE').length,
        inProgress: tasks.filter(t => t.status === 'EN_PROGRESO').length
      },
      grouped: {
        overdue,
        today,
        upcoming
      }
    });
  })
);

/**
 * GET /api/tasks/stats
 * Get task statistics
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

    const now = new Date();

    const [byStatus, byPriority, overdue, total] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { ...where, status: { notIn: ['COMPLETADA', 'CANCELADA'] } },
        _count: { id: true }
      }),
      prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: now },
          status: { notIn: ['COMPLETADA', 'CANCELADA'] }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      total,
      overdue,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {})
    });
  })
);

/**
 * GET /api/tasks/:id
 * Get single task
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        lead: {
          select: { id: true, name: true, email: true, phone: true, stage: true }
        },
        property: {
          select: { id: true, title: true, address: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // VENDEDOR can only view their assigned tasks
    if (!req.permissions.canViewAllLeads && task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    res.json({ task });
  })
);

/**
 * POST /api/tasks
 * Create new task
 */
router.post('/',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('title').trim().notEmpty().withMessage('Título requerido'),
    body('dueDate').isISO8601().withMessage('Fecha de vencimiento inválida'),
    body('priority').optional().isIn(['ALTA', 'MEDIA', 'BAJA']).withMessage('Prioridad inválida'),
    body('leadId').optional().isString(),
    body('propertyId').optional().isString(),
    body('assignedToId').optional().isString(),
    body('description').optional().trim(),
    body('notes').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, leadId, propertyId, assignedToId, notes } = req.body;

    // VENDEDOR: Auto-assign to themselves
    let finalAssignedToId = req.user.id;
    if (req.permissions.canViewAllLeads && assignedToId) {
      finalAssignedToId = assignedToId;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIA',
        status: 'PENDIENTE',
        leadId,
        propertyId,
        assignedToId: finalAssignedToId,
        createdById: req.user.id,
        notes
      },
      include: {
        lead: {
          select: { id: true, name: true }
        },
        property: {
          select: { id: true, title: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      message: 'Tarea creada correctamente',
      task
    });
  })
);

/**
 * PUT /api/tasks/:id
 * Update task
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  [
    body('title').optional().trim().notEmpty().withMessage('Título no puede estar vacío'),
    body('dueDate').optional().isISO8601().withMessage('Fecha de vencimiento inválida'),
    body('priority').optional().isIn(['ALTA', 'MEDIA', 'BAJA']).withMessage('Prioridad inválida'),
    body('status').optional().isIn(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA']).withMessage('Estado inválido')
  ],
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // VENDEDOR can only update their assigned tasks
    if (!req.permissions.canEditAnyLead && existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta tarea' });
    }

    const { title, description, dueDate, priority, status, leadId, propertyId, assignedToId, notes } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETADA') {
        updateData.completedAt = new Date();
      } else if (existingTask.status === 'COMPLETADA' && status !== 'COMPLETADA') {
        updateData.completedAt = null;
      }
    }
    if (leadId !== undefined) updateData.leadId = leadId;
    if (propertyId !== undefined) updateData.propertyId = propertyId;
    if (notes !== undefined) updateData.notes = notes;

    // Only admins can reassign tasks
    if (assignedToId !== undefined && req.permissions.canEditAnyLead) {
      updateData.assignedToId = assignedToId;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        lead: {
          select: { id: true, name: true }
        },
        property: {
          select: { id: true, title: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      message: 'Tarea actualizada correctamente',
      task
    });
  })
);

/**
 * PUT /api/tasks/:id/complete
 * Mark task as completed
 */
router.put('/:id/complete',
  authenticate,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes completar tus propias tareas' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETADA',
        completedAt: new Date()
      },
      include: {
        lead: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      message: 'Tarea completada',
      task
    });
  })
);

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.CRM),
  attachPermissions,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Only creator or admin can delete
    if (!req.permissions.canEditAnyLead && existingTask.createdById !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea' });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.json({ message: 'Tarea eliminada correctamente' });
  })
);

module.exports = router;
