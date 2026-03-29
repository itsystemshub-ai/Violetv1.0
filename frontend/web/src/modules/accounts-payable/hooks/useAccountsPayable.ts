/**
 * useAccountsPayable - Hook para gestión de cuentas por pagar
 */

import { useState, useEffect, useMemo } from 'react';

export interface AccountPayable {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  supplierRif?: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: 'USD' | 'VES';
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'scheduled';
  paymentTerms: number;
  category: 'inventory' | 'services' | 'utilities' | 'rent' | 'other';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  payments: Payment[];
  scheduledPayments?: ScheduledPayment[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  reference?: string;
  notes?: string;
}

export interface ScheduledPayment {
  id: string;
  scheduledDate: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export const useAccountsPayable = () => {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const mockAccounts: AccountPayable[] = [
      {
        id: 'AP-001',
        billNumber: 'BILL-001',
        supplierId: 'SUP-001',
        supplierName: 'Tech Supplies Inc.',
        supplierRif: 'J-11111111-1',
        billDate: '2026-02-20',
        dueDate: '2026-03-20',
        totalAmount: 85000,
        paidAmount: 0,
        balance: 85000,
        currency: 'USD',
        status: 'pending',
        paymentTerms: 30,
        category: 'inventory',
        priority: 'high',
        payments: [],
      },
      {
        id: 'AP-002',
        billNumber: 'BILL-002',
        supplierId: 'SUP-002',
        supplierName: 'Office Depot',
        supplierRif: 'J-22222222-2',
        billDate: '2026-01-15',
        dueDate: '2026-02-15',
        totalAmount: 45000,
        paidAmount: 0,
        balance: 45000,
        currency: 'USD',
        status: 'overdue',
        paymentTerms: 30,
        category: 'services',
        priority: 'high',
        payments: [],
        notes: 'Pago urgente - proveedor crítico',
      },
      {
        id: 'AP-003',
        billNumber: 'BILL-003',
        supplierId: 'SUP-003',
        supplierName: 'Servicios Públicos',
        supplierRif: 'J-33333333-3',
        billDate: '2026-03-01',
        dueDate: '2026-03-15',
        totalAmount: 12000,
        paidAmount: 12000,
        balance: 0,
        currency: 'USD',
        status: 'paid',
        paymentTerms: 15,
        category: 'utilities',
        priority: 'medium',
        payments: [
          {
            id: 'PAY-001',
            date: '2026-03-05',
            amount: 12000,
            method: 'transferencia',
            reference: 'TRF-001',
          },
        ],
      },
      {
        id: 'AP-004',
        billNumber: 'BILL-004',
        supplierId: 'SUP-004',
        supplierName: 'Arrendadora Inmobiliaria',
        supplierRif: 'J-44444444-4',
        billDate: '2026-03-01',
        dueDate: '2026-03-10',
        totalAmount: 25000,
        paidAmount: 0,
        balance: 25000,
        currency: 'USD',
        status: 'scheduled',
        paymentTerms: 10,
        category: 'rent',
        priority: 'high',
        payments: [],
        scheduledPayments: [
          {
            id: 'SCH-001',
            scheduledDate: '2026-03-10',
            amount: 25000,
            status: 'pending',
          },
        ],
      },
      {
        id: 'AP-005',
        billNumber: 'BILL-005',
        supplierId: 'SUP-005',
        supplierName: 'Global Electronics',
        supplierRif: 'J-55555555-5',
        billDate: '2026-02-28',
        dueDate: '2026-03-30',
        totalAmount: 150000,
        paidAmount: 75000,
        balance: 75000,
        currency: 'USD',
        status: 'partial',
        paymentTerms: 30,
        category: 'inventory',
        priority: 'medium',
        payments: [
          {
            id: 'PAY-002',
            date: '2026-03-05',
            amount: 75000,
            method: 'transferencia',
            reference: 'TRF-002',
          },
        ],
      },
    ];

    setTimeout(() => {
      setAccounts(mockAccounts);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = 
        account.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.supplierRif?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [accounts, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.totalAmount, 0);
    const paid = accounts.reduce((sum, acc) => sum + acc.paidAmount, 0);
    const pending = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const overdue = accounts
      .filter(acc => acc.status === 'overdue')
      .reduce((sum, acc) => sum + acc.balance, 0);
    const scheduled = accounts
      .filter(acc => acc.status === 'scheduled')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const dueThisWeek = accounts
      .filter(a => {
        if (a.status === 'paid') return false;
        const dueDate = new Date(a.dueDate);
        return dueDate >= now && dueDate <= weekFromNow;
      })
      .reduce((sum, a) => sum + a.balance, 0);
    
    return {
      total,
      paid,
      pending,
      overdue,
      scheduled,
      totalPayable: pending,
      dueThisWeek,
      pendingCount: accounts.filter(a => a.status === 'pending').length,
      partialCount: accounts.filter(a => a.status === 'partial').length,
      paidCount: accounts.filter(a => a.status === 'paid').length,
      overdueCount: accounts.filter(a => a.status === 'overdue').length,
      scheduledCount: accounts.filter(a => a.status === 'scheduled').length,
      highPriorityCount: accounts.filter(a => a.priority === 'high' && a.status !== 'paid').length,
      totalPorPagar: pending,
      vencidas: accounts.filter(a => a.status === 'overdue').length,
      pendientes: accounts.filter(a => a.status === 'pending').length,
      proveedores: new Set(accounts.map(a => a.supplierId)).size,
    };
  }, [accounts]);

  const registerPayment = (accountId: string, payment: Omit<Payment, 'id'>) => {
    setAccounts(accounts.map(account => {
      if (account.id === accountId) {
        const newPayment: Payment = {
          ...payment,
          id: `PAY-${Date.now()}`,
        };
        const newPaidAmount = account.paidAmount + payment.amount;
        const newBalance = account.totalAmount - newPaidAmount;
        const newStatus = newBalance === 0 ? 'paid' : newBalance < account.totalAmount ? 'partial' : account.status;
        
        return {
          ...account,
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
          payments: [...account.payments, newPayment],
        };
      }
      return account;
    }));
  };

  const schedulePayment = (accountId: string, scheduledDate: string, amount: number) => {
    setAccounts(accounts.map(account => {
      if (account.id === accountId) {
        const newScheduledPayment: ScheduledPayment = {
          id: `SCH-${Date.now()}`,
          scheduledDate,
          amount,
          status: 'pending',
        };
        
        return {
          ...account,
          status: 'scheduled',
          scheduledPayments: [...(account.scheduledPayments || []), newScheduledPayment],
        };
      }
      return account;
    }));
  };

  const createAccount = (account: Omit<AccountPayable, 'id' | 'balance' | 'paidAmount' | 'payments' | 'status'>) => {
    const newAccount: AccountPayable = {
      ...account,
      id: `AP-${String(accounts.length + 1).padStart(3, '0')}`,
      balance: account.totalAmount,
      paidAmount: 0,
      payments: [],
      status: 'pending',
    };
    setAccounts([newAccount, ...accounts]);
  };

  const updateAccount = (id: string, updates: Partial<AccountPayable>) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const priorityPayments = useMemo(() => {
    return accounts
      .filter(a => a.priority === 'high' && a.status !== 'paid')
      .map(a => ({
        id: a.id,
        supplierName: a.supplierName,
        invoiceNumber: a.billNumber,
        dueDate: a.dueDate,
        balance: a.balance,
        priority: a.priority,
      }));
  }, [accounts]);

  const getSupplierBalance = (supplierId: string) => {
    return accounts
      .filter(a => a.supplierId === supplierId && a.status !== 'paid')
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const getPaymentsDueThisWeek = () => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return accounts.filter(a => {
      if (a.status === 'paid') return false;
      const dueDate = new Date(a.dueDate);
      return dueDate >= now && dueDate <= weekFromNow;
    });
  };

  const getHighPriorityAccounts = () => {
    return accounts.filter(a => a.priority === 'high' && a.status !== 'paid');
  };

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    stats,
    priorityPayments,
    registerPayment,
    schedulePayment,
    createAccount,
    updateAccount,
    deleteAccount,
    getSupplierBalance,
    getPaymentsDueThisWeek,
    getHighPriorityAccounts,
  };
};
