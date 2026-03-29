/**
 * useBanks - Hook para gestión de cuentas bancarias y conciliación
 */

import { useState, useEffect, useMemo } from 'react';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  currency: 'USD' | 'VES';
  balance: number;
  availableBalance: number;
  status: 'active' | 'inactive' | 'blocked';
  openingDate: string;
  lastReconciliation?: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest';
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  category?: string;
  reconciled: boolean;
  reconciledDate?: string;
}

export interface ReconciliationItem {
  id: string;
  transactionId: string;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  status: 'matched' | 'unmatched' | 'pending';
  notes?: string;
}

export const useBanks = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reconciledFilter, setReconciledFilter] = useState<string>('all');

  useEffect(() => {
    const mockAccounts: BankAccount[] = [
      {
        id: 'BANK-001',
        bankName: 'Banco Nacional',
        accountNumber: '0102-1234-5678-9012',
        accountType: 'checking',
        currency: 'USD',
        balance: 250000,
        availableBalance: 245000,
        status: 'active',
        openingDate: '2025-01-15',
        lastReconciliation: '2026-02-28',
      },
      {
        id: 'BANK-002',
        bankName: 'Banco Provincial',
        accountNumber: '0108-9876-5432-1098',
        accountType: 'savings',
        currency: 'USD',
        balance: 180000,
        availableBalance: 180000,
        status: 'active',
        openingDate: '2025-03-20',
        lastReconciliation: '2026-02-28',
      },
      {
        id: 'BANK-003',
        bankName: 'Banco Mercantil',
        accountNumber: '0105-1111-2222-3333',
        accountType: 'checking',
        currency: 'VES',
        balance: 5000000,
        availableBalance: 4950000,
        status: 'active',
        openingDate: '2025-02-10',
      },
    ];

    const mockTransactions: BankTransaction[] = [
      {
        id: 'TRX-001',
        accountId: 'BANK-001',
        date: '2026-03-06',
        type: 'deposit',
        amount: 50000,
        balance: 250000,
        description: 'Pago de cliente - Factura INV-001',
        reference: 'DEP-001',
        category: 'income',
        reconciled: false,
      },
      {
        id: 'TRX-002',
        accountId: 'BANK-001',
        date: '2026-03-05',
        type: 'withdrawal',
        amount: -25000,
        balance: 200000,
        description: 'Pago a proveedor - Tech Supplies',
        reference: 'TRF-001',
        category: 'expense',
        reconciled: true,
        reconciledDate: '2026-03-05',
      },
      {
        id: 'TRX-003',
        accountId: 'BANK-001',
        date: '2026-03-04',
        type: 'fee',
        amount: -150,
        balance: 225000,
        description: 'Comisión bancaria mensual',
        category: 'fee',
        reconciled: true,
        reconciledDate: '2026-03-04',
      },
      {
        id: 'TRX-004',
        accountId: 'BANK-002',
        date: '2026-03-03',
        type: 'interest',
        amount: 500,
        balance: 180000,
        description: 'Intereses ganados',
        category: 'income',
        reconciled: true,
        reconciledDate: '2026-03-03',
      },
      {
        id: 'TRX-005',
        accountId: 'BANK-002',
        date: '2026-03-02',
        type: 'transfer',
        amount: -30000,
        balance: 179500,
        description: 'Transferencia a cuenta corriente',
        reference: 'TRF-002',
        category: 'transfer',
        reconciled: false,
      },
      {
        id: 'TRX-006',
        accountId: 'BANK-001',
        date: '2026-03-01',
        type: 'deposit',
        amount: 75000,
        balance: 225150,
        description: 'Pago de cliente - Factura INV-002',
        reference: 'DEP-002',
        category: 'income',
        reconciled: true,
        reconciledDate: '2026-03-01',
      },
    ];

    setTimeout(() => {
      setAccounts(mockAccounts);
      setTransactions(mockTransactions);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter;
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      const matchesReconciled = 
        reconciledFilter === 'all' || 
        (reconciledFilter === 'reconciled' && transaction.reconciled) ||
        (reconciledFilter === 'unreconciled' && !transaction.reconciled);
      
      return matchesSearch && matchesAccount && matchesType && matchesReconciled;
    });
  }, [transactions, searchQuery, accountFilter, typeFilter, reconciledFilter]);

  const stats = useMemo(() => {
    const totalVES = accounts
      .filter(acc => acc.currency === 'VES')
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    const totalUSD = accounts
      .filter(acc => acc.currency === 'USD')
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalBalance = totalUSD + (totalVES / 36); // Conversión aproximada
    
    const totalAvailable = accounts.reduce((sum, acc) => {
      if (acc.currency === 'USD') return sum + acc.availableBalance;
      return sum + (acc.availableBalance / 36);
    }, 0);

    const unreconciledCount = transactions.filter(t => !t.reconciled).length;
    const unreconciledAmount = transactions
      .filter(t => !t.reconciled)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const today = new Date().toISOString().split('T')[0];
    const movimientosHoy = transactions.filter(t => t.date === today).length;

    const thisMonthDeposits = transactions
      .filter(t => {
        const txDate = new Date(t.date);
        const now = new Date();
        return t.type === 'deposit' && 
               txDate.getMonth() === now.getMonth() && 
               txDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthWithdrawals = transactions
      .filter(t => {
        const txDate = new Date(t.date);
        const now = new Date();
        return (t.type === 'withdrawal' || t.type === 'fee') && 
               txDate.getMonth() === now.getMonth() && 
               txDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const cuentasActivas = accounts.filter(a => a.status === 'active').length;

    return {
      totalBalance,
      totalDeposits: thisMonthDeposits,
      totalWithdrawals: thisMonthWithdrawals,
      netCashFlow: thisMonthDeposits - thisMonthWithdrawals,
      activeAccounts: cuentasActivas,
      totalTransactions: transactions.length,
      totalVES,
      totalUSD,
      cuentasActivas,
      movimientosHoy,
      totalAvailable,
      unreconciledCount,
      unreconciledAmount,
    };
  }, [accounts, transactions]);

  const addTransaction = (transaction: Omit<BankTransaction, 'id' | 'balance'>) => {
    const account = accounts.find(a => a.id === transaction.accountId);
    if (!account) return;

    const newBalance = account.balance + transaction.amount;
    const newTransaction: BankTransaction = {
      ...transaction,
      id: `TRX-${String(transactions.length + 1).padStart(3, '0')}`,
      balance: newBalance,
    };

    setTransactions([newTransaction, ...transactions]);
    setAccounts(accounts.map(a => 
      a.id === transaction.accountId 
        ? { ...a, balance: newBalance, availableBalance: newBalance }
        : a
    ));
  };

  const reconcileTransaction = (transactionId: string) => {
    setTransactions(transactions.map(t => 
      t.id === transactionId 
        ? { ...t, reconciled: true, reconciledDate: new Date().toISOString().split('T')[0] }
        : t
    ));
  };

  const reconcileMultiple = (transactionIds: string[]) => {
    const reconciledDate = new Date().toISOString().split('T')[0];
    setTransactions(transactions.map(t => 
      transactionIds.includes(t.id)
        ? { ...t, reconciled: true, reconciledDate }
        : t
    ));
  };

  const createAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: `BANK-${String(accounts.length + 1).padStart(3, '0')}`,
    };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<BankAccount>) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions.filter(t => t.accountId === accountId);
  };

  const getUnreconciledTransactions = () => {
    return transactions.filter(t => !t.reconciled);
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.balance || 0;
  };

  const unreconciledTransactions = useMemo(() => {
    return transactions.filter(t => !t.reconciled);
  }, [transactions]);

  return {
    accounts,
    transactions: filteredTransactions,
    allTransactions: transactions,
    unreconciledTransactions,
    loading,
    searchQuery,
    setSearchQuery,
    accountFilter,
    setAccountFilter,
    typeFilter,
    setTypeFilter,
    reconciledFilter,
    setReconciledFilter,
    stats,
    addTransaction,
    reconcileTransaction,
    reconcileMultiple,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountTransactions,
    getUnreconciledTransactions,
    getAccountBalance,
  };
};
