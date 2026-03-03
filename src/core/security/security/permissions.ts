/**
 * Sistema de validación de permisos
 * Verifica que los usuarios tengan los permisos necesarios para acceder a recursos
 */

import { User, Permission } from '@/lib';

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  // Super admins tienen todos los permisos
  if (user.isSuperAdmin) return true;
  
  // Verificar si el usuario tiene el permiso específico
  return user.permissions.includes(permission);
};

/**
 * Verifica si un usuario tiene al menos uno de los permisos especificados
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  
  return permissions.some(permission => user.permissions.includes(permission));
};

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  
  return permissions.every(permission => user.permissions.includes(permission));
};

/**
 * Verifica si un usuario tiene un rol específico
 */
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Verifica si un usuario tiene al menos uno de los roles especificados
 */
export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Mapa de permisos por módulo
 */
export const MODULE_PERMISSIONS: Record<string, Permission[]> = {
  dashboard: ['view:dashboard'],
  finance: ['view:finance', 'finance:read'],
  inventory: ['view:inventory', 'inventory:read'],
  sales: ['view:sales', 'sales:read'],
  purchases: ['view:purchases', 'purchases:read'],
  hr: ['view:hr', 'hr:read'],
  settings: ['view:settings', 'settings:read'],
};

/**
 * Verifica si un usuario puede acceder a un módulo
 */
export const canAccessModule = (user: User | null, module: keyof typeof MODULE_PERMISSIONS): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  
  const requiredPermissions = MODULE_PERMISSIONS[module];
  if (!requiredPermissions) return false;
  
  return hasAnyPermission(user, requiredPermissions);
};

/**
 * Obtiene los módulos a los que un usuario tiene acceso
 */
export const getAccessibleModules = (user: User | null): string[] => {
  if (!user) return [];
  if (user.isSuperAdmin) return Object.keys(MODULE_PERMISSIONS);
  
  return Object.keys(MODULE_PERMISSIONS).filter(module => 
    canAccessModule(user, module as keyof typeof MODULE_PERMISSIONS)
  );
};
