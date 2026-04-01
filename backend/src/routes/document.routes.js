const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { MODULES } = require('../config/permissions');

const router = express.Router();

/**
 * GET /api/documents
 * Get all generated documents with optional filters
 */
router.get('/',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  asyncHandler(async (req, res) => {
    const { category, status, templateId, page = 1, limit = 50 } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (templateId) {
      where.templateId = templateId;
    }

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true, address: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.generatedDocument.count({ where })
    ]);

    res.json({
      documents,
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
 * GET /api/documents/stats
 * Get document statistics
 */
router.get('/stats',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  asyncHandler(async (req, res) => {
    const [
      totalDocuments,
      byCategory,
      byStatus,
      recentDocuments
    ] = await Promise.all([
      prisma.generatedDocument.count(),
      prisma.generatedDocument.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      prisma.generatedDocument.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.generatedDocument.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      stats: {
        totalDocuments,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count.id;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        recentDocuments
      }
    });
  })
);

/**
 * GET /api/documents/:id
 * Get a single document by ID
 */
router.get('/:id',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  asyncHandler(async (req, res) => {
    const document = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id },
      include: {
        property: {
          select: { id: true, title: true, address: true, type: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({ document });
  })
);

/**
 * POST /api/documents
 * Create a new generated document
 */
router.post('/',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  [
    body('templateId').notEmpty().withMessage('El ID del template es requerido'),
    body('templateName').notEmpty().withMessage('El nombre del template es requerido'),
    body('category').notEmpty().withMessage('La categoria es requerida'),
    body('title').notEmpty().withMessage('El titulo es requerido'),
    body('content').notEmpty().withMessage('El contenido es requerido')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      templateId,
      templateName,
      category,
      title,
      content,
      formData,
      status,
      notes,
      propertyId
    } = req.body;

    const document = await prisma.generatedDocument.create({
      data: {
        templateId,
        templateName,
        category,
        title,
        content,
        formData: formData || null,
        status: status || 'borrador',
        notes,
        propertyId: propertyId || null,
        createdById: req.user.id
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      message: 'Documento creado exitosamente',
      document
    });
  })
);

/**
 * PUT /api/documents/:id
 * Update a document
 */
router.put('/:id',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  [
    body('title').optional().notEmpty(),
    body('content').optional().notEmpty(),
    body('status').optional().isIn(['borrador', 'finalizado', 'enviado'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const {
      title,
      content,
      formData,
      status,
      notes,
      propertyId
    } = req.body;

    const document = await prisma.generatedDocument.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(formData !== undefined && { formData }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(propertyId !== undefined && { propertyId })
      },
      include: {
        property: {
          select: { id: true, title: true, address: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      message: 'Documento actualizado',
      document
    });
  })
);

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id',
  authenticate,
  requireModule(MODULES.DOCUMENTOS),
  asyncHandler(async (req, res) => {
    const existing = await prisma.generatedDocument.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    await prisma.generatedDocument.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Documento eliminado' });
  })
);

module.exports = router;
