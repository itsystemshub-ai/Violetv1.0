/**
 * Violet ERP - Servicio de Sincronización Híbrida
 * 
 * Arquitectura: Local + Nube
 * - SQLite para operación local (offline-first)
 * - PostgreSQL/Supabase para nube (producción)
 * - Sincronización bidireccional automática
 */

import { db, SqliteDatabase, PostgresDatabase, SupabaseDatabase } from '@violet-erp/database';
import { config } from '../config/index.js';
import { generateAuditLog } from '../utils/audit.js';

// ============================================================================
# CONFIGURACIÓN HÍBRIDA
# ============================================================================

export const hybridConfig = {
  // Modo de operación
  mode: process.env.HYBRID_MODE || 'both', // 'local', 'cloud', 'both'
  
  // Sincronización
  syncEnabled: process.env.SYNC_ENABLED !== 'false',
  syncInterval: parseInt(process.env.SYNC_INTERVAL || '30000', 10),
  syncBatchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
  
  // Conflict resolution
  conflictResolution: process.env.CONFLICT_RESOLUTION || 'cloud-wins', // 'local-wins', 'cloud-wins', 'manual'
  
  // Offline mode
  offlineMode: process.env.OFFLINE_MODE === 'true',
  offlineQueueMax: parseInt(process.env.OFFLINE_QUEUE_MAX || '1000', 10),
  
  // Endpoints
  cloudApiUrl: process.env.CLOUD_API_URL || 'https://api.violet-erp.com',
  cloudWsUrl: process.env.CLOUD_WS_URL || 'wss://ws.violet-erp.com',
  
  // Auth
  cloudApiKey: process.env.CLOUD_API_KEY || '',
  cloudInstanceId: process.env.CLOUD_INSTANCE_ID || '',
};

// ============================================================================
# SERVICIO DE SINCRONIZACIÓN
# ============================================================================

export class HybridSyncService {
  constructor() {
    this.localDb = null;
    this.cloudDb = null;
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.listeners = new Map();
  }

  /**
   * Inicializar conexiones híbridas
   */
  async initialize() {
    console.log('Initializing Hybrid Sync Service...');

    // Base de datos local (SQLite)
    this.localDb = new SqliteDatabase(config.sqlitePath);
    this.localDb.connect();
    console.log('Local database connected:', config.sqlitePath);

    // Base de datos en nube (PostgreSQL o Supabase)
    if (hybridConfig.mode !== 'local') {
      try {
        if (config.dbType === 'postgres' && config.postgresUrl) {
          this.cloudDb = new PostgresDatabase(config.postgresUrl);
          await this.cloudDb.connect();
          console.log('Cloud database connected (PostgreSQL)');
        } else if (config.dbType === 'supabase' && config.supabaseUrl) {
          this.cloudDb = new SupabaseDatabase(config.supabaseUrl, config.supabaseKey);
          console.log('Cloud database connected (Supabase)');
        }
      } catch (error) {
        console.warn('Cloud database connection failed. Operating in local mode.');
        hybridConfig.mode = 'local';
      }
    }

    // Iniciar sincronización automática
    if (hybridConfig.syncEnabled && hybridConfig.mode !== 'local') {
      this.startAutoSync();
      console.log(`Auto-sync started every ${hybridConfig.syncInterval}ms`);
    }

    // Event listeners para cambios
    this.setupChangeListeners();

    console.log('Hybrid Sync Service initialized');
  }

