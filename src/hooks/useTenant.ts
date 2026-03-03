import { useSystemConfig } from './useSystemConfig';

/**
 * Hook useTenant (DEPRECATED)
 * 
 * @deprecated Este hook ha sido unificado con `useSystemConfig`. 
 * Use `useSystemConfig` directamente para acceder al estado del tenant y branding.
 * 
 * Este archivo se mantiene temporalmente para retrocompatibilidad.
 */
export const useTenant = () => {
  const { 
    tenant, 
    allTenants, 
    setActiveTenant,
    updateTenantConfig 
  } = useSystemConfig();

  /**
   * Obtiene la relación de aspecto del logo si es necesario (legacy)
   */
  const getTenantLogo = () => {
    if (!tenant.logoUrl || tenant.id === 'none') return '';
    return tenant.logoUrl;
  };

  return {
    tenant,
    allTenants,
    switchTenant: setActiveTenant,
    updateTenantConfig,
    getTenantLogo,
  };
};
