import { useState, useCallback, useEffect } from 'react';
import { localDb } from "@/core/database/localDb";

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  changes: string;
  action?: string;
  changed_by?: string;
  description?: string;
  sync_status?: string;
  created_at: string;
  tenant_id?: string;
}

export interface SyncLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  sync_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface DbStats {
  products: number;
  invoices: number;
  profiles: number;
  suppliers: number;
  employees: number;
  transactions: number;
  accounts: number;
  auditLogs: number;
  total: number;
}

export const useAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [dbStats, setDbStats] = useState<DbStats>({
    products: 0, invoices: 0, profiles: 0, suppliers: 0,
    employees: 0, transactions: 0, accounts: 0, auditLogs: 0, total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logs = await localDb.audit_logs.orderBy('created_at').reverse().limit(200).toArray();
      setAuditLogs(logs as any);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSyncLogs = useCallback(async () => {
    try {
      const logs = await localDb.sync_logs.orderBy('created_at').reverse().limit(50).toArray();
      setSyncLogs(logs as any);
    } catch (error) {
      // sync_logs table may not exist yet
      console.warn('sync_logs table not available:', error);
    }
  }, []);

  const fetchDbStats = useCallback(async () => {
    try {
      const [products, invoices, profiles, suppliers, employees, transactions, accounts, auditCount] = await Promise.all([
        localDb.products.count(),
        localDb.invoices.count(),
        localDb.profiles.count(),
        localDb.suppliers.count(),
        localDb.employees.count(),
        localDb.financial_transactions.count(),
        localDb.financial_accounts.count(),
        localDb.audit_logs.count(),
      ]);
      const stats = { products, invoices, profiles, suppliers, employees, transactions, accounts, auditLogs: auditCount, total: products + invoices + profiles + suppliers + employees + transactions + accounts };
      setDbStats(stats);
    } catch (error) {
      console.error('Error fetching DB stats:', error);
    }
  }, []);

  const purgeAuditLogs = useCallback(async () => {
    try {
      const count = await localDb.audit_logs.count();
      await localDb.audit_logs.clear();
      setAuditLogs([]);
      setDbStats(prev => ({ ...prev, auditLogs: 0 }));
      return count;
    } catch (error) {
      console.error('Error purging audit logs:', error);
      return 0;
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
    fetchSyncLogs();
    fetchDbStats();
  }, [fetchAuditLogs, fetchSyncLogs, fetchDbStats]);

  return {
    auditLogs,
    syncLogs,
    dbStats,
    isLoading,
    purgeAuditLogs,
    refresh: () => {
      fetchAuditLogs();
      fetchSyncLogs();
      fetchDbStats();
    }
  };
};
