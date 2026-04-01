const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../config/database');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole, canCreateUser, canManageUser, requirePermission } = require('../middleware/authorization.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * GET /api/users
 * Get all users (SUPERADMIN, ADMIN only)
 */
router.get('/',
  authenticate,
  requireRole(['SUPERADMIN', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const { role, isActive, search } = req.query;

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    // ADMIN can see ADMIN and VENDEDOR users (not SUPERADMIN)
    if (req.user.role === 'ADMIN') {
      where.role = { in: ['ADMIN', 'VENDEDOR'] };
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            assignedLeads: true,
            assignedProperties: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  })
);

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/:id',
  authenticate,
  canManageUser,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            assignedLeads: true,
            assignedProperties: true
          }
        }
      }
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  })
);

/**
 * POST /api/users
 * Create new user
 * - SUPERADMIN can create any role
 * - ADMIN can only create VENDEDOR
 * - VENDEDOR cannot create users
 */
router.post('/',
  authenticate,
  requirePermission('canManageUsers'),
  canCreateUser,
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
      .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número'),
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('role').optional().isIn(['SUPERADMIN', 'ADMIN', 'VENDEDOR']).withMessage('Rol inválido'),
    body('phone').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, phone } = req.body;

    const result = await authService.register(
      { email, password, name, role: role || 'VENDEDOR', phone },
      req.user.id
    );

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: result.user
    });
  })
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id',
  authenticate,
  canManageUser,
  [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('phone').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser boolean'),
    body('role').optional().isIn(['SUPERADMIN', 'ADMIN', 'VENDEDOR']).withMessage('Rol inválido')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, isActive, role } = req.body;
    const targetUserId = req.params.id;

    // Check role change permission
    if (role !== undefined && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Solo SUPERADMIN puede cambiar roles' });
    }

    // Check if trying to deactivate/modify self
    if (targetUserId === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Usuario actualizado correctamente',
      user
    });
  })
);

/**
 * DELETE /api/users/:id
 * Soft delete user (SUPERADMIN only)
 */
router.delete('/:id',
  authenticate,
  requireRole('SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;

    // Cannot delete self
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    // Revoke all tokens
    await authService.revokeAllUserTokens(targetUserId);

    res.json({ message: 'Usuario eliminado correctamente' });
  })
);

/**
 * POST /api/users/:id/reset-password
 * Reset user password (SUPERADMIN, ADMIN for VENDEDOR)
 */
router.post('/:id/reset-password',
  authenticate,
  canManageUser,
  [
    body('newPassword')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
      .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const targetUserId = req.params.id;

    // Cannot reset own password through this endpoint
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Usa /auth/change-password para cambiar tu propia contraseña' });
    }

    const passwordHash = await authService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash }
    });

    // Revoke all tokens (force re-login)
    await authService.revokeAllUserTokens(targetUserId);

    res.json({ message: 'Contraseña restablecida correctamente' });
  })
);

module.exports = router;
