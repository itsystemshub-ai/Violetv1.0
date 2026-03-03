const { createClient } = require('@supabase/supabase-js');
const DatabaseModel = require('../models/database.model');

/**
 * Servicio de sincronización con la nube
 */
class SyncService {
  constructor() {
    this.supabaseUrl = 'https://tkxkrmutsmtlayetjnhm.supabase.co';
    this.supabaseKey = 'sb_publishable_5SH3JKngmjfIdq86MqX8xw_8SGlOH3j';
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.isProcessing = false;
    this.timer = null;
  }

  /**
   * Inicia el ciclo de sincronización
   */
  start() {
    if (this.timer) return;
    console.log('[SyncService] Iniciando ciclo de sincronización.');
    this.timer = setInterval(() => this.processQueue(), 15000);
  }

  /**
   * Detiene el ciclo de sincronización
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Procesa la cola de sincronización
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const configRows = DatabaseModel.executeSql(
        "SELECT value FROM config WHERE key = 'cloud_sync_enabled'"
      );
      const isSyncEnabled = configRows.length > 0 ? (configRows[0].value !== 'false') : true;
      
      if (!isSyncEnabled) {
        this.isProcessing = false;
        return;
      }

      const pending = DatabaseModel.executeSql(`
        SELECT * FROM sync_logs 
        WHERE sync_status = 'PENDING' 
        AND attempts < 5 
        ORDER BY created_at ASC
        LIMIT 20
      `);

      if (pending.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[SyncService] Sincronizando ${pending.length} registros...`);

      for (const log of pending) {
        try {
          const { table_name, action, payload, record_id, id } = log;
          const parsedPayload = JSON.parse(payload || '{}');
          let result;

          if (action === 'INSERT' || action === 'UPDATE') {
            result = await this.supabase.from(table_name).upsert(parsedPayload);
          } else if (action === 'DELETE') {
            result = await this.supabase.from(table_name).delete().eq('id', record_id);
          }

          if (result.error) throw result.error;

          DatabaseModel.executeSql(`
            UPDATE sync_logs SET sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `, [id]);

          try {
            DatabaseModel.executeSql(`
              UPDATE ${table_name} 
              SET is_dirty = 0, last_sync = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [record_id]);
          } catch (e) {
            console.log(`[SyncService] Skip metadata update for ${table_name}: ${e.message}`);
          }
        } catch (err) {
          DatabaseModel.executeSql(`
            UPDATE sync_logs SET attempts = attempts + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `, [err.message, log.id]);
          console.error(`[SyncService] Error en log ${log.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[SyncService] Error crítico:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new SyncService();
