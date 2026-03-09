const { createClient } = require('@supabase/supabase-js');
const { executeSql } = require('./db.cjs');

// Configuración Supabase (Cloud)
const supabaseUrl = 'https://tkxkrmutsmtlayetjnhm.supabase.co';
const supabaseKey = 'sb_publishable_5SH3JKngmjfIdq86MqX8xw_8SGlOH3j';
const supabase = createClient(supabaseUrl, supabaseKey);

class SyncWorker {
  constructor() {
    this.isProcessing = false;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    console.log('[SyncWorker] Iniciando ciclo de sincronización.');
    this.timer = setInterval(() => this.processQueue(), 15000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Check if Cloud Sync is enabled by the user in Settings
      const configRows = executeSql("SELECT value FROM config WHERE key = 'cloud_sync_enabled'");
      // If config not set, default to enabled (true)
      const isSyncEnabled = configRows.length > 0 ? (configRows[0].value !== 'false') : true;
      
      if (!isSyncEnabled) {
        this.isProcessing = false;
        return;
      }

      const pending = executeSql(`
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

      console.log(`[SyncWorker] Sincronizando ${pending.length} registros...`);

      for (const log of pending) {
        try {
          const { table_name, action, payload, record_id, id } = log;
          const parsedPayload = JSON.parse(payload || '{}');
          let result;

          if (action === 'INSERT' || action === 'UPDATE') {
            result = await supabase.from(table_name).upsert(parsedPayload);
          } else if (action === 'DELETE') {
            result = await supabase.from(table_name).delete().eq('id', record_id);
          }

          if (result.error) throw result.error;

          // 3. Update sync_logs
          executeSql(`
            UPDATE sync_logs SET sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `, [id]);

          // 4. Update the actual data table (reset is_dirty, set last_sync)
          // Avoid updating tables that don't have these columns (like config)
          try {
            executeSql(`
              UPDATE ${table_name} 
              SET is_dirty = 0, last_sync = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [record_id]);
          } catch (e) {
            // Table might not have metadata columns or might be missing
            console.log(`[SyncWorker] Skip metadata update for ${table_name}: ${e.message}`);
          }
        } catch (err) {
          executeSql(`
            UPDATE sync_logs SET attempts = attempts + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `, [err.message, log.id]);
          console.error(`[SyncWorker] Error en log ${log.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[SyncWorker] Error crítico:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }
}

const syncWorker = new SyncWorker();

module.exports = {
  syncWorker
};
