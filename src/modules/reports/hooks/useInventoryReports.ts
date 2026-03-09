/**
 * useInventoryReports - Hook para reportes y análisis de inventario (Modular)
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { Product } from '@/lib/index';

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
  const { tenant } = useSystemConfig();
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchInventoryReport = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const products = (await localDb.products
        .where('tenant_id')
        .equals(tenant.id)
        .toArray()) as Product[];

      let totalValue = 0;
      let lowStockItems = 0;
      let criticalStockItems = 0;
      let overstockItems = 0;
      const stockLevels: StockLevel[] = [];

      products.forEach(p => {
        const val = p.price * p.stock;
        totalValue += val;

        let status: StockLevel['status'] = 'optimal';
        if (p.stock === 0 || p.stock <= p.minStock * 0.2) {
          status = 'critical';
          criticalStockItems++;
        } else if (p.stock <= p.minStock) {
          status = 'low';
          lowStockItems++;
        } else if (p.stock >= p.minStock * 3) {
          status = 'overstock';
          overstockItems++;
        }

        stockLevels.push({
          productId: p.id,
          productName: p.name,
          category: p.category || 'General',
          currentStock: p.stock,
          minStock: p.minStock,
          status,
          value: val
        });
      });

      const dynamicReport: InventoryReport = {
        period: periodFilter,
        totalProducts: products.length,
        totalValue,
        lowStockItems,
        criticalStockItems,
        overstockItems,
        stockTurnoverRate: 0, // Requires more complex calculations
        averageDaysInStock: 0,
        stockLevels,
        stockMovements: [],
        valueByCategory: [],
        topMovingProducts: [],
        slowMovingProducts: []
      };

      setReport(dynamicReport);
    } catch (error) {
      console.error('[useInventoryReports] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, periodFilter]);

  useEffect(() => {
    fetchInventoryReport();
  }, [fetchInventoryReport]);

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
