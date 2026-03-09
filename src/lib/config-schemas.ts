import { z } from 'zod';

/**
 * Esquemas de validación dinámicos según el país/localización.
 * Permite que el ERP se adapte a diferentes legislaciones fiscales.
 */

export const getTaxSchema = (country: string = 'VE') => {
  if (country === 'VE') {
    return z.object({
      iva_general: z.number().min(0).max(100),
      iva_reducido: z.number().min(0).max(100),
      iva_lujo: z.number().min(0).max(100),
      igtf_divisas: z.number().min(0).max(100),
      rif_mask: z.string().regex(/^[GJPVNE]-[0-9]{8}-[0-9]$/, 'Formato de RIF inválido (Ej: J-12345678-0)'),
    });
  }
  
  // Default / Global schema
  return z.object({
    tax_rate: z.number().min(0).max(100),
    currency_symbol: z.string(),
  });
};

export const getTenantInfoSchema = (country: string = 'VE') => {
  return z.object({
    name: z.string().min(2, 'Nombre muy corto'),
    fiscalName: z.string().min(2, 'Razón social muy corta'),
    rif: country === 'VE' 
      ? z.string().regex(/^[GJPVNE]-[0-9]{8}-[0-9]$/, 'Formato de RIF inválido')
      : z.string().min(5),
    address: z.string().min(5, 'Dirección requerida'),
    phone: z.string().min(7, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional(),
  });
};

export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  blockedModules: z.array(z.string()),
  allowedRoles: z.array(z.string()),
});
