/**
 * DataAggregationService - Centraliza el cálculo de KPIs y métricas del sistema
 * Consume desde localDb para asegurar veracidad total de los datos.
 */

import { localDb } from "@/core/database/localDb";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from "date-fns";

export type DateRange = "hoy" | "esta_semana" | "este_mes" | "este_ano" | "all_time";

export class DataAggregationService {
  
  static async getGlobalKPIs(tenantId: string, dateRange: DateRange = "all_time") {
    if (!tenantId || tenantId === "none") return null;

    // 1. Obtener datos base
    const [invoices, accounts, products, employees] = await Promise.all([
      localDb.invoices.where("tenant_id").equals(tenantId).toArray(),
      localDb.financial_accounts.where("tenant_id").equals(tenantId).toArray(),
      localDb.products.where("tenant_id").equals(tenantId).toArray(),
      localDb.employees.where("tenant_id").equals(tenantId).toArray()
    ]);

    // 2. Filtrar por fecha
    const filteredInvoices = this.filterInvoicesByRange(invoices, dateRange);

    // 3. Cálculos de Ventas y Compras
    const salesInvoices = filteredInvoices.filter(inv => inv.type === "venta" && inv.status !== "anulada");
    const purchaseInvoices = filteredInvoices.filter(inv => inv.type === "compra" && inv.status !== "anulada");

    const totalSalesVolume = salesInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // 4. Cuentas por Cobrar/Pagar (SIEMPRE sobre facturas pendientes, independientemente del rango si es deuda)
    const pendingReceivables = invoices
      .filter(inv => inv.type === "venta" && inv.status === "pendiente")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const pendingPayables = invoices
      .filter(inv => inv.type === "compra" && inv.status === "pendiente")
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // 5. Finanzas (Balances actuales)
    const totalAssets = accounts.filter(a => a.type === "activo").reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalLiabilities = accounts.filter(a => a.type === "pasivo").reduce((sum, a) => sum + (a.balance || 0), 0);

    // 6. Inventario
    const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0)).length;
    const totalProducts = products.length;

    // 7. RRHH
    const activeEmployees = employees.filter(e => e.status === "activo").length;

    // 8. CRM
    const totalChats = await localDb.crm_chats.where("tenant_id").equals(tenantId).count();
    const unreadChats = await localDb.crm_chats
      .where("tenant_id")
      .equals(tenantId)
      .and(c => (c.unread_count || 0) > 0)
      .count();

    // 9. Márgenes
    const margin = totalSalesVolume > 0 
      ? ((totalSalesVolume - totalPurchases) / totalSalesVolume) * 100 
      : 0;

    return {
      sales: {
        totalVolume: totalSalesVolume,
        count: salesInvoices.length,
        averageTicket: salesInvoices.length > 0 ? totalSalesVolume / salesInvoices.length : 0
      },
      purchases: {
        totalVolume: totalPurchases,
        count: purchaseInvoices.length
      },
      finance: {
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        pendingReceivables,
        pendingPayables,
        margin: Math.max(0, margin)
      },
      inventory: {
        totalProducts,
        lowStockCount
      },
      hr: {
        activeEmployees
      },
      crm: {
        totalChats,
        unreadChats
      }
    };
  }

  private static filterInvoicesByRange(invoices: any[], range: DateRange) {
    if (range === "all_time") return invoices;

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "hoy": startDate = startOfDay(now); break;
      case "esta_semana": startDate = startOfWeek(now, { weekStartsOn: 1 }); break;
      case "este_mes": startDate = startOfMonth(now); break;
      case "este_ano": startDate = startOfYear(now); break;
      default: return invoices;
    }

    return invoices.filter(inv => {
      if (!inv.date) return false;
      const invDate = new Date(inv.date);
      return isAfter(invDate, startDate) || invDate.getTime() === startDate.getTime();
    });
  }
}
