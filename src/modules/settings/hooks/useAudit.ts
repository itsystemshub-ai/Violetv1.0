import { useState, useCallback, useEffect } from 'react';
import { localDb } from '@/lib/localDb';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  changes: string;
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

export const useAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logs = await localDb.audit_logs.orderBy('created_at').reverse().limit(50).toArray();
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
      console.error('Error fetching sync logs:', error);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
    fetchSyncLogs();
  }, [fetchAuditLogs, fetchSyncLogs]);

  return {
    auditLogs,
    syncLogs,
    isLoading,
    refresh: () => {
      fetchAuditLogs();
      fetchSyncLogs();
    }
  };
};
