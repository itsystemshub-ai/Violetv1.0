/**
 * useAccountsReceivable - Hook para gestión de cuentas por cobrar
 */

import { useState, useEffect, useMemo } from 'react';

export interface AccountReceivable {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerRif?: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: 'USD' | 'VES';
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentTerms: number; // días
  notes?: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  reference?: string;
  notes?: string;
}

export interface AgingReport {
  current: number; // 0-30 días
  days30: number; // 31-60 días
  days60: number; // 61-90 días
  days90: number; // 91+ días
  total: number;
}

export const useAccountsReceivable = () => {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  useEffect(() => {
    const mockAccounts: AccountReceivable[] = [
      {
        id: 'AR-001',
        invoiceNumber: 'INV-001',
        customerId: 'CLI-001',
        customerName: 'Empresa ABC S.A.',
        customerRif: 'J-12345678-9',
        invoiceDate: '2026-02-15',
        dueDate: '2026-03-15',
        totalAmount: 50000,
        paidAmount: 25000,
        balance: 25000,
        currency: 'USD',
        status: 'partial',
        paymentTerms: 30,
        payments: [
          {
            id: 'PAY-001',
            date: '2026-02-20',
            amount: 25000,
            method: 'transferencia',
            reference: 'TRF-001',
          },
        ],
      },
      {
        id: 'AR-002',
        invoiceNumber: 'INV-002',
        customerId: 'CLI-002',
        customerName: 'Tech Solutions Ltd.',
        customerRif: 'J-98765432-1',
        invoiceDate: '2026-01-10',
        dueDate: '2026-02-10',
        totalAmount: 75000,
        paidAmount: 0,
        balance: 75000,
        currency: 'USD',
        status: 'overdue',
        paymentTerms: 30,
        payments: [],
        notes: 'Cliente con historial de pagos tardíos',
      },
      {
        id: 'AR-003',
        invoiceNumber: 'INV-003',
        customerId: 'CLI-003',
        customerName: 'Distribuidora XYZ',
        customerRif: 'J-11223344-5',
        invoiceDate: '2026-03-01',
        dueDate: '2026-04-01',
        totalAmount: 35000,
        paidAmount: 0,
        balance: 35000,
        currency: 'USD',
        status: 'pending',
        paymentTerms: 30,
        payments: [],
      },
      {
        id: 'AR-004',
        invoiceNumber: 'INV-004',
        customerId: 'CLI-004',
        customerName: 'Comercial 123',
        customerRif: 'J-55667788-9',
        invoiceDate: '2026-02-25',
        dueDate: '2026-03-25',
        totalAmount: 42000,
        paidAmount: 42000,
        balance: 0,
        currency: 'USD',
        status: 'paid',
        paymentTerms: 30,
        payments: [
          {
            id: 'PAY-002',
            date: '2026-03-05',
            amount: 42000,
            method: 'transferencia',
            reference: 'TRF-002',
          },
        ],
      },
      {
        id: 'AR-005',
        invoiceNumber: 'INV-005',
        customerId: 'CLI-005',
        customerName: 'Mayorista Global',
        customerRif: 'J-99887766-5',
        invoiceDate: '2025-12-15',
        dueDate: '2026-01-15',
        totalAmount: 120000,
        paidAmount: 0,
        balance: 120000,
        currency: 'USD',
        status: 'overdue',
        paymentTerms: 30,
        payments: [],
        notes: 'Cuenta vencida hace más de 60 días',
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
        account.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.customerRif?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesCurrency = currencyFilter === 'all' || account.currency === currencyFilter;
      
      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [accounts, searchQuery, statusFilter, currencyFilter]);

  const stats = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.totalAmount, 0);
    const paid = accounts.reduce((sum, acc) => sum + acc.paidAmount, 0);
    const pending = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const overdue = accounts
      .filter(acc => acc.status === 'overdue')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    return {
      total,
      paid,
      pending,
      overdue,
      pendingCount: accounts.filter(a => a.status === 'pending').length,
      partialCount: accounts.filter(a => a.status === 'partial').length,
      paidCount: accounts.filter(a => a.status === 'paid').length,
      overdueCount: accounts.filter(a => a.status === 'overdue').length,
    };
  }, [accounts]);

  const agingReport = useMemo((): AgingReport => {
    const now = new Date();
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      total: 0,
    };

    accounts.forEach(account => {
      if (account.status === 'paid') return;
      
      const dueDate = new Date(account.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue <= 0) {
        aging.current += account.balance;
      } else if (daysOverdue <= 30) {
        aging.days30 += account.balance;
      } else if (daysOverdue <= 60) {
        aging.days60 += account.balance;
      } else {
        aging.days90 += account.balance;
      }
      
      aging.total += account.balance;
    });

    return aging;
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

  const createAccount = (account: Omit<AccountReceivable, 'id' | 'balance' | 'paidAmount' | 'payments' | 'status'>) => {
    const newAccount: AccountReceivable = {
      ...account,
      id: `AR-${String(accounts.length + 1).padStart(3, '0')}`,
      balance: account.totalAmount,
      paidAmount: 0,
      payments: [],
      status: 'pending',
    };
    setAccounts([newAccount, ...accounts]);
  };

  const updateAccount = (id: string, updates: Partial<AccountReceivable>) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getCustomerBalance = (customerId: string) => {
    return accounts
      .filter(a => a.customerId === customerId && a.status !== 'paid')
      .reduce((sum, a) => sum + a.balance, 0);
  };

  const getOverdueAccounts = () => {
    return accounts.filter(a => a.status === 'overdue');
  };

  const getDueSoonAccounts = (days: number = 7) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return accounts.filter(a => {
      if (a.status === 'paid') return false;
      const dueDate = new Date(a.dueDate);
      return dueDate <= futureDate && dueDate >= new Date();
    });
  };

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currencyFilter,
    setCurrencyFilter,
    stats,
    agingReport,
    registerPayment,
    createAccount,
    updateAccount,
    deleteAccount,
    getCustomerBalance,
    getOverdueAccounts,
    getDueSoonAccounts,
  };
};
