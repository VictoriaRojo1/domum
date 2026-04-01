/**
 * DOMUM - Permission Configuration
 *
 * Defines module access for each role:
 * - SUPERADMIN: Full access to everything
 * - ADMIN: Everything except 'caja' (cash register)
 * - VENDEDOR: Limited to properties (read) and CRM (only assigned leads)
 */

const MODULES = {
  DASHBOARD: 'dashboard',
  PROPIEDADES: 'propiedades',
  CRM: 'crm',
  CONTACTOS: 'contactos',
  CALENDARIO: 'calendario',
  ALQUILERES: 'alquileres',
  CAJA: 'caja',
  REPORTES: 'reportes',
  CONFIGURACION: 'configuracion',
  USUARIOS: 'usuarios',
  ADMINISTRACIONES: 'administraciones',
  DOCUMENTOS: 'documentos'
};

const ROLE_PERMISSIONS = {
  SUPERADMIN: {
    modules: Object.values(MODULES), // All modules
    canCreateUsers: ['SUPERADMIN', 'ADMIN', 'VENDEDOR'],
    canViewAllLeads: true,
    canViewAllProperties: true,
    canEditAnyLead: true,
    canEditAnyProperty: true,
    canViewCaja: true,
    canManageUsers: true,
    canDeleteUsers: true,
    canChangeUserRoles: true
  },
  ADMIN: {
    modules: Object.values(MODULES).filter(m => m !== MODULES.CAJA),
    canCreateUsers: ['VENDEDOR'], // Can only create VENDEDOR
    canViewAllLeads: true,
    canViewAllProperties: true,
    canEditAnyLead: true,
    canEditAnyProperty: true,
    canViewCaja: false, // Cannot view caja
    canManageUsers: true,
    canDeleteUsers: false, // Cannot delete users
    canChangeUserRoles: false // Cannot change roles
  },
  VENDEDOR: {
    modules: [MODULES.DASHBOARD, MODULES.PROPIEDADES, MODULES.CRM, MODULES.CALENDARIO],
    canCreateUsers: [], // Cannot create users
    canViewAllLeads: false, // Only assigned leads
    canViewAllProperties: true, // Can view all properties (read only)
    canEditAnyLead: false, // Only assigned leads
    canEditAnyProperty: false, // Cannot edit properties
    canViewCaja: false,
    canManageUsers: false,
    canDeleteUsers: false,
    canChangeUserRoles: false
  }
};

/**
 * Check if a role has access to a specific module
 */
const hasModuleAccess = (role, module) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.modules.includes(module);
};

/**
 * Check if a role can create a specific user type
 */
const canCreateUserOfRole = (creatorRole, targetRole) => {
  const permissions = ROLE_PERMISSIONS[creatorRole];
  if (!permissions) return false;
  return permissions.canCreateUsers.includes(targetRole);
};

/**
 * Get all permissions for a role
 */
const getPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || null;
};

/**
 * Check specific permission for a role
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions[permission] === true;
};

module.exports = {
  MODULES,
  ROLE_PERMISSIONS,
  hasModuleAccess,
  canCreateUserOfRole,
  getPermissions,
  hasPermission
};
