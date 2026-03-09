/**
 * useInventoryReports - Hook para reportes y análisis de inventario (Modular)
 */

import { useState, useEffect } from 'react';

export interface StockLevel {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  status: 'optimal' | 'low' | 'critical' | 'overstock';
  value: number;
}

export interface StockMovement {
  date: string;
  type: 'in' | 'out';
  quantity: number;
  value: number;
}

export interface InventoryReport {
  period: string;
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  criticalStockItems: number;
  overstockItems: number;
  stockTurnoverRate: number;
  averageDaysInStock: number;
  stockLevels: StockLevel[];
  stockMovements: StockMovement[];
  valueByCategory: { category: string; value: number; percentage: number }[];
  topMovingProducts: { productName: string; movements: number; value: number }[];
  slowMovingProducts: { productName: string; daysInStock: number; value: number }[];
}

export const useInventoryReports = () => {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mockReport: InventoryReport = {
      period: 'Marzo 2026',
      totalProducts: 127,
      totalValue: 2850000,
      lowStockItems: 12,
      criticalStockItems: 5,
      overstockItems: 8,
      stockTurnoverRate: 4.2,
      averageDaysInStock: 28,
      stockLevels: [
        {
          productId: 'PROD-001',
          productName: 'Laptop Dell Inspiron 15',
          category: 'Computadoras',
          currentStock: 8,
          minStock: 10,
          status: 'low',
          value: 96000,
        },
        {
          productId: 'PROD-002',
          productName: 'Mouse Logitech MX Master 3',
          category: 'Accesorios',
          currentStock: 3,
          minStock: 20,
          status: 'critical',
          value: 3000,
        },
        {
          productId: 'PROD-003',
          productName: 'Monitor Samsung 27" 4K',
          category: 'Monitores',
          currentStock: 25,
          minStock: 15,
          status: 'optimal',
          value: 162500,
        },
        {
          productId: 'PROD-004',
          productName: 'Teclado Mecánico RGB',
          category: 'Accesorios',
          currentStock: 45,
          minStock: 10,
          status: 'overstock',
          value: 81000,
        },
        {
          productId: 'PROD-005',
          productName: 'Impresora HP LaserJet',
          category: 'Impresoras',
          currentStock: 18,
          minStock: 10,
          status: 'optimal',
          value: 75600,
        },
      ],
      stockMovements: [
        { date: '2026-03-01', type: 'in', quantity: 150, value: 450000 },
        { date: '2026-03-02', type: 'out', quantity: 85, value: 255000 },
        { date: '2026-03-03', type: 'in', quantity: 120, value: 360000 },
        { date: '2026-03-04', type: 'out', quantity: 95, value: 285000 },
        { date: '2026-03-05', type: 'in', quantity: 180, value: 540000 },
        { date: '2026-03-06', type: 'out', quantity: 110, value: 330000 },
      ],
      valueByCategory: [
        { category: 'Computadoras', value: 1200000, percentage: 42.1 },
        { category: 'Monitores', value: 850000, percentage: 29.8 },
        { category: 'Accesorios', value: 450000, percentage: 15.8 },
        { category: 'Impresoras', value: 350000, percentage: 12.3 },
      ],
      topMovingProducts: [
        { productName: 'Laptop Dell Inspiron 15', movements: 45, value: 540000 },
        { productName: 'Monitor Samsung 27" 4K', movements: 38, value: 247000 },
        { productName: 'Mouse Logitech MX Master 3', movements: 120, value: 120000 },
        { productName: 'Teclado Mecánico RGB', movements: 85, value: 153000 },
        { productName: 'Impresora HP LaserJet', movements: 32, value: 134400 },
      ],
      slowMovingProducts: [
        { productName: 'Webcam Logitech C920', daysInStock: 85, value: 45000 },
        { productName: 'Silla Ergonómica', daysInStock: 72, value: 105000 },
        { productName: 'Escritorio Ajustable', daysInStock: 68, value: 180000 },
      ],
    };

    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 500);
  }, [periodFilter, statusFilter]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting inventory report as ${format}`);
  };

  const getStockAlerts = () => {
    if (!report) return [];
    return report.stockLevels.filter(item => 
      item.status === 'low' || item.status === 'critical'
    );
  };

  const getOverstockItems = () => {
    if (!report) return [];
    return report.stockLevels.filter(item => item.status === 'overstock');
  };

  const calculateReorderQuantity = (productId: string) => {
    const item = report?.stockLevels.find(i => i.productId === productId);
    if (!item) return 0;
    return Math.max(0, (item.minStock * 2) - item.currentStock);
  };

  return {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    statusFilter,
    setStatusFilter,
    exportReport,
    getStockAlerts,
    getOverstockItems,
    calculateReorderQuantity,
  };
};
