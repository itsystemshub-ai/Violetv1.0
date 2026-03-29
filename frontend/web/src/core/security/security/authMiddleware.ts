import { verifyToken, JWTPayload } from './jwt';
import { hasPermission, hasAnyPermission } from './permissions';
import { Permission } from '@/lib';

export interface AuthRequest {
  token?: string;
  user?: JWTPayload;
}

/**
 * Middleware para verificar autenticación.
 */
export function requireAuth(request: AuthRequest): boolean {
  if (!request.token) {
    throw new Error('No token provided');
  }

  const payload = verifyToken(request.token);
  
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  request.user = payload;
  return true;
}

/**
 * Middleware para verificar permisos específicos.
 */
export function requirePermission(
  request: AuthRequest,
  permission: Permission
): boolean {
  if (!request.user) {
    throw new Error('User not authenticated');
  }

  const user = {
    isSuperAdmin: request.user.isSuperAdmin,
    permissions: request.user.permissions as Permission[],
  };

  if (!hasPermission(user as any, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }

  return true;
}

/**
 * Middleware para verificar cualquiera de varios permisos.
 */
export function requireAnyPermission(
  request: AuthRequest,
  permissions: Permission[]
): boolean {
  if (!request.user) {
    throw new Error('User not authenticated');
  }

  const user = {
    isSuperAdmin: request.user.isSuperAdmin,
    permissions: request.user.permissions as Permission[],
  };

  if (!hasAnyPermission(user as any, permissions)) {
    throw new Error(`Missing any of permissions: ${permissions.join(', ')}`);
  }

  return true;
}

/**
 * Middleware para verificar que el usuario pertenece al tenant.
 */
export function requireTenant(
  request: AuthRequest,
  tenantId: string
): boolean {
  if (!request.user) {
    throw new Error('User not authenticated');
  }

  if (request.user.isSuperAdmin) {
    return true;
  }

  if (request.user.tenantId !== tenantId) {
    throw new Error('Access denied: wrong tenant');
  }

  return true;
}
