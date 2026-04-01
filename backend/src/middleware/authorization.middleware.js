const { hasModuleAccess, canCreateUserOfRole, hasPermission, getPermissions } = require('../config/permissions');

/**
 * Require specific role(s)
 * Usage: requireRole('SUPERADMIN') or requireRole(['SUPERADMIN', 'ADMIN'])
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        requiredRole: allowedRoles
      });
    }

    next();
  };
};

/**
 * Require access to a specific module
 * Usage: requireModule('caja')
 */
const requireModule = (module) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!hasModuleAccess(req.user.role, module)) {
      return res.status(403).json({
        error: 'No tienes acceso a este módulo',
        module
      });
    }

    next();
  };
};

/**
 * Check if user can create a user with specific role
 * Used in user creation endpoints
 */
const canCreateUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const targetRole = req.body.role || 'VENDEDOR';

  if (!canCreateUserOfRole(req.user.role, targetRole)) {
    return res.status(403).json({
      error: 'No puedes crear usuarios con este rol',
      yourRole: req.user.role,
      targetRole
    });
  }

  next();
};

/**
 * Check if user can manage (view/edit) another user
 * SUPERADMIN can manage all
 * ADMIN can manage VENDEDOR
 * VENDEDOR can only manage themselves
 */
const canManageUser = async (req, res, next) => {
  const prisma = require('../config/database');

  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const targetUserId = req.params.id;

  // Users can always manage themselves
  if (targetUserId === req.user.id) {
    return next();
  }

  // SUPERADMIN can manage all users
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true }
  });

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // ADMIN can only manage VENDEDOR
  if (req.user.role === 'ADMIN' && targetUser.role === 'VENDEDOR') {
    return next();
  }

  return res.status(403).json({
    error: 'No tienes permisos para gestionar este usuario'
  });
};

/**
 * Middleware to check specific permission
 * Usage: requirePermission('canViewCaja')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: 'No tienes permiso para esta acción',
        permission
      });
    }

    next();
  };
};

/**
 * Attach user permissions to request
 */
const attachPermissions = (req, res, next) => {
  if (req.user) {
    req.permissions = getPermissions(req.user.role);
  }
  next();
};

module.exports = {
  requireRole,
  requireModule,
  canCreateUser,
  canManageUser,
  requirePermission,
  attachPermissions
};
