/**
 * ERP Reports Service - Servicio de Reportes Integrados del ERP
 * 
 * Genera reportes consolidados que combinan datos de múltiples módulos,
 * incluyendo estados financieros, KPIs de ventas, inventario, y más.
 * 
 * @module core/erp/reports
 */

import { companyContext } from '@/core/erp/company-context/CompanyContext';
import { transactionEngine } from '@/core/erp/transaction-engine/TransactionEngine';
import { accountingBridge } from '@/core/erp/accounting-bridge/AccountingBridge';
import { auditLog } from '@/core/erp/audit-log/AuditLogService';
import { localDb } from '@/core/database/localDb';

export interface ReportPeriod {
  startDate: string;
  endDate: string;
}

export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  averageTicket: number;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  salesByPaymentMethod: Record<string, number>;
  salesByStatus: Record<string, number>;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topMovements: Array<{ productName: string; type: string; quantity: number }>;
}

export interface FinancialReport {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  accountBalances: Record<string, number>;
}

export interface ERPReport {
  period: ReportPeriod;
  generatedAt: string;
  sales?: SalesReport;
  inventory?: InventoryReport;
  financial?: FinancialReport;
}

/**
 * ERP Reports Service
 */
class ERPReportsServiceClass {
  private static instance: ERPReportsServiceClass;

  private constructor() {
    console.log('[ERPReports] Servicio inicializado');
  }

  static getInstance(): ERPReportsServiceClass {
    if (!ERPReportsServiceClass.instance) {
      ERPReportsServiceClass.instance = new ERPReportsServiceClass();
    }
    return ERPReportsServiceClass.instance;
  }

