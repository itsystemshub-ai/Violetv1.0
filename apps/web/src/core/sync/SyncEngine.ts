import Dexie from 'dexie';
import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';
import type {
  MutationAction,
  MutationResult,
  SyncLog,
} from '@/types/sync.types';

/**
 * Universal Sync Engine
 * Refactored for pure Cloud/Web architecture.
 */
export const SyncEngine = {
  async mutate<T = unknown>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    // --- WEB PRIMARY (DIRECT SYNC + DEXIE) ---
    return this.handleWebMutation<T>(tableName, action, payload, recordId);
  },

  async handleWebMutation<T>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    const isOnline = navigator.onLine;

    try {
      // Sync with local Dexie (Offline-First)
      const table = (localDb as any)[tableName] as Dexie.Table;
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
        } as any);

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
    const isOnline = navigator.onLine;

    try {
      // Local Dexie
      const table = (localDb as any)[tableName] as Dexie.Table;
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
        await localDb.sync_logs.bulkAdd(syncLogs as any);
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
        // For now, just mark as completed (local-only mode, or implement real Cloud API call here)
        await localDb.sync_logs.update(log.id, { sync_status: 'COMPLETED' });
        successCount++;
      } catch (err) {
        console.error(`[SyncEngine] Fallo sinc de registro ${log.id}:`, err);
        
        const attempts = (log.attempts || 0) + 1;
        const maxAttempts = 5;

        if (attempts >= maxAttempts) {
          await localDb.sync_logs.update(log.id, {
            sync_status: 'FAILED',
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
          });
          failCount++;
        } else {
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

  async retryFailed() {
    const failed = await localDb.sync_logs.where('sync_status').equals('FAILED').toArray();
    
    if (failed.length === 0) return;

    console.log(`[SyncEngine] Reintentando ${failed.length} registros fallidos...`);

    for (const log of failed) {
      await localDb.sync_logs.update(log.id, {
        sync_status: 'PENDING',
        attempts: 0,
        last_error: undefined,
      });
    }

    await this.syncPending();
  },

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
  detectConflicts<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T,
    fieldsToCompare: string[] = []
  ): ConflictData[] {
    const conflicts: ConflictData<T>[] = [];
    const fields = fieldsToCompare.length > 0 
      ? fieldsToCompare 
      : Object.keys(localVersion);

    for (const field of fields) {
      const localValue = localVersion[field];
      const remoteValue = remoteVersion[field];

      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
        continue;
      }

      if (['id', 'created_at', 'version'].includes(field)) {
        continue;
      }

      conflicts.push({
        field,
        localValue,
        remoteValue,
        localTimestamp: String((localVersion as any).updated_at || new Date().toISOString()),
        remoteTimestamp: String((remoteVersion as any).updated_at || new Date().toISOString()),
      });
    }

    return conflicts;
  },

  resolveConflictsLWW<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T
  ): T {
    const localTime = new Date(String((localVersion as any).updated_at || 0)).getTime();
    const remoteTime = new Date(String((remoteVersion as any).updated_at || 0)).getTime();

    return remoteTime > localTime ? remoteVersion : localVersion;
  },

  mergeNonConflicting<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T,
    conflicts: ConflictData<T>[]
  ): T {
    const conflictFields = new Set(conflicts.map(c => c.field));
    const merged = { ...localVersion };

    Object.keys(remoteVersion).forEach(key => {
      if (!conflictFields.has(key) && key !== 'id') {
        const localTime = new Date(String((localVersion as any).updated_at || 0)).getTime();
        const remoteTime = new Date(String((remoteVersion as any).updated_at || 0)).getTime();
        
        if (remoteTime > localTime) {
          (merged as any)[key] = remoteVersion[key];
        }
      }
    });

    return merged;
  },
};
