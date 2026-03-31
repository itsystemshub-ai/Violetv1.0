/**
 * Violet ERP - Sync Engine Híbrido Nativo
 * Sincronización local-nube sin dependencias externas
 * 
 * Soporta:
 * - Modo Local: Todo se guarda en IndexedDB
 * - Modo Cloud: Todo se guarda en el servidor
 * - Modo Híbrido: Local primero, sync asíncrono al servidor
 */

import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';
import type { MutationAction, MutationResult, SyncLog } from '@/types/sync.types';
import { apiClient } from '@/core/api/apiClient';

/**
 * Configuración del modo híbrido
 */
interface HybridConfig {
  mode: 'local' | 'cloud' | 'hybrid';
  apiUrl: string;
  wsUrl: string;
  syncInterval: number;
  autoSync: boolean;
}

let hybridConfig: HybridConfig = {
  mode: 'hybrid',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  syncInterval: 15000,
  autoSync: true,
};

/**
 * Actualizar configuración híbrida
 */
export function configureHybridSync(config: Partial<HybridConfig>) {
  hybridConfig = { ...hybridConfig, ...config };
  console.log('[HybridSync] Configuración actualizada:', hybridConfig);
}

/**
 * Obtener estado de conexión
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Motor de sincronización híbrida
 */
