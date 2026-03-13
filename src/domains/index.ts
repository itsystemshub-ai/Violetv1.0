/**
 * Domains - Índice Central de Dominios ERP
 * 
 * Este archivo proporciona acceso a los dominios del sistema.
 * En lugar de re-exportar todo (lo cual causa conflictos de nombres),
 * se importan los módulos específicos según necesidad.
 * 
 * Arquitectura de Dominios:
 * - commercial: CRM, Ventas, Facturación, CxC
 * - procurement: Compras, Proveedores, CxP
 * - operations: Inventario
 * - finance: Finanzas, Contabilidad
 * - hcm: Recursos Humanos
 * 
 * @module domains
 */

/**
 * Dominio Commercial
 * 
 * Módulos: CRM, Ventas, Cuentas por Cobrar
 * 
 * @example
 * // Importar desde el módulo específico
 * import { CRMPage } from '@/modules/crm';
 * import { SalesERPService } from '@/modules/sales/services/SalesERPService';
 */
export const commercial = {
  crm: () => import('@/modules/crm'),
  sales: () => import('@/modules/sales'),
  accountsReceivable: () => import('@/modules/accounts-receivable'),
};

/**
 * Dominio Procurement
 * 
 * Módulos: Compras, Cuentas por Pagar, Bancos
 */
export const procurement = {
  purchases: () => import('@/modules/purchases'),
  accountsPayable: () => import('@/modules/accounts-payable'),
  banks: () => import('@/modules/banks'),
};

/**
 * Dominio Operations
 * 
 * Módulos: Inventario
 */
export const operations = {
  inventory: () => import('@/modules/inventory'),
};

/**
 * Dominio Finance
 * 
 * Módulos: Finanzas
 */
export const finance = {
  finance: () => import('@/modules/finance'),
};

/**
 * Dominio HCM (Human Capital Management)
 * 
 * Módulos: Recursos Humanos
 */
export const hcm = {
  hr: () => import('@/modules/hr'),
};

/**
 * Módulos transversales que no pertenecen a un dominio específico
 */
export const crossCutting = {
  ai: () => import('@/modules/ai'),
  auth: () => import('@/modules/auth'),
  settings: () => import('@/modules/settings'),
  reports: () => import('@/modules/reports'),
  dashboard: () => import('@/modules/dashboard'),
};

/**
 * Uso recomendado:
 * 
 * // Importar módulos específicos
 * import { SalesERPService } from '@/modules/sales/services/SalesERPService';
 * import { PurchasesERPService } from '@/modules/purchases/services/PurchasesERPService';
 * import { InventoryERPService } from '@/modules/inventory/services/InventoryERPService';
 * 
 * // O usar lazy loading por dominio
 * const { commercial } = await import('@/domains');
 */
