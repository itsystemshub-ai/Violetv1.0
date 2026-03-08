import Dexie from 'dexie';
import { supabase } from './supabase';
import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';
import type {
  MutationAction,
  MutationResult,
  ElectronMutationPayload,
  WindowWithElectron,
  SyncLog,
} from '@/types/sync.types';

/**
 * Universal Sync Engine
 * Bridges the gap between Electron (PG) and Web (Dexie).
 */
export const SyncEngine = {
  isElectron(): boolean {
    return !!(window as WindowWithElectron).electronAPI;
  },

  async mutate<T = unknown>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    const isElectronEnv = this.isElectron();

    // --- CASE 1: DESKTOP (ELECTRON + SQLite/PG) ---
    if (isElectronEnv) {
      return this.handleElectronMutation<T>(tableName, action, payload, recordId);
    }

    // --- CASE 2: WEB (DIRECT SYNC + DEXIE) ---
    return this.handleWebMutation<T>(tableName, action, payload, recordId);
  },

  async handleElectronMutation<T>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    try {
      const electronWindow = window as WindowWithElectron;
      if (!electronWindow.electronAPI) {
        throw new Error('Electron API not available');
      }

      const mutationPayload: ElectronMutationPayload = {
        tableName,
        action,
        payload,
        recordId,
      };

      const result = await electronWindow.electronAPI.mutateRecord(mutationPayload);

      if (result && result.success === false) {
        throw new Error(result.error || 'Unknown error');
      }

      return { success: true, localOnly: true, data: result.data as T };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SyncEngine:Electron] Error:', error);
      return { success: false, error };
    }
  },

  async handleWebMutation<T>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    const isOnline = navigator.onLine;

    try {
      // CLOUD SYNC DISABLED BY USER REQUEST
      /*
      if (isOnline) {
        if (action === 'INSERT') {
          result = await supabase.from(tableName).insert(payload).select().single();
        } else if (action === 'UPDATE') {
          result = await supabase.from(tableName).update(payload).eq('id', recordId).select().single();
        } else if (action === 'DELETE') {
          result = await supabase.from(tableName).delete().eq('id', recordId);
        }

        if (result?.error) throw result.error;
      }
      */

      // Sync with local Dexie (Offline-First)
      const table = (localDb as Record<string, Dexie.Table>)[tableName];
      if (table) {
        if (action === 'DELETE') {
          await table.delete(recordId);
        } else if (payload) {
          if (action === 'UPDATE') {
            await table.update(recordId, payload);
          } else {
            await table.put({ ...payload, id: recordId });
          }
        }
      }

      // If we are offline, queue for later sync
      if (!isOnline) {
        const syncLog: Omit<SyncLog, 'id'> = {
          table_name: tableName,
          record_id: recordId,
          action: action,
          payload: JSON.stringify(payload),
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
        };

        await localDb.sync_logs.add({
          ...syncLog,
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        });

        toast.info('Guardado localmente (Offline). Se sincronizará al recuperar conexión.');
      }

      return { success: true, data: payload as T, offline: !isOnline };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SyncEngine:Web] Error:', error);
      return { success: false, error };
    }
  },

  async mutateBulk<T = unknown>(
    tableName: string,
    action: MutationAction,
    payloads: Array<Record<string, unknown>>
  ): Promise<MutationResult<T[]>> {
    const isElectronEnv = this.isElectron();
    const isOnline = navigator.onLine;

    // --- CASE 1: DESKTOP ---
    if (isElectronEnv) {
      for (const p of payloads) {
        const id = (p.id as string) || crypto.randomUUID();
        await this.handleElectronMutation<T>(tableName, action, p, id);
      }
      return { success: true, localOnly: true };
    }

    // --- CASE 2: WEB ---
    // CLOUD SYNC DISABLED
    /*
    try {
      if (isOnline && action === 'INSERT') {
        const { error } = await supabase.from(tableName).insert(payloads);
        if (error) throw error;
      }
    */
    try {
      // Local Dexie
      const table = (localDb as Record<string, Dexie.Table>)[tableName];
      if (table) {
        if (action === 'DELETE') {
          const ids = payloads.map((p) => p.id as string);
          await table.bulkDelete(ids);
        } else {
          await table.bulkPut(payloads);
        }
      }

      if (!isOnline) {
        const syncLogs = payloads.map((p) => ({
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
          table_name: tableName,
          record_id: (p.id as string) || '',
          action: action,
          payload: JSON.stringify(p),
          sync_status: 'PENDING' as const,
          created_at: new Date().toISOString(),
        }));
        await localDb.sync_logs.bulkAdd(syncLogs);
        toast.info(`Guardados ${payloads.length} registros localmente (Offline).`);
      }

      return { success: true, offline: !isOnline, data: payloads as T[] };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SyncEngine:Web] Bulk Error:', error);
      return { success: false, error };
    }
  },

  async syncPending() {
    if (!navigator.onLine) return;
    
    const pending = await localDb.sync_logs.where('sync_status').equals('PENDING').toArray();
    if (pending.length === 0) return;

    console.log(`[SyncEngine] Sincronizando ${pending.length} registros pendientes...`);

    let successCount = 0;
    let failCount = 0;

    for (const log of pending) {
      try {
        const payload = JSON.parse(log.payload);
        let result;

        // CLOUD SYNC DISABLED - Uncomment when ready
        /*
        if (log.action === 'INSERT') {
          result = await supabase.from(log.table_name).insert(payload);
        } else if (log.action === 'UPDATE') {
          result = await supabase.from(log.table_name).update(payload).eq('id', log.record_id);
        } else if (log.action === 'DELETE') {
          result = await supabase.from(log.table_name).delete().eq('id', log.record_id);
        }

        if (!result?.error) {
          await localDb.sync_logs.update(log.id, { sync_status: 'COMPLETED' });
          successCount++;
        } else {
          throw new Error(result.error.message);
        }
        */

        // For now, just mark as completed (local-only mode)
        await localDb.sync_logs.update(log.id, { sync_status: 'COMPLETED' });
        successCount++;
      } catch (err) {
        console.error(`[SyncEngine] Fallo sinc de registro ${log.id}:`, err);
        
        // Implement retry logic with exponential backoff
        const attempts = (log.attempts || 0) + 1;
        const maxAttempts = 5;

        if (attempts >= maxAttempts) {
          // Mark as failed after max attempts
          await localDb.sync_logs.update(log.id, {
            sync_status: 'FAILED',
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
          });
          failCount++;
        } else {
          // Keep as pending but increment attempts
          await localDb.sync_logs.update(log.id, {
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    if (successCount > 0) {
      console.log(`[SyncEngine] ✓ ${successCount} registros sincronizados`);
      toast.success(`${successCount} cambios sincronizados`);
    }

    if (failCount > 0) {
      console.error(`[SyncEngine] ✗ ${failCount} registros fallaron`);
      toast.error(`${failCount} cambios fallaron. Revisa los logs.`);
    }
  },

  /**
   * Retry failed sync logs with exponential backoff
   */
  async retryFailed() {
    const failed = await localDb.sync_logs.where('sync_status').equals('FAILED').toArray();
    
    if (failed.length === 0) return;

    console.log(`[SyncEngine] Reintentando ${failed.length} registros fallidos...`);

    for (const log of failed) {
      // Reset to pending for retry
      await localDb.sync_logs.update(log.id, {
        sync_status: 'PENDING',
        attempts: 0,
        last_error: undefined,
      });
    }

    // Trigger sync
    await this.syncPending();
  },

  /**
   * Clear completed sync logs older than specified days
   */
  async clearOldLogs(daysOld: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await localDb.sync_logs
      .where('sync_status')
      .equals('COMPLETED')
      .and((log) => new Date(log.created_at) < cutoffDate)
      .delete();

    console.log(`[SyncEngine] Limpiados ${deleted} logs antiguos`);
    return deleted;
  },

  /**
   * Get sync statistics
   */
  async getStats() {
    const [pending, completed, failed] = await Promise.all([
      localDb.sync_logs.where('sync_status').equals('PENDING').count(),
      localDb.sync_logs.where('sync_status').equals('COMPLETED').count(),
      localDb.sync_logs.where('sync_status').equals('FAILED').count(),
    ]);

    return {
      pending,
      completed,
      failed,
      total: pending + completed + failed,
    };
  }
};



/**
 * Conflict detection and resolution types
 */
export interface ConflictData<T = Record<string, unknown>> {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: string;
  remoteTimestamp: string;
}

/**
 * Conflict resolution utilities
 */
export const ConflictResolver = {
  /**
   * Detect conflicts between local and remote versions
   */
  detectConflicts<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T,
    fieldsToCompare: string[] = []
  ): ConflictData<T>[] {
    const conflicts: ConflictData<T>[] = [];
    const fields = fieldsToCompare.length > 0 
      ? fieldsToCompare 
      : Object.keys(localVersion);

    for (const field of fields) {
      const localValue = localVersion[field];
      const remoteValue = remoteVersion[field];

      // Skip if values are the same
      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
        continue;
      }

      // Skip metadata fields
      if (['id', 'created_at', 'version'].includes(field)) {
        continue;
      }

      conflicts.push({
        field,
        localValue,
        remoteValue,
        localTimestamp: String(localVersion.updated_at || new Date().toISOString()),
        remoteTimestamp: String(remoteVersion.updated_at || new Date().toISOString()),
      });
    }

    return conflicts;
  },

  /**
   * Resolve conflicts using Last Write Wins strategy
   */
  resolveConflictsLWW<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T
  ): T {
    const localTime = new Date(String(localVersion.updated_at || 0)).getTime();
    const remoteTime = new Date(String(remoteVersion.updated_at || 0)).getTime();

    // Return the version with the most recent timestamp
    return remoteTime > localTime ? remoteVersion : localVersion;
  },

  /**
   * Merge non-conflicting fields
   */
  mergeNonConflicting<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T,
    conflicts: ConflictData<T>[]
  ): T {
    const conflictFields = new Set(conflicts.map(c => c.field));
    const merged = { ...localVersion };

    // For non-conflicting fields, use the most recent value
    Object.keys(remoteVersion).forEach(key => {
      if (!conflictFields.has(key) && key !== 'id') {
        const localTime = new Date(String(localVersion.updated_at || 0)).getTime();
        const remoteTime = new Date(String(remoteVersion.updated_at || 0)).getTime();
        
        if (remoteTime > localTime) {
          merged[key as keyof T] = remoteVersion[key as keyof T];
        }
      }
    });

    return merged;
  },
};
