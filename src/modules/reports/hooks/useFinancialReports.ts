/**
 * useFinancialReports - Hook para reportes y análisis financieros (Modular)
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { Invoice } from '@/lib/index';
import { Account } from '@/modules/finance/hooks/useAccounting';

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
  const { tenant } = useSystemConfig();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [comparisonEnabled, setComparisonEnabled] = useState(true);

  const fetchFinancialReport = useCallback(async () => {
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

      const accounts = (await localDb.financial_accounts
        .where('tenant_id')
        .equals(tenant.id)
        .toArray()) as Account[];

      let totalRevenue = 0;
      let totalExpenses = 0;
      const profitLoss: ProfitLossData[] = [];
      const balanceSheet: BalanceSheetData[] = [];

      invoices.forEach(inv => {
        if (inv.status !== 'anulada') {
          if (inv.type === 'venta') {
            totalRevenue += inv.total;
          } else if (inv.type === 'compra') {
            totalExpenses += inv.total;
          }
        }
      });

      accounts.forEach(acc => {
        if (acc.type === 'asset' || acc.type === 'liability' || acc.type === 'equity') {
          balanceSheet.push({
             category: acc.name,
             current: acc.balance,
             previous: 0,
             change: acc.balance,
             changePercentage: 0
          });
        }
      });

      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const dynamicReport: FinancialReport = {
        period: periodFilter,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        grossProfit: netProfit, // Simplified
        operatingExpenses: totalExpenses,
        ebitda: netProfit, // Simplified
        cashFlow: [], // Would stream from transactions
        profitLoss: profitLoss,
        balanceSheet: balanceSheet,
        revenueBySource: [{ source: 'Venta Directa', amount: totalRevenue, percentage: 100 }],
        expensesByCategory: [{ category: 'General', amount: totalExpenses, percentage: 100 }]
      };

      setReport(dynamicReport);
    } catch (error) {
      console.error('[useFinancialReports] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, periodFilter]);

  useEffect(() => {
    fetchFinancialReport();
  }, [fetchFinancialReport]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting financial report as ${format}`);
  };

  const compareWithPreviousPeriod = () => {
    return {
      revenueGrowth: 0,
      expensesGrowth: 0,
      profitGrowth: 0,
      marginImprovement: 0,
    };
  };

  const calculateFinancialRatios = () => {
    if (!report) return null;
    return {
      currentRatio: 0,
      quickRatio: 0,
      debtToEquity: 0,
      returnOnAssets: 0,
      returnOnEquity: 0,
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
