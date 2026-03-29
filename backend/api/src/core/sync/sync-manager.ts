import postgres from 'postgres';
import { supabase } from './supabase';

/**
 * SyncManager
 * El "Worker Service" que corre solo en el Computador Maestro (A).
 * Utiliza la librería 'postgres' para conectar con el motor local.
 */
export class SyncManager {
  private isProcessing = false;
  private intervalMs = 15000; // 15 segundos para no saturar
  private sql: any = null;

  constructor() {
    console.log('[SyncManager] Inicializado para el Maestro Local.');
  }

  /**
   * Inicializa la conexión local (Postgres)
   */
  private async initSql() {
    if (this.sql) return true;
    try {
      // Configuración por defecto para PostgreSQL local
      this.sql = postgres({
        host: 'localhost',
        port: 5432,
        database: 'violet_erp',
        username: 'postgres',
        password: 'password', // TODO: Cargar de config segura
      });
      return true;
    } catch (err) {
      console.error('[SyncManager] Error al conectar con DB local:', err);
      return false;
    }
  }

  /**
   * Inicia el ciclo de sincronización
   */
  public async start() {
    const connected = await this.initSql();
    if (!connected) return;
    
    console.log('[SyncManager] Sincronización activa.');
    setInterval(() => this.processQueue(), this.intervalMs);
  }

  /**
   * Procesa la cola de registros pendientes (Push to Cloud)
   */
  private async processQueue() {
    if (this.isProcessing || !this.sql) return;
    this.isProcessing = true;

    try {
      // 1. Obtener registros pendientes de la DB local
      const pending = await this.sql`
        SELECT * FROM sync_logs 
        WHERE sync_status = 'PENDING' 
        AND attempts < 5 
        ORDER BY created_at ASC 
        LIMIT 20
      `;

      if (pending.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[SyncManager] Procesando ${pending.length} cambios...`);

      for (const log of pending) {
        try {
          // 2. Ejecutar acción en Supabase
          const { error } = await this.syncRecordToCloud(log);
          
          if (error) throw error;

          // 3. Marcar como sincronizado en DB Local
          await this.sql`
            UPDATE sync_logs 
            SET sync_status = 'SYNCED', 
                updated_at = NOW() 
            WHERE id = ${log.id}
          `;
          
          console.log(`[SyncManager] ✓ Sincronizado: ${log.table_name} (${log.record_id})`);
          
        } catch (err: any) {
          // 4. Manejar error y aumentar reintentos
          await this.sql`
            UPDATE sync_logs 
            SET attempts = attempts + 1, 
                last_error = ${err.message},
                updated_at = NOW()
            WHERE id = ${log.id}
          `;
          console.error(`[SyncManager] ✗ Error en ${log.record_id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[SyncManager] Error crítico en el ciclo:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Lógica interna para mapear acciones locales a la API de Supabase
   */
  private async syncRecordToCloud(log: any) {
    const { table_name, action, payload } = log;
    
    if (action === 'INSERT' || action === 'UPDATE') {
      // Usamos upsert para manejar tanto inserciones como actualizaciones
      return await supabase.from(table_name).upsert(payload);
    } else if (action === 'DELETE') {
      return await supabase.from(table_name).delete().eq('id', log.record_id);
    }
    
    return { error: { message: 'Acción no soportada' } };
  }
}

export const syncManager = new SyncManager();