  /**
   * Iniciar sincronización automática periódica
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (!this.isSyncing) {
        await this.sync();
      }
    }, hybridConfig.syncInterval);
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sincronizar datos (bidireccional)
   */
  async sync() {
    if (this.isSyncing || !this.cloudDb) return;

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log('Starting sync...');

      // 1. Enviar cambios locales a la nube
      const localChanges = await this.getLocalChanges();
      if (localChanges.length > 0) {
        await this.pushToCloud(localChanges);
        console.log(`Pushed ${localChanges.length} local changes to cloud`);
      }

      // 2. Obtener cambios de la nube
      const cloudChanges = await this.pullFromCloud();
      if (cloudChanges.length > 0) {
        await this.applyCloudChanges(cloudChanges);
        console.log(`Applied ${cloudChanges.length} cloud changes locally`);
      }

      // 3. Actualizar timestamp de última sincronización
      this.lastSyncTime = new Date();
      this.emit('sync:complete', {
        localChanges: localChanges.length,
        cloudChanges: cloudChanges.length,
        duration: Date.now() - startTime,
      });

      console.log(`Sync completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Sync error:', error);
      this.emit('sync:error', error);
      
      // Reintentar en caso de error
      this.queueForSync(error.operation, error.data);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Obtener cambios locales pendientes
   */
  async getLocalChanges() {
    const tables = this.getSyncTables();
    const changes = [];

    for (const table of tables) {
      const rows = this.localDb.query(
        `SELECT * FROM ${table}_changes 
         WHERE synced = 0 
         ORDER BY created_at ASC 
         LIMIT ?`,
        [hybridConfig.syncBatchSize]
      );

      for (const row of rows) {
        changes.push({
          table,
          operation: row.operation,
          data: JSON.parse(row.data),
          timestamp: row.created_at,
          localId: row.id,
        });
      }
    }

    return changes;
  }

  /**
   * Enviar cambios a la nube
   */
  async pushToCloud(changes) {
    const axios = await import('axios');
    
    const response = await axios.default.post(
      `${hybridConfig.cloudApiUrl}/api/sync/push`,
      { changes, instanceId: hybridConfig.cloudInstanceId },
      {
        headers: {
          'Authorization': `Bearer ${hybridConfig.cloudApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Marcar como sincronizados
    for (const change of changes) {
      this.localDb.mutate(
        `UPDATE ${change.table}_changes SET synced = 1, synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [change.localId]
      );
    }

    return response.data;
  }

  /**
   * Obtener cambios desde la nube
   */
  async pullFromCloud() {
    const axios = await import('axios');

    const response = await axios.default.get(
      `${hybridConfig.cloudApiUrl}/api/sync/pull`,
      {
        params: {
          since: this.lastSyncTime ? this.lastSyncTime.toISOString() : undefined,
          instanceId: hybridConfig.cloudInstanceId,
        },
        headers: {
          'Authorization': `Bearer ${hybridConfig.cloudApiKey}`,
        },
      }
    );

    return response.data.changes || [];
  }

  /**
   * Aplicar cambios de la nube localmente
   */
  async applyCloudChanges(changes) {
    for (const change of changes) {
      try {
        switch (change.operation) {
          case 'INSERT':
          case 'UPDATE':
            await this.applyUpsert(change.table, change.data);
            break;
          case 'DELETE':
            await this.applyDelete(change.table, change.data);
            break;
        }
      } catch (error) {
        console.error(`Error applying cloud change for ${change.table}:`, error);
        
        // Resolver conflicto
        await this.resolveConflict(change, error);
      }
    }
  }

  /**
   * Aplicar upsert (insertar o actualizar)
   */
  async applyUpsert(table, data) {
    if (!data.id) return;

    const existing = this.localDb.queryOne(`SELECT id FROM ${table} WHERE id = ?`, [data.id]);

    if (existing) {
      // Actualizar
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key) => `${key} = ?`).join(', ');
      
      this.localDb.mutate(
        `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, data.id]
      );
    } else {
      // Insertar
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(data);

      this.localDb.mutate(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
  }

  /**
   * Aplicar eliminación
   */
  async applyDelete(table, data) {
    this.localDb.mutate(`DELETE FROM ${table} WHERE id = ?`, [data.id]);
  }

  /**
   * Resolver conflicto de sincronización
   */
  async resolveConflict(change, error) {
    switch (hybridConfig.conflictResolution) {
      case 'local-wins':
        // Mantener datos locales, ignorar cambio de nube
        console.log(`Conflict resolved (local-wins): ${change.table}:${change.data.id}`);
        break;

      case 'cloud-wins':
        // Forzar aplicación del cambio de nube
        try {
          await this.applyUpsert(change.table, change.data);
          console.log(`Conflict resolved (cloud-wins): ${change.table}:${change.data.id}`);
        } catch (retryError) {
          console.error(`Failed to apply cloud-wins change:`, retryError);
        }
        break;

      case 'manual':
        // Guardar para resolución manual
        this.localDb.mutate(
          `INSERT INTO sync_conflicts (table_name, operation, data, error, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [change.table, change.operation, JSON.stringify(change.data), error.message]
        );
        this.emit('conflict:manual', { change, error });
        break;
    }
  }

  /**
   * Encolar operación para sincronización posterior
   */
  queueForSync(operation, data) {
    if (this.syncQueue.length >= hybridConfig.offlineQueueMax) {
      this.syncQueue.shift(); // Eliminar el más antiguo
    }

    this.syncQueue.push({ operation, data, timestamp: Date.now() });
    this.emit('sync:queued', { operation, data });
  }

  /**
   * Configurar listeners para detectar cambios locales
   */
  setupChangeListeners() {
    // Los cambios se registran automáticamente mediante triggers
    // Ver database/index.js para la implementación
  }

  /**
   * Obtener tablas sincronizadas
   */
  getSyncTables() {
    return [
      'users',
      'roles',
      'products',
      'categories',
      'inventory',
      'customers',
      'suppliers',
      'sales',
      'sale_items',
      'purchases',
      'purchase_items',
      'accounts',
      'journal_entries',
    ];
  }

  /**
   * Suscribirse a eventos de sincronización
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emitir evento
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }

  /**
   * Obtener estado de sincronización
   */
  getSyncStatus() {
    const pendingChanges = this.localDb.queryOne(
      `SELECT COUNT(*) as count FROM (
        SELECT COUNT(*) FROM users_changes WHERE synced = 0
        UNION ALL SELECT COUNT(*) FROM products_changes WHERE synced = 0
        UNION ALL SELECT COUNT(*) FROM sales_changes WHERE synced = 0
      )`
    );

    return {
      mode: hybridConfig.mode,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: pendingChanges?.count || 0,
      queueLength: this.syncQueue.length,
      cloudConnected: !!this.cloudDb,
    };
  }

  /**
   * Forzar sincronización manual
   */
  async forceSync() {
    await this.sync();
  }

  /**
   * Limpiar y cerrar conexiones
   */
  async destroy() {
    this.stopAutoSync();
    
    if (this.localDb) {
      this.localDb.disconnect();
    }
    
    if (this.cloudDb && typeof this.cloudDb.disconnect === 'function') {
      await this.cloudDb.disconnect();
    }
  }
}

// ============================================================================
# TRIGGERS DE CAMBIOS (SQL)
# ============================================================================

export const createChangeTriggers = (db, tableName) => {
  // Tabla de cambios
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName}_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      synced_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trigger para INSERT
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS ${tableName}_insert_trigger
    AFTER INSERT ON ${tableName}
    BEGIN
      INSERT INTO ${tableName}_changes (table_name, operation, data)
      VALUES ('${tableName}', 'INSERT', json_object('id', NEW.id, 'data', json(NEW)));
    END
  `);

  // Trigger para UPDATE
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS ${tableName}_update_trigger
    AFTER UPDATE ON ${tableName}
    BEGIN
      INSERT INTO ${tableName}_changes (table_name, operation, data)
      VALUES ('${tableName}', 'UPDATE', json_object('id', NEW.id, 'data', json(NEW)));
    END
  `);

  // Trigger para DELETE
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS ${tableName}_delete_trigger
    AFTER DELETE ON ${tableName}
    BEGIN
      INSERT INTO ${tableName}_changes (table_name, operation, data)
      VALUES ('${tableName}', 'DELETE', json_object('id', OLD.id));
    END
  `);
};

// ============================================================================
# EXPORTAR INSTANCIA ÚNICA
# ============================================================================

export const hybridSync = new HybridSyncService();

export default hybridSync;
