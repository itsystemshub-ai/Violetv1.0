/**
 * useSalesReports - Hook para reportes y análisis de ventas (Modular)
 */

import { useState, useEffect } from 'react';

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
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const mockReport: SalesReport = {
      period: 'Marzo 2026',
      totalRevenue: 1250000,
      totalOrders: 156,
      averageOrderValue: 8013,
      totalProfit: 375000,
      profitMargin: 30,
      topProducts: [
        {
          productId: 'PROD-001',
          productName: 'Laptop Dell Inspiron 15',
          category: 'Computadoras',
          unitsSold: 45,
          revenue: 540000,
          profit: 135000,
          profitMargin: 25,
        },
        {
          productId: 'PROD-003',
          productName: 'Monitor Samsung 27" 4K',
          category: 'Monitores',
          unitsSold: 68,
          revenue: 442000,
          profit: 132600,
          profitMargin: 30,
        },
        {
          productId: 'PROD-005',
          productName: 'Impresora HP LaserJet',
          category: 'Impresoras',
          unitsSold: 32,
          revenue: 134400,
          profit: 40320,
          profitMargin: 30,
        },
        {
          productId: 'PROD-002',
          productName: 'Mouse Logitech MX Master 3',
          category: 'Accesorios',
          unitsSold: 120,
          revenue: 120000,
          profit: 36000,
          profitMargin: 30,
        },
        {
          productId: 'PROD-004',
          productName: 'Teclado Mecánico RGB',
          category: 'Accesorios',
          unitsSold: 85,
          revenue: 153000,
          profit: 45900,
          profitMargin: 30,
        },
      ],
      topCustomers: [
        {
          customerId: 'CLI-001',
          customerName: 'Empresa ABC S.A.',
          totalOrders: 24,
          totalRevenue: 285000,
          averageOrderValue: 11875,
          lastPurchase: '2026-03-05',
        },
        {
          customerId: 'CLI-002',
          customerName: 'Tech Solutions Ltd.',
          totalOrders: 18,
          totalRevenue: 198000,
          averageOrderValue: 11000,
          lastPurchase: '2026-03-04',
        },
        {
          customerId: 'CLI-003',
          customerName: 'Distribuidora XYZ',
          totalOrders: 15,
          totalRevenue: 165000,
          averageOrderValue: 11000,
          lastPurchase: '2026-03-03',
        },
        {
          customerId: 'CLI-004',
          customerName: 'Comercial 123',
          totalOrders: 12,
          totalRevenue: 132000,
          averageOrderValue: 11000,
          lastPurchase: '2026-03-02',
        },
        {
          customerId: 'CLI-005',
          customerName: 'Mayorista Global',
          totalOrders: 10,
          totalRevenue: 110000,
          averageOrderValue: 11000,
          lastPurchase: '2026-03-01',
        },
      ],
      salesByDay: [
        { date: '2026-03-01', sales: 12, orders: 12, revenue: 95000 },
        { date: '2026-03-02', sales: 15, orders: 15, revenue: 120000 },
        { date: '2026-03-03', sales: 18, orders: 18, revenue: 145000 },
        { date: '2026-03-04', sales: 22, orders: 22, revenue: 175000 },
        { date: '2026-03-05', sales: 25, orders: 25, revenue: 200000 },
        { date: '2026-03-06', sales: 28, orders: 28, revenue: 225000 },
      ],
      salesByCategory: [
        { category: 'Computadoras', revenue: 540000, percentage: 43.2 },
        { category: 'Monitores', revenue: 442000, percentage: 35.4 },
        { category: 'Accesorios', revenue: 273000, percentage: 21.8 },
        { category: 'Impresoras', revenue: 134400, percentage: 10.8 },
      ],
      salesByPaymentMethod: [
        { method: 'Tarjeta de Crédito', amount: 625000, percentage: 50 },
        { method: 'Transferencia', amount: 437500, percentage: 35 },
        { method: 'Efectivo', amount: 187500, percentage: 15 },
      ],
    };

    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 500);
  }, [periodFilter, categoryFilter]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting report as ${format}`);
    // Implementar lógica de exportación
  };

  const compareWithPreviousPeriod = () => {
    // Implementar comparación con período anterior
    return {
      revenueGrowth: 15.5,
      ordersGrowth: 12.3,
      profitGrowth: 18.2,
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
