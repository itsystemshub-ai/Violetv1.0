/**
 * useSalesReports - Hook para reportes y análisis de ventas (Modular)
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { Invoice } from '@/lib/index';

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface ProductSales {
  productId: string;
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

export interface CustomerSales {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastPurchase: string;
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  topProducts: ProductSales[];
  topCustomers: CustomerSales[];
  salesByDay: SalesData[];
  salesByCategory: { category: string; revenue: number; percentage: number }[];
  salesByPaymentMethod: { method: string; amount: number; percentage: number }[];
}

export const useSalesReports = () => {
  const { tenant } = useSystemConfig();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchSalesReport = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const invoices = (await localDb.invoices
        .where('tenant_id')
        .equals(tenant.id)
        .toArray()) as Invoice[];

      const validInvoices = invoices.filter(i => i.type === 'venta' && i.status !== 'anulada');

      let totalRevenue = 0;
      let totalOrders = validInvoices.length;
      let topProductsMap = new Map<string, ProductSales>();
      let topCustomersMap = new Map<string, CustomerSales>();
      let salesByDayMap = new Map<string, SalesData>();

      validInvoices.forEach(inv => {
        totalRevenue += inv.total;
        
        // Sales by day
        const day = inv.date;
        const currentDay = salesByDayMap.get(day) || { date: day, sales: 0, orders: 0, revenue: 0 };
        currentDay.orders += 1;
        currentDay.sales += 1;
        currentDay.revenue += inv.total;
        salesByDayMap.set(day, currentDay);

        // Top Customers
        if (inv.customerId) {
          const cust = topCustomersMap.get(inv.customerId) || {
             customerId: inv.customerId,
             customerName: inv.customerName,
             totalOrders: 0,
             totalRevenue: 0,
             averageOrderValue: 0,
             lastPurchase: inv.date
          };
          cust.totalOrders += 1;
          cust.totalRevenue += inv.total;
          if (new Date(inv.date) > new Date(cust.lastPurchase)) {
            cust.lastPurchase = inv.date;
          }
          topCustomersMap.set(inv.customerId, cust);
        }

        // Top Products
        inv.items.forEach(item => {
          const prod = topProductsMap.get(item.productId) || {
            productId: item.productId,
            productName: item.name,
            category: 'General',
            unitsSold: 0,
            revenue: 0,
            profit: 0,
            profitMargin: 0
          };
          prod.unitsSold += item.quantity;
          prod.revenue += item.total;
          prod.profit += item.total * 0.3; // estimated 30% profit
          topProductsMap.set(item.productId, prod);
        });
      });

      // Calculate averages and margins
      for (const [_, cust] of topCustomersMap) {
        cust.averageOrderValue = cust.totalOrders > 0 ? cust.totalRevenue / cust.totalOrders : 0;
      }
      for (const [_, prod] of topProductsMap) {
        prod.profitMargin = prod.revenue > 0 ? (prod.profit / prod.revenue) * 100 : 0;
      }

      const topProducts = Array.from(topProductsMap.values()).sort((a,b) => b.revenue - a.revenue);
      const topCustomers = Array.from(topCustomersMap.values()).sort((a,b) => b.totalRevenue - a.totalRevenue);
      const salesByDay = Array.from(salesByDayMap.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const dynamicReport: SalesReport = {
        period: periodFilter,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalProfit: totalRevenue * 0.3, // Example estimated profit
        profitMargin: 30,
        topProducts,
        topCustomers,
        salesByDay,
        salesByCategory: [],
        salesByPaymentMethod: []
      };

      setReport(dynamicReport);
    } catch (error) {
      console.error('[useSalesReports] Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, periodFilter]);

  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting report as ${format}`);
  };

  const compareWithPreviousPeriod = () => {
    return {
      revenueGrowth: 0,
      ordersGrowth: 0,
      profitGrowth: 0,
    };
  };

  const getTopSellingProducts = (limit: number = 5) => {
    return report?.topProducts.slice(0, limit) || [];
  };

  const getTopCustomers = (limit: number = 5) => {
    return report?.topCustomers.slice(0, limit) || [];
  };

  const getSalesTrend = () => {
    return report?.salesByDay || [];
  };

  return {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    categoryFilter,
    setCategoryFilter,
    exportReport,
    compareWithPreviousPeriod,
    getTopSellingProducts,
    getTopCustomers,
    getSalesTrend,
  };
};
