/**
 * Helpers para validación de tenant
 * Elimina código duplicado de validación
 */

import { toast } from 'sonner';

/**
 * Verifica si un tenant ID es válido
 */
export const isValidTenantId = (tenantId: string | null | undefined): boolean => {
  if (!tenantId) return false;
  if (tenantId === 'none') return false;
  if (tenantId === 'neutral') return false;
  return true;
};

/**
 * Verifica si un tenant ID es válido para operaciones de datos
 */
export const isValidDataTenantId = (tenantId: string | null | undefined): boolean => {
  if (!tenantId) return false;
  if (tenantId === 'none') return false;
  // 'neutral' es válido para super admin
  return true;
};

/**
 * Valida tenant y muestra error si es inválido
 */
export const validateTenantOrError = (
  tenantId: string | null | undefined,
  errorMessage: string = 'No hay una empresa activa seleccionada.'
): boolean => {
  if (!isValidTenantId(tenantId)) {
    toast.error(errorMessage);
    return false;
  }
  return true;
};

/**
 * Valida tenant y lanza excepción si es inválido
 */
export const validateTenantOrThrow = (
  tenantId: string | null | undefined,
  errorMessage: string = 'No hay una empresa activa seleccionada.'
): asserts tenantId is string => {
  if (!isValidTenantId(tenantId)) {
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene tenant ID o lanza error
 */
export const requireTenantId = (
  tenantId: string | null | undefined,
  errorMessage: string = 'Tenant ID es requerido'
): string => {
  validateTenantOrThrow(tenantId, errorMessage);
  return tenantId;
};

/**
 * Verifica si es un UUID válido
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Valida que el tenant sea un UUID válido
 */
export const isValidTenantUUID = (tenantId: string | null | undefined): boolean => {
  if (!isValidTenantId(tenantId)) return false;
  if (tenantId === 'neutral') return true; // Caso especial para super admin
  return isValidUUID(tenantId);
};

/**
 * Resultado de validación con información detallada
 */
export interface TenantValidationResult {
  isValid: boolean;
  error?: string;
  tenantId?: string;
}

/**
 * Valida tenant con resultado detallado
 */
export const validateTenant = (
  tenantId: string | null | undefined
): TenantValidationResult => {
  if (!tenantId) {
    return {
      isValid: false,
      error: 'Tenant ID no proporcionado',
    };
  }

  if (tenantId === 'none') {
    return {
      isValid: false,
      error: 'No hay una empresa activa seleccionada',
    };
  }

  if (tenantId === 'neutral') {
    return {
      isValid: true,
      tenantId,
    };
  }

  if (!isValidUUID(tenantId)) {
    return {
      isValid: false,
      error: 'Tenant ID inválido (debe ser un UUID)',
    };
  }

  return {
    isValid: true,
    tenantId,
  };
};
