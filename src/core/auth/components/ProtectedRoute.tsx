import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Permission } from '@/lib';
import { hasPermission, hasAnyPermission } from '@/core/security/security/permissions';
import { TenantBranding } from "@/shared/components/common/TenantBranding";
import { Layout } from "@/shared/components/layout/Layout";

/**
 * Componente de ruta protegida con validación de permisos
 * Verifica autenticación y permisos antes de renderizar el contenido
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user } = useAuth();

  // Verificar autenticación
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar permiso único
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar múltiples permisos
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? requiredPermissions.every(perm => hasPermission(user, perm))
      : hasAnyPermission(user, requiredPermissions);

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return (
    <TenantBranding>
      <Layout>{children}</Layout>
    </TenantBranding>
  );
};

/**
 * HOC para proteger componentes con permisos
 */
export const withPermission = (
  Component: React.ComponentType<any>,
  requiredPermission: Permission
) => {
  return (props: any) => (
    <ProtectedRoute requiredPermission={requiredPermission}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Hook para verificar permisos en componentes
 */
export const usePermission = (permission: Permission): boolean => {
  const { user } = useAuth();
  return hasPermission(user, permission);
};

/**
 * Componente condicional basado en permisos
 */
interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const hasAccess = usePermission(permission);
  return <>{hasAccess ? children : fallback}</>;
};
