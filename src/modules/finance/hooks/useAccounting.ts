import { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

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
  tenant_id?: string;
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
  tenant_id?: string;
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
  const { tenant } = useSystemConfig();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchFinanceData = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dbAccounts = await localDb.financial_accounts
        .where('tenant_id')
        .equals(tenant.id)
        .toArray();
      
      // As localDb schema doesn't have a direct journal_entries table, we use sys_config for now
      // Or we can query financial_transactions if mapped. Here we use sys_config to store complex entries.
      const dbEntriesData = await localDb.sys_config.get(`${tenant.id}_journal_entries`);
      const storedEntries = dbEntriesData?.value_json || [];

      setAccounts(dbAccounts as Account[]);
      setJournalEntries(storedEntries as JournalEntry[]);
    } catch (error) {
      console.error('[useAccounting] Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

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

  const createAccount = async (account: Omit<Account, 'id'>) => {
    if (!tenant?.id) return;
    const newAccount: Account = {
      ...account,
      id: `ACC-${Date.now()}`,
      tenant_id: tenant.id
    };
    try {
      await localDb.financial_accounts.add(newAccount);
      setAccounts(prev => [...prev, newAccount]);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      await localDb.financial_accounts.update(id, updates);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await localDb.financial_accounts.delete(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const saveJournalEntries = async (entries: JournalEntry[]) => {
    if (!tenant?.id) return;
    try {
      await localDb.sys_config.put({
        id: `${tenant.id}_journal_entries`,
        tenant_id: tenant.id,
        key: 'journal_entries',
        value_json: entries,
        updated_at: new Date().toISOString()
      });
      setJournalEntries(entries);
    } catch (error) {
      console.error('Error saving journal entries:', error);
    }
  };

  const createJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `JE-${Date.now()}`,
    };
    await saveJournalEntries([newEntry, ...journalEntries]);
  };

  const postJournalEntry = async (id: string) => {
    const updated = journalEntries.map(je =>
      je.id === id ? { ...je, status: 'posted' as const } : je
    );
    await saveJournalEntries(updated);
  };

  const voidJournalEntry = async (id: string) => {
    const updated = journalEntries.map(je =>
      je.id === id ? { ...je, status: 'void' as const } : je
    );
    await saveJournalEntries(updated);
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