export const SyncEngine = {
  /**
   * Realizar mutación (INSERT, UPDATE, DELETE)
   */
  async mutate<T = unknown>(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<MutationResult<T>> {
    const online = isOnline();
    const mode = hybridConfig.mode;

    console.log(`[HybridSync] mutate: ${action} ${tableName}:${recordId} (mode: ${mode}, online: ${online})`);

    try {
      // 1. Guardar en IndexedDB (siempre, para offline-first)
      await this.saveToLocal(tableName, action, payload, recordId);

      // 2. Encolar para sync si es híbrido o está offline
      if (!online || mode === 'hybrid') {
        await this.enqueueSync(tableName, action, payload, recordId);
        
        if (!online) {
          toast.info('Guardado localmente. Se sincronizará al recuperar conexión.');
        }
      }

      // 3. Sync inmediato si está online y es modo cloud
      if (online && mode === 'cloud') {
        await this.syncToServer(tableName, action, payload, recordId);
      }

      return { 
        success: true, 
        data: payload as T, 
        offline: !online || mode === 'hybrid',
        synced: online && mode === 'cloud',
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[HybridSync] Error en mutate:', error);
      return { success: false, error };
    }
  },

  /**
   * Guardar en IndexedDB local
   */
  async saveToLocal(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ) {
    const table = (localDb as any)[tableName];
    
    if (!table) {
      console.warn(`[HybridSync] Tabla ${tableName} no existe en IndexedDB`);
      return;
    }

    if (action === 'DELETE') {
      await table.delete(recordId);
    } else if (payload) {
      if (action === 'UPDATE') {
        await table.update(recordId, payload);
      } else {
        await table.put({ ...payload, id: recordId });
      }
    }
  },

  /**
   * Encolar registro para sincronización posterior
   */
  async enqueueSync(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ) {
    const syncLog: Omit<SyncLog, 'id'> = {
      table_name: tableName,
      record_id: recordId,
      action: action,
      payload: JSON.stringify(payload),
      sync_status: 'PENDING',
      attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const id = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).slice(2);

    await localDb.sync_logs.add({ ...syncLog, id } as any);
  },

  /**
   * Sincronizar con el servidor
   */
  async syncToServer(
    tableName: string,
    action: MutationAction,
    payload: Record<string, unknown> | null,
    recordId: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/sync/enqueue', {
        tableName,
        recordId,
        action,
        payload,
      });

      return response.success;
    } catch (error) {
      console.error('[HybridSync] Error syncToServer:', error);
      
      // Re-encolar para reintento
      await this.enqueueSync(tableName, action, payload, recordId);
      return false;
    }
  },

  /**
   * Mutación múltiple (bulk)
   */
  async mutateBulk<T = unknown>(
    tableName: string,
    action: MutationAction,
    payloads: Array<Record<string, unknown>>
  ): Promise<MutationResult<T[]>> {
    const online = isOnline();
    const mode = hybridConfig.mode;

    try {
      // Guardar localmente
      await this.saveToLocalBulk(tableName, action, payloads);

      // Encolar para sync
      if (!online || mode === 'hybrid') {
        for (const payload of payloads) {
          await this.enqueueSync(tableName, action, payload, payload.id as string);
        }
        
        if (!online) {
          toast.info(`Guardados ${payloads.length} registros localmente (Offline).`);
        }
      }

      // Sync inmediato si es cloud
      if (online && mode === 'cloud') {
        await this.syncBulkToServer(tableName, action, payloads);
      }

      return { 
        success: true, 
        offline: !online || mode === 'hybrid',
        data: payloads as T[],
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[HybridSync] Error en mutateBulk:', error);
      return { success: false, error };
    }
  },

  /**
   * Guardado múltiple en IndexedDB
   */
  async saveToLocalBulk(
    tableName: string,
    action: MutationAction,
    payloads: Array<Record<string, unknown>>
  ) {
    const table = (localDb as any)[tableName];
    
    if (!table) return;

    if (action === 'DELETE') {
      const ids = payloads.map((p) => p.id as string);
      await table.bulkDelete(ids);
    } else {
      await table.bulkPut(payloads);
    }
  },

  /**
   * Sync múltiple al servidor
   */
  async syncBulkToServer(
    tableName: string,
    action: MutationAction,
    payloads: Array<Record<string, unknown>>
  ) {
    try {
      await apiClient.post('/api/sync/enqueue-bulk', {
        tableName,
        action,
        payloads,
      });
    } catch (error) {
      console.error('[HybridSync] Error en syncBulkToServer:', error);
    }
  },

  /**
   * Procesar cola de sync pendientes
   */
  async syncPending() {
    if (!isOnline()) {
      console.log('[HybridSync] Offline, no se puede sincronizar');
      return;
    }

    const pending = await localDb.sync_logs
      .where('sync_status')
      .equals('PENDING')
      .toArray();

    if (pending.length === 0) {
      console.log('[HybridSync] No hay registros pendientes');
      return;
    }

    console.log(`[HybridSync] Sincronizando ${pending.length} registros pendientes...`);

    let successCount = 0;
    let failCount = 0;

    for (const log of pending) {
      try {
        const payload = JSON.parse(log.payload || '{}');
        
        const synced = await this.syncToServer(
          log.table_name,
          log.action as MutationAction,
          payload,
          log.record_id
        );

        if (synced) {
          await localDb.sync_logs.update(log.id, { 
            sync_status: 'COMPLETED',
            updated_at: new Date().toISOString(),
          });
          successCount++;
        } else {
          throw new Error('No se pudo sincronizar');
        }
      } catch (err) {
        console.error(`[HybridSync] Fallo sync de registro ${log.id}:`, err);

        const attempts = (log.attempts || 0) + 1;
        const maxAttempts = hybridConfig.mode === 'hybrid' ? 5 : 3;

        if (attempts >= maxAttempts) {
          await localDb.sync_logs.update(log.id, {
            sync_status: 'FAILED',
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
            updated_at: new Date().toISOString(),
          });
          failCount++;
        } else {
          await localDb.sync_logs.update(log.id, {
            attempts,
            last_error: err instanceof Error ? err.message : String(err),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (successCount > 0) {
      console.log(`[HybridSync] ✓ ${successCount} registros sincronizados`);
      toast.success(`${successCount} cambios sincronizados`);
    }

    if (failCount > 0) {
      console.error(`[HybridSync] ✗ ${failCount} registros fallaron`);
      toast.error(`${failCount} cambios fallaron. Revisa los logs.`);
    }
  },

  /**
   * Reintentar fallidos
   */
  async retryFailed() {
    const failed = await localDb.sync_logs
      .where('sync_status')
      .equals('FAILED')
      .toArray();

    if (failed.length === 0) return;

    console.log(`[HybridSync] Reintentando ${failed.length} registros fallidos...`);

    for (const log of failed) {
      await localDb.sync_logs.update(log.id, {
        sync_status: 'PENDING',
        attempts: 0,
        last_error: undefined,
        updated_at: new Date().toISOString(),
      });
    }

    await this.syncPending();
  },

  /**
   * Limpiar logs antiguos
   */
  async clearOldLogs(daysOld: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldLogs = await localDb.sync_logs
      .where('sync_status')
      .anyOf(['COMPLETED', 'FAILED'])
      .toArray();

    let deleted = 0;
    for (const log of oldLogs) {
      const logDate = new Date(log.created_at);
      if (logDate < cutoffDate) {
        await localDb.sync_logs.delete(log.id);
        deleted++;
      }
    }

    console.log(`[HybridSync] Limpiados ${deleted} logs antiguos`);
    return deleted;
  },

  /**
   * Obtener estadísticas
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
      mode: hybridConfig.mode,
      online: isOnline(),
    };
  },

  /**
   * Iniciar auto-sync periódico
   */
  startAutoSync() {
    if (!hybridConfig.autoSync) return;

    setInterval(() => {
      this.syncPending();
    }, hybridConfig.syncInterval);

    console.log(`[HybridSync] Auto-sync iniciado cada ${hybridConfig.syncInterval}ms`);

    // Escuchar eventos de conexión
    window.addEventListener('online', () => {
      console.log('[HybridSync] Conexión restaurada, sincronizando...');
      toast.success('Conexión restaurada');
      this.syncPending();
    });

    window.addEventListener('offline', () => {
      console.log('[HybridSync] Sin conexión, modo offline activado');
      toast.info('Modo offline activado');
    });
  },
};

/**
 * Resolver conflictos (Last Write Wins)
 */
export const ConflictResolver = {
  detectConflicts<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T,
    fieldsToCompare: string[] = []
  ): Array<{ field: string; localValue: unknown; remoteValue: unknown }> {
    const conflicts: Array<{ field: string; localValue: unknown; remoteValue: unknown }> = [];
    const fields = fieldsToCompare.length > 0 ? fieldsToCompare : Object.keys(localVersion);

    for (const field of fields) {
      const localValue = localVersion[field];
      const remoteValue = remoteVersion[field];

      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) continue;
      if (['id', 'created_at', 'version'].includes(field)) continue;

      conflicts.push({
        field,
        localValue,
        remoteValue,
      });
    }

    return conflicts;
  },

  resolveLWW<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T
  ): T {
    const localTime = new Date(String((localVersion as any).updated_at || 0)).getTime();
    const remoteTime = new Date(String((remoteVersion as any).updated_at || 0)).getTime();
    return remoteTime > localTime ? remoteVersion : localVersion;
  },
};

// Exportar configuración actual
export function getHybridConfig() {
  return { ...hybridConfig };
}
