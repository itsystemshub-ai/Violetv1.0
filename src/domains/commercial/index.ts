/**
 * Commercial Domain - Índice Central
 * 
 * Agrupa: CRM, Ventas, Facturación, Cuentas por Cobrar
 * 
 * @module domains/commercial
 */

// CRM
export * from '@/modules/crm';

// Sales - Ventas
export * from '@/modules/sales';

// Accounts Receivable - Cuentas por Cobrar
export * from '@/modules/accounts-receivable';

/**
 * Servicios ERP del dominio Commercial
 */
export const commercialServices = {
  // Los servicios se importan directamente de los módulos
  // Ejemplo: import { SalesERPService } from '@/modules/sales/services/SalesERPService';
};
