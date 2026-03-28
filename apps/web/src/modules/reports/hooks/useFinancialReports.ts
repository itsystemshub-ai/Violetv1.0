/**
 * useFinancialReports - Hook para reportes y análisis financieros (Modular)
 */

import { useState, useEffect } from 'react';

export interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  netFlow: number;
}

export interface ProfitLossData {
  category: string;
  amount: number;
  percentage: number;
  type: 'income' | 'expense';
}

export interface BalanceSheetData {
  category: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  cashFlow: CashFlowData[];
  profitLoss: ProfitLossData[];
  balanceSheet: BalanceSheetData[];
  revenueBySource: { source: string; amount: number; percentage: number }[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
}

export const useFinancialReports = () => {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [comparisonEnabled, setComparisonEnabled] = useState(true);

  useEffect(() => {
    const mockReport: FinancialReport = {
      period: 'Marzo 2026',
      totalRevenue: 1250000,
      totalExpenses: 875000,
      netProfit: 375000,
      profitMargin: 30,
      grossProfit: 625000,
      operatingExpenses: 250000,
      ebitda: 425000,
      cashFlow: [
        { date: '2026-03-01', income: 180000, expenses: 120000, netFlow: 60000 },
        { date: '2026-03-02', income: 195000, expenses: 135000, netFlow: 60000 },
        { date: '2026-03-03', income: 210000, expenses: 145000, netFlow: 65000 },
        { date: '2026-03-04', income: 225000, expenses: 155000, netFlow: 70000 },
        { date: '2026-03-05', income: 240000, expenses: 165000, netFlow: 75000 },
        { date: '2026-03-06', income: 200000, expenses: 155000, netFlow: 45000 },
      ],
      profitLoss: [
        { category: 'Ventas de Productos', amount: 1000000, percentage: 80, type: 'income' },
        { category: 'Servicios', amount: 200000, percentage: 16, type: 'income' },
        { category: 'Otros Ingresos', amount: 50000, percentage: 4, type: 'income' },
        { category: 'Costo de Ventas', amount: 625000, percentage: 50, type: 'expense' },
        { category: 'Gastos Operativos', amount: 150000, percentage: 12, type: 'expense' },
        { category: 'Gastos Administrativos', amount: 75000, percentage: 6, type: 'expense' },
        { category: 'Gastos de Marketing', amount: 25000, percentage: 2, type: 'expense' },
      ],
      balanceSheet: [
        { category: 'Efectivo', current: 450000, previous: 380000, change: 70000, changePercentage: 18.4 },
        { category: 'Cuentas por Cobrar', current: 320000, previous: 285000, change: 35000, changePercentage: 12.3 },
        { category: 'Inventario', current: 2850000, previous: 2650000, change: 200000, changePercentage: 7.5 },
        { category: 'Activos Fijos', current: 1500000, previous: 1500000, change: 0, changePercentage: 0 },
        { category: 'Cuentas por Pagar', current: 280000, previous: 320000, change: -40000, changePercentage: -12.5 },
        { category: 'Préstamos', current: 800000, previous: 850000, change: -50000, changePercentage: -5.9 },
      ],
      revenueBySource: [
        { source: 'Ventas Directas', amount: 750000, percentage: 60 },
        { source: 'Distribuidores', amount: 375000, percentage: 30 },
        { source: 'E-commerce', amount: 125000, percentage: 10 },
      ],
      expensesByCategory: [
        { category: 'Costo de Ventas', amount: 625000, percentage: 71.4 },
        { category: 'Gastos Operativos', amount: 150000, percentage: 17.1 },
        { category: 'Gastos Administrativos', amount: 75000, percentage: 8.6 },
        { category: 'Marketing', amount: 25000, percentage: 2.9 },
      ],
    };

    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 500);
  }, [periodFilter]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting financial report as ${format}`);
  };

  const compareWithPreviousPeriod = () => {
    return {
      revenueGrowth: 15.5,
      expensesGrowth: 8.2,
      profitGrowth: 28.3,
      marginImprovement: 3.2,
    };
  };

  const calculateFinancialRatios = () => {
    if (!report) return null;
    return {
      currentRatio: 2.5,
      quickRatio: 1.8,
      debtToEquity: 0.45,
      returnOnAssets: 12.5,
      returnOnEquity: 18.7,
    };
  };

  const getCashFlowTrend = () => {
    return report?.cashFlow || [];
  };

  const getProfitLossBreakdown = () => {
    return report?.profitLoss || [];
  };

  return {
    report,
    loading,
    periodFilter,
    setPeriodFilter,
    comparisonEnabled,
    setComparisonEnabled,
    exportReport,
    compareWithPreviousPeriod,
    calculateFinancialRatios,
    getCashFlowTrend,
    getProfitLossBreakdown,
  };
};
