import { SyncEngine } from './SyncEngine';
import { localDb } from './localDb';
import { useNotificationStore } from '@/hooks/useNotificationStore';

/**
 * SyncService
 * Capa de abstracción para manejar mutaciones de datos.
 * Delegamos la lógica pesada al SyncEngine unificado.
 */
export const SyncService = {
  async mutate(tableName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any, recordId: string) {
    // --- CLOUD READY INFRASTRUCTURE ---
    const now = new Date().toISOString();
    
    // Ensure UUID
    if (action === 'INSERT' && !payload.id) {
      payload.id = crypto.randomUUID();
      recordId = payload.id;
    }

    // Set standard metadata
    if (action !== 'DELETE') {
      payload.updated_at = now;
      payload.is_dirty = 1;
      // Optimistic Concurrency: Increment version
      payload.version = (payload.version || 0) + 1;
      
      if (action === 'INSERT') {
        payload.created_at = now;
        payload.version = 1;
      }
    } else {
      // --- SOFT DELETE LOGIC ---
      // Instead of physical deletion, we mark as deleted and sync as UPDATE
      if (!payload) payload = {}; // Initialize payload if null
      payload.deleted_at = now;
      payload.is_dirty = 1;
      payload.updated_at = now;
      payload.version = (payload.version || 0) + 1;
      action = 'UPDATE'; 
      console.log(`[SyncService] Soft-deleting record ${recordId} in ${tableName}`);
    }

    // --- AUDIT TRAIL LOGIC ---
    if (tableName === 'products' && action === 'UPDATE') {
      try {
        const oldRecord = await localDb.products.get(recordId);
        if (oldRecord) {
          const changedFields: any = {};
          let hasCriticalChanges = false;
          
          // Solo auditamos cambios en precio y stock
          if (payload.price !== undefined && payload.price !== oldRecord.price) {
            changedFields.price = { old: oldRecord.price, new: payload.price };
            hasCriticalChanges = true;
          }
          if (payload.stock !== undefined && payload.stock !== oldRecord.stock) {
            changedFields.stock = { old: oldRecord.stock, new: payload.stock };
            hasCriticalChanges = true;
          }

          if (hasCriticalChanges) {
            await localDb.audit_logs.add({
              id: crypto.randomUUID(),
              table_name: tableName,
              record_id: recordId,
              changes: JSON.stringify(changedFields),
              created_at: new Date().toISOString(),
              tenant_id: payload.tenant_id || oldRecord.tenant_id
            });
          }
        }
      } catch (err) {
        console.error('[SyncService:Audit] Skip audit due to error:', err);
      }
    }

    // --- CONFLICT RESOLUTION (Last Write Wins with version check) ---
    // En una implementación real, compararíamos updated_at o un campo version
    
    const result = await SyncEngine.mutate(tableName, action, payload, recordId);
    
    if (result.error) {
      useNotificationStore.getState().addNotification({
        module: 'Sistema',
        type: 'error',
        title: 'Error de Sincronización',
        message: `No se pudo sincronizar la tabla ${tableName}. Se reintentará automáticamente.`,
      });
    }

    return result;
  },
  
  getQuery(tableName: string) {
    return (localDb as any)[tableName] || (localDb as any)['products']; // Fallback to avoid crashes if table name is slightly off
  },

  async mutateBulk(tableName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payloads: any[]) {
    const now = new Date().toISOString();
    
    // Inject metadata for each payload
    const processedPayloads = payloads.map(payload => {
      const p = { ...payload };
      
      if (action === 'INSERT' && !p.id) {
        p.id = crypto.randomUUID();
      }

      if (action !== 'DELETE') {
        p.updated_at = now;
        p.is_dirty = 1;
        p.version = (p.version || 0) + 1;
        
        if (action === 'INSERT') {
          p.created_at = now;
          p.version = 1;
        }
      } else {
        p.deleted_at = now;
        p.is_dirty = 1;
        p.updated_at = now;
        p.version = (p.version || 0) + 1;
      }
      
      return p;
    });

    const finalAction = action === 'DELETE' ? 'UPDATE' : action;
    return SyncEngine.mutateBulk(tableName, finalAction, processedPayloads);
  }
};

