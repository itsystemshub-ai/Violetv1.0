/**
 * usePayroll - Hook para gestión de nómina
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

export interface PayrollItem {
  employeeId: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
}

export interface Payroll {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  items: PayrollItem[];
  totalEmployees: number;
  totalBaseSalary: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNetSalary: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
  tenant_id?: string;
}

export const usePayroll = () => {
  const { tenant } = useSystemConfig();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchPayrolls = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dbPayrolls = await localDb.payroll_records
        .where('tenant_id')
        .equals(tenant.id)
        .toArray();
      setPayrolls(dbPayrolls as Payroll[]);
    } catch (error) {
      console.error('[usePayroll] Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const filteredPayrolls = payrolls.filter((payroll) => {
    const matchesSearch = 
      payroll.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payroll.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payroll.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payroll.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPayrolls: payrolls.length,
    pendingPayrolls: payrolls.filter(p => p.status === 'calculated' || p.status === 'approved').length,
    paidPayrolls: payrolls.filter(p => p.status === 'paid').length,
    totalPaidThisMonth: payrolls
      .filter(p => {
        const payDate = new Date(p.paymentDate);
        const now = new Date();
        return p.status === 'paid' && 
               payDate.getMonth() === now.getMonth() && 
               payDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.totalNetSalary, 0),
    avgPayroll: payrolls.filter(p => p.status === 'paid').length > 0
      ? Math.round(
          payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalNetSalary, 0) / 
          payrolls.filter(p => p.status === 'paid').length
        )
      : 0,
    totalEmployeesPaid: payrolls
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalEmployees, 0),
  };

  const createPayroll = async (payroll: Omit<Payroll, 'id'>) => {
    if (!tenant?.id || tenant.id === 'none') return;
    const newPayroll: Payroll = {
      ...payroll,
      id: `PAY-${Date.now()}`,
    };
    try {
      await localDb.payroll_records.add({ ...newPayroll, tenant_id: tenant.id });
      setPayrolls(prev => [newPayroll, ...prev]);
    } catch (error) {
      console.error('[usePayroll] Error creating:', error);
    }
  };

  const updatePayroll = async (id: string, updates: Partial<Payroll>) => {
    if (!tenant?.id || tenant.id === 'none') return;
    try {
      await localDb.payroll_records.update(id, updates);
      setPayrolls(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
    } catch (error) {
      console.error('[usePayroll] Error updating:', error);
    }
  };

  const deletePayroll = async (id: string) => {
    if (!tenant?.id || tenant.id === 'none') return;
    try {
      await localDb.payroll_records.delete(id);
      setPayrolls(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('[usePayroll] Error deleting:', error);
    }
  };

  const calculatePayroll = (id: string) => {
    updatePayroll(id, { status: 'calculated' });
  };

  const approvePayroll = (id: string, approvedBy: string) => {
    updatePayroll(id, { 
      status: 'approved',
      approvedBy,
      approvedDate: new Date().toISOString().split('T')[0],
    });
  };

  const payPayroll = (id: string) => {
    updatePayroll(id, { status: 'paid' });
  };

  return {
    payrolls: filteredPayrolls,
    allPayrolls: payrolls,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createPayroll,
    updatePayroll,
    deletePayroll,
    calculatePayroll,
    approvePayroll,
    payPayroll,
  };
};
