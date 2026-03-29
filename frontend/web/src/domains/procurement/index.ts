/**
 * Procurement Domain - Índice Central
 * 
 * Agrupa: Compras, Proveedores, Cuentas por Pagar
 * 
 * @module domains/procurement
 */

// Purchases - Compras
export * from '@/modules/purchases';

// Accounts Payable - Cuentas por Pagar
export * from '@/modules/accounts-payable';

// Banks - Proveedores/Bancos
export * from '@/modules/banks';

/**
 * Servicios ERP del dominio Procurement
 */
export const procurementServices = {
  // Los servicios se importan directamente de los módulos
  // Ejemplo: import { PurchasesERPService } from '@/modules/purchases/services/PurchasesERPService';
};