  /**
   * Generar reporte completo del ERP
   */
  async generateFullReport(period: ReportPeriod): Promise<ERPReport | null> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) {
      console.error('[ERPReports] No hay empresa seleccionada');
      return null;
    }

    console.log(`[ERPReports] Generando reporte para periodo: ${period.startDate} - ${period.endDate}`);

    const [salesReport, inventoryReport, financialReport] = await Promise.all([
      this.generateSalesReport(companyId, period),
      this.generateInventoryReport(companyId, period),
      this.generateFinancialReport(companyId, period),
    ]);

    const report: ERPReport = {
      period,
      generatedAt: new Date().toISOString(),
      sales: salesReport,
      inventory: inventoryReport,
      financial: financialReport,
    };

    // Registrar en auditoría
    await auditLog.log({
      entityType: 'COMPANY',
      entityId: companyId,
      action: 'EXPORT',
      description: `Reporte ERP generado para periodo: ${period.startDate} - ${period.endDate}`,
    });

    return report;
  }

  /**
   * Generar reporte de ventas
   */
  async generateSalesReport(companyId: string, period: ReportPeriod): Promise<SalesReport> {
    const invoices = await localDb.invoices
      ?.where('tenant_id')
      .equals(companyId)
      .and(inv => 
        inv.created_at >= period.startDate && 
        inv.created_at <= period.endDate
      )
      .toArray() || [];

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalInvoices = invoices.length;
    const averageTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    // Productos más vendidos (agregando items)
    const productSales: Record<string, { quantity: number; total: number }> = {};
    invoices.forEach(inv => {
      try {
        const items = JSON.parse(inv.items || '[]');
        items.forEach((item: any) => {
          if (!productSales[item.productName]) {
            productSales[item.productName] = { quantity: 0, total: 0 };
          }
          productSales[item.productName].quantity += item.quantity || 0;
          productSales[item.productName].total += item.subtotal || 0;
        });
      } catch {}
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Ventas por método de pago
    const salesByPaymentMethod: Record<string, number> = {};
    invoices.forEach(inv => {
      const method = inv.payment_method || 'unknown';
      salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + (inv.total || 0);
    });

    // Ventas por estado
    const salesByStatus: Record<string, number> = {};
    invoices.forEach(inv => {
      const status = inv.status || 'unknown';
      salesByStatus[status] = (salesByStatus[status] || 0) + 1;
    });

    return {
      totalSales,
      totalInvoices,
      averageTicket,
      topProducts,
      salesByPaymentMethod,
      salesByStatus,
    };
  }

  /**
   * Generar reporte de inventario
   */
  async generateInventoryReport(companyId: string, period: ReportPeriod): Promise<InventoryReport> {
    const products = await localDb.products
      ?.where('tenant_id')
      .equals(companyId)
      .toArray() || [];

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => 
      sum + ((p.stock || 0) * (p.price || 0)), 0
    );

    const lowStockProducts = products.filter(p => 
      (p.stock || 0) < (p.stock_minimo || 10) && (p.stock || 0) > 0
    ).length;

    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0).length;

    // Movimientos de inventario
    const movements = await localDb.inventory_movements
      ?.where('tenant_id')
      .equals(companyId)
      .and(m => m.created_at >= period.startDate && m.created_at <= period.endDate)
      .toArray() || [];

    const topMovements = movements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(m => ({
        productName: m.product_name,
        type: m.type,
        quantity: m.quantity,
      }));

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      topMovements,
    };
  }

  /**
   * Generar reporte financiero
   */
  async generateFinancialReport(companyId: string, period: ReportPeriod): Promise<FinancialReport> {
    // Calcular ingresos (ventas completadas)
    const invoices = await localDb.invoices
      ?.where('tenant_id')
      .equals(companyId)
      .and(inv => 
        inv.created_at >= period.startDate && 
        inv.created_at <= period.endDate &&
        (inv.status === 'paid' || inv.status === 'completed')
      )
      .toArray() || [];

    const totalIncome = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calcular gastos (compras)
    const purchases = await localDb.compras_maestro
      ?.where('tenant_id')
      .equals(companyId)
      .and(p => 
        p.created_at >= period.startDate && 
        p.created_at <= period.endDate &&
        (p.status === 'received' || p.status === 'paid')
      )
      .toArray() || [];

    const totalExpenses = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Cuentas por cobrar
    const accountsReceivable = await localDb.accounts_receivable
      ?.where('tenant_id')
      .equals(companyId)
      .and(ar => ar.status === 'pending')
      .toArray() || [];
    const totalReceivable = accountsReceivable.reduce((sum, ar) => sum + (ar.amount || 0), 0);

    // Cuentas por pagar
    const accountsPayable = await localDb.compras_maestro
      ?.where('tenant_id')
      .equals(companyId)
      .and(p => p.status === 'approved')
      .toArray() || [];
    const totalPayable = accountsPayable.reduce((sum, p) => sum + (p.total || 0), 0);

    // Saldos de cuentas contables
    const accountBalances: Record<string, number> = {};
    const importantAccounts = ['1100', '1200', '1300', '2100', '4000', '5000'];
    
    for (const code of importantAccounts) {
      accountBalances[code] = await accountingBridge.getAccountBalance(code, companyId);
    }

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      accountsReceivable: totalReceivable,
      accountsPayable: totalPayable,
      accountBalances,
    };
  }

  /**
   * Obtener KPIs rápidos
   */
  async getQuickKPIs(companyId: string): Promise<{
    todaySales: number;
    pendingOrders: number;
    lowStockCount: number;
    pendingApprovals: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    // Ventas de hoy
    const todayInvoices = await localDb.invoices
      ?.where('tenant_id')
      .equals(companyId)
      .and(inv => inv.created_at?.startsWith(today))
      .toArray() || [];
    const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Órdenes pendientes
    const pendingOrders = await localDb.compras_maestro
      ?.where('tenant_id')
      .equals(companyId)
      .and(p => p.status === 'pending')
      .count() || 0;

    // Productos con stock bajo
    const products = await localDb.products?.toArray() || [];
    const lowStockCount = products.filter(p => 
      (p.stock || 0) < (p.stock_minimo || 10)
    ).length;

    // Aprobaciones pendientes (workflows)
    const pendingWorkflows = await localDb.workflow_instances
      ?.where('status')
      .equals('PENDING')
      .count() || 0;

    return {
      todaySales,
      pendingOrders,
      lowStockCount,
      pendingApprovals: pendingWorkflows,
    };
  }
}

export const erpReportsService = ERPReportsServiceClass.getInstance();
export default erpReportsService;