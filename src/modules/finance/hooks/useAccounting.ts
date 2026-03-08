import { useState, useEffect, useMemo } from 'react';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  parentId?: string;
  balance: number;
  debit: number;
  credit: number;
  isActive: boolean;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: 'draft' | 'posted' | 'void';
  lines: JournalLine[];
  createdBy: string;
  totalDebit: number;
  totalCredit: number;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface FinancialStatement {
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  period: string;
  data: any;
}

export const useAccounting = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mockAccounts: Account[] = [
      // Activos
      {
        id: 'ACC-001',
        code: '1100',
        name: 'Efectivo y Equivalentes',
        type: 'asset',
        category: 'Activo Corriente',
        balance: 500000,
        debit: 500000,
        credit: 0,
        isActive: true,
        description: 'Caja y bancos',
      },
      {
        id: 'ACC-002',
        code: '1200',
        name: 'Cuentas por Cobrar',
        type: 'asset',
        category: 'Activo Corriente',
        balance: 350000,
        debit: 350000,
        credit: 0,
        isActive: true,
        description: 'Clientes y documentos por cobrar',
      },
      {
        id: 'ACC-003',
        code: '1300',
        name: 'Inventarios',
        type: 'asset',
        category: 'Activo Corriente',
        balance: 800000,
        debit: 800000,
        credit: 0,
        isActive: true,
        description: 'Mercancía para la venta',
      },
      {
        id: 'ACC-004',
        code: '1500',
        name: 'Propiedad, Planta y Equipo',
        type: 'asset',
        category: 'Activo No Corriente',
        balance: 1200000,
        debit: 1200000,
        credit: 0,
        isActive: true,
        description: 'Activos fijos',
      },
      // Pasivos
      {
        id: 'ACC-005',
        code: '2100',
        name: 'Cuentas por Pagar',
        type: 'liability',
        category: 'Pasivo Corriente',
        balance: 280000,
        debit: 0,
        credit: 280000,
        isActive: true,
        description: 'Proveedores y acreedores',
      },
      {
        id: 'ACC-006',
        code: '2200',
        name: 'Préstamos Bancarios',
        type: 'liability',
        category: 'Pasivo No Corriente',
        balance: 600000,
        debit: 0,
        credit: 600000,
        isActive: true,
        description: 'Deuda a largo plazo',
      },
      // Patrimonio
      {
        id: 'ACC-007',
        code: '3100',
        name: 'Capital Social',
        type: 'equity',
        category: 'Patrimonio',
        balance: 1000000,
        debit: 0,
        credit: 1000000,
        isActive: true,
        description: 'Capital aportado por socios',
      },
      {
        id: 'ACC-008',
        code: '3200',
        name: 'Utilidades Retenidas',
        type: 'equity',
        category: 'Patrimonio',
        balance: 470000,
        debit: 0,
        credit: 470000,
        isActive: true,
        description: 'Ganancias acumuladas',
      },
      // Ingresos
      {
        id: 'ACC-009',
        code: '4100',
        name: 'Ventas',
        type: 'revenue',
        category: 'Ingresos Operacionales',
        balance: 1250000,
        debit: 0,
        credit: 1250000,
        isActive: true,
        description: 'Ingresos por ventas',
      },
      // Gastos
      {
        id: 'ACC-010',
        code: '5100',
        name: 'Costo de Ventas',
        type: 'expense',
        category: 'Costos',
        balance: 750000,
        debit: 750000,
        credit: 0,
        isActive: true,
        description: 'Costo de mercancía vendida',
      },
      {
        id: 'ACC-011',
        code: '5200',
        name: 'Gastos Operacionales',
        type: 'expense',
        category: 'Gastos',
        balance: 280000,
        debit: 280000,
        credit: 0,
        isActive: true,
        description: 'Gastos administrativos y de ventas',
      },
    ];

    const mockJournalEntries: JournalEntry[] = [
      {
        id: 'JE-001',
        date: '2026-03-06',
        reference: 'INV-001',
        description: 'Registro de venta a cliente',
        status: 'posted',
        totalDebit: 50000,
        totalCredit: 50000,
        createdBy: 'Juan Pérez',
        lines: [
          {
            id: 'JL-001',
            accountId: 'ACC-002',
            accountCode: '1200',
            accountName: 'Cuentas por Cobrar',
            debit: 50000,
            credit: 0,
          },
          {
            id: 'JL-002',
            accountId: 'ACC-009',
            accountCode: '4100',
            accountName: 'Ventas',
            debit: 0,
            credit: 50000,
          },
        ],
      },
      {
        id: 'JE-002',
        date: '2026-03-06',
        reference: 'PO-001',
        description: 'Compra de inventario',
        status: 'posted',
        totalDebit: 85000,
        totalCredit: 85000,
        createdBy: 'María González',
        lines: [
          {
            id: 'JL-003',
            accountId: 'ACC-003',
            accountCode: '1300',
            accountName: 'Inventarios',
            debit: 85000,
            credit: 0,
          },
          {
            id: 'JL-004',
            accountId: 'ACC-005',
            accountCode: '2100',
            accountName: 'Cuentas por Pagar',
            debit: 0,
            credit: 85000,
          },
        ],
      },
      {
        id: 'JE-003',
        date: '2026-03-05',
        reference: 'PAY-001',
        description: 'Pago a proveedor',
        status: 'posted',
        totalDebit: 30000,
        totalCredit: 30000,
        createdBy: 'Carlos Rodríguez',
        lines: [
          {
            id: 'JL-005',
            accountId: 'ACC-005',
            accountCode: '2100',
            accountName: 'Cuentas por Pagar',
            debit: 30000,
            credit: 0,
          },
          {
            id: 'JL-006',
            accountId: 'ACC-001',
            accountCode: '1100',
            accountName: 'Efectivo y Equivalentes',
            debit: 0,
            credit: 30000,
          },
        ],
      },
      {
        id: 'JE-004',
        date: '2026-03-05',
        reference: 'DRAFT-001',
        description: 'Ajuste de inventario (borrador)',
        status: 'draft',
        totalDebit: 5000,
        totalCredit: 5000,
        createdBy: 'Ana López',
        lines: [
          {
            id: 'JL-007',
            accountId: 'ACC-011',
            accountCode: '5200',
            accountName: 'Gastos Operacionales',
            debit: 5000,
            credit: 0,
          },
          {
            id: 'JL-008',
            accountId: 'ACC-003',
            accountCode: '1300',
            accountName: 'Inventarios',
            debit: 0,
            credit: 5000,
          },
        ],
      },
    ];

    setTimeout(() => {
      setAccounts(mockAccounts);
      setJournalEntries(mockJournalEntries);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.includes(searchQuery)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    return filtered.sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, searchQuery, typeFilter]);

  const filteredJournalEntries = useMemo(() => {
    let filtered = journalEntries;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(je => je.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journalEntries, statusFilter]);

  const stats = useMemo(() => {
    const totalAssets = accounts
      .filter(a => a.type === 'asset')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalLiabilities = accounts
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalEquity = accounts
      .filter(a => a.type === 'equity')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalRevenue = accounts
      .filter(a => a.type === 'revenue')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalExpenses = accounts
      .filter(a => a.type === 'expense')
      .reduce((sum, a) => sum + a.balance, 0);

    const netIncome = totalRevenue - totalExpenses;

    const postedEntries = journalEntries.filter(je => je.status === 'posted').length;
    const draftEntries = journalEntries.filter(je => je.status === 'draft').length;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => a.isActive).length,
      totalJournalEntries: journalEntries.length,
      postedEntries,
      draftEntries,
    };
  }, [accounts, journalEntries]);

  const createAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: `ACC-${String(accounts.length + 1).padStart(3, '0')}`,
    };
    setAccounts([...accounts, newAccount]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const createJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `JE-${String(journalEntries.length + 1).padStart(3, '0')}`,
    };
    setJournalEntries([newEntry, ...journalEntries]);
  };

  const postJournalEntry = (id: string) => {
    setJournalEntries(journalEntries.map(je =>
      je.id === id ? { ...je, status: 'posted' as const } : je
    ));
  };

  const voidJournalEntry = (id: string) => {
    setJournalEntries(journalEntries.map(je =>
      je.id === id ? { ...je, status: 'void' as const } : je
    ));
  };

  const getAccountsByType = (type: string) => {
    return accounts.filter(a => a.type === type);
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.balance || 0;
  };

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    journalEntries: filteredJournalEntries,
    allJournalEntries: journalEntries,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    stats,
    createAccount,
    updateAccount,
    deleteAccount,
    createJournalEntry,
    postJournalEntry,
    voidJournalEntry,
    getAccountsByType,
    getAccountBalance,
  };
};
