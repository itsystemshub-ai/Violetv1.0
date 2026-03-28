/**
 * usePayroll - Hook para gestión de nómina
 */

import { useState, useEffect } from 'react';

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
}

export const usePayroll = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mockPayrolls: Payroll[] = [
      {
        id: 'PAY-001',
        period: 'Marzo 2026 - Quincena 1',
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        paymentDate: '2026-03-16',
        items: [
          {
            employeeId: 'EMP-001',
            employeeName: 'Juan Pérez García',
            position: 'Gerente de Ventas',
            baseSalary: 17500,
            bonuses: 2000,
            deductions: 3500,
            netSalary: 16000,
          },
          {
            employeeId: 'EMP-002',
            employeeName: 'María González López',
            position: 'Contador',
            baseSalary: 14000,
            bonuses: 1000,
            deductions: 2800,
            netSalary: 12200,
          },
          {
            employeeId: 'EMP-003',
            employeeName: 'Carlos Rodríguez Sánchez',
            position: 'Desarrollador Senior',
            baseSalary: 16000,
            bonuses: 1500,
            deductions: 3200,
            netSalary: 14300,
          },
        ],
        totalEmployees: 3,
        totalBaseSalary: 47500,
        totalBonuses: 4500,
        totalDeductions: 9500,
        totalNetSalary: 42500,
        status: 'paid',
        createdBy: 'Patricia Sánchez',
        approvedBy: 'Director General',
        approvedDate: '2026-03-15',
        notes: 'Nómina quincenal pagada sin incidencias',
      },
      {
        id: 'PAY-002',
        period: 'Febrero 2026 - Quincena 2',
        startDate: '2026-02-16',
        endDate: '2026-02-28',
        paymentDate: '2026-03-01',
        items: [
          {
            employeeId: 'EMP-001',
            employeeName: 'Juan Pérez García',
            position: 'Gerente de Ventas',
            baseSalary: 17500,
            bonuses: 3000,
            deductions: 3500,
            netSalary: 17000,
          },
          {
            employeeId: 'EMP-002',
            employeeName: 'María González López',
            position: 'Contador',
            baseSalary: 14000,
            bonuses: 500,
            deductions: 2800,
            netSalary: 11700,
          },
        ],
        totalEmployees: 2,
        totalBaseSalary: 31500,
        totalBonuses: 3500,
        totalDeductions: 6300,
        totalNetSalary: 28700,
        status: 'paid',
        createdBy: 'Patricia Sánchez',
        approvedBy: 'Director General',
        approvedDate: '2026-02-28',
      },
      {
        id: 'PAY-003',
        period: 'Marzo 2026 - Quincena 2',
        startDate: '2026-03-16',
        endDate: '2026-03-31',
        paymentDate: '2026-04-01',
        items: [
          {
            employeeId: 'EMP-001',
            employeeName: 'Juan Pérez García',
            position: 'Gerente de Ventas',
            baseSalary: 17500,
            bonuses: 1500,
            deductions: 3500,
            netSalary: 15500,
          },
          {
            employeeId: 'EMP-002',
            employeeName: 'María González López',
            position: 'Contador',
            baseSalary: 14000,
            bonuses: 800,
            deductions: 2800,
            netSalary: 12000,
          },
          {
            employeeId: 'EMP-003',
            employeeName: 'Carlos Rodríguez Sánchez',
            position: 'Desarrollador Senior',
            baseSalary: 16000,
            bonuses: 2000,
            deductions: 3200,
            netSalary: 14800,
          },
          {
            employeeId: 'EMP-005',
            employeeName: 'Luis Hernández Torres',
            position: 'Supervisor de Almacén',
            baseSalary: 11000,
            bonuses: 500,
            deductions: 2000,
            netSalary: 9500,
          },
        ],
        totalEmployees: 4,
        totalBaseSalary: 58500,
        totalBonuses: 4800,
        totalDeductions: 11500,
        totalNetSalary: 51800,
        status: 'approved',
        createdBy: 'Patricia Sánchez',
        approvedBy: 'Director General',
        approvedDate: '2026-03-30',
        notes: 'Pendiente de pago',
      },
      {
        id: 'PAY-004',
        period: 'Abril 2026 - Quincena 1',
        startDate: '2026-04-01',
        endDate: '2026-04-15',
        paymentDate: '2026-04-16',
        items: [
          {
            employeeId: 'EMP-001',
            employeeName: 'Juan Pérez García',
            position: 'Gerente de Ventas',
            baseSalary: 17500,
            bonuses: 0,
            deductions: 3500,
            netSalary: 14000,
          },
          {
            employeeId: 'EMP-002',
            employeeName: 'María González López',
            position: 'Contador',
            baseSalary: 14000,
            bonuses: 0,
            deductions: 2800,
            netSalary: 11200,
          },
        ],
        totalEmployees: 2,
        totalBaseSalary: 31500,
        totalBonuses: 0,
        totalDeductions: 6300,
        totalNetSalary: 25200,
        status: 'calculated',
        createdBy: 'Patricia Sánchez',
        notes: 'Pendiente de aprobación',
      },
      {
        id: 'PAY-005',
        period: 'Abril 2026 - Quincena 2',
        startDate: '2026-04-16',
        endDate: '2026-04-30',
        paymentDate: '2026-05-01',
        items: [],
        totalEmployees: 0,
        totalBaseSalary: 0,
        totalBonuses: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        status: 'draft',
        createdBy: 'Patricia Sánchez',
        notes: 'Borrador en preparación',
      },
    ];

    setTimeout(() => {
      setPayrolls(mockPayrolls);
      setLoading(false);
    }, 500);
  }, []);

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
    avgPayroll: Math.round(
      payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalNetSalary, 0) / 
      payrolls.filter(p => p.status === 'paid').length
    ),
    totalEmployeesPaid: payrolls
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalEmployees, 0),
  };

  const createPayroll = (payroll: Omit<Payroll, 'id'>) => {
    const newPayroll: Payroll = {
      ...payroll,
      id: `PAY-${String(payrolls.length + 1).padStart(3, '0')}`,
    };
    setPayrolls([newPayroll, ...payrolls]);
  };

  const updatePayroll = (id: string, updates: Partial<Payroll>) => {
    setPayrolls(payrolls.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const deletePayroll = (id: string) => {
    setPayrolls(payrolls.filter(p => p.id !== id));
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
