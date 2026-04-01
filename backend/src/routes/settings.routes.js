const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

const SETTINGS_ID = 'global';

/**
 * GET /api/settings
 * Get app settings (public - no auth required for branding to load on login screen)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    let settings = await prisma.settings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        primaryColor: true,
        backgroundColor: true,
        companyName: true,
        logo: true,
        updatedAt: true
      }
    });

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        primaryColor: '#00D4FF',
        backgroundColor: '#0A0E14',
        companyName: 'DOMUM',
        logo: null,
        updatedAt: null
      };
    }

    res.json({ settings });
  })
);

/**
 * PUT /api/settings
 * Update app settings (SUPERADMIN only)
 */
router.put('/',
  authenticate,
  requireRole(['SUPERADMIN', 'ADMIN']),
  [
    body('primaryColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color primario debe ser un código HEX válido (#RRGGBB)'),
    body('backgroundColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color de fondo debe ser un código HEX válido (#RRGGBB)'),
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Nombre de empresa debe tener entre 1 y 100 caracteres'),
    body('logo')
      .optional({ nullable: true })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { primaryColor, backgroundColor, companyName, logo } = req.body;

    const updateData = {
      updatedById: req.user.id
    };

    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (logo !== undefined) updateData.logo = logo;

    // Upsert: create if not exists, update if exists
    const settings = await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...updateData
      },
      update: updateData,
      select: {
        primaryColor: true,
        backgroundColor: true,
        companyName: true,
        logo: true,
        updatedAt: true,
        updatedBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      message: 'Configuración actualizada correctamente',
      settings
    });
  })
);

module.exports = router;
