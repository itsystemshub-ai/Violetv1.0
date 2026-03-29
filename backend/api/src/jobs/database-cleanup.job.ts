/**
 * Job de Limpieza Automática de Base de Datos
 * Se ejecuta diariamente para mantener la base de datos limpia
 */

import { createClient } from '@supabase/supabase-js';
import * as cron from 'node-cron';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Limpia sync_logs antiguos (> 7 días)
 */
async function cleanupSyncLogs() {
  console.log('[Cleanup Job] Iniciando limpieza de sync_logs...');
  
  try {
    const { data, error } = await supabase.rpc('fn_cleanup_old_sync_logs');
    
    if (error) {
      console.error('[Cleanup Job] Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const result = data[0];
      console.log(`[Cleanup Job] ✅ Eliminados: ${result.deleted_count} registros`);
      console.log(`[Cleanup Job] 💾 Espacio liberado: ${result.freed_space}`);
    }
  } catch (err: any) {
    console.error('[Cleanup Job] Error fatal:', err.message);
  }
}

/**
 * Genera reporte de salud de la base de datos
 */
async function generateHealthReport() {
  console.log('[Health Report] Generando reporte...');
  
  try {
    const { data, error } = await supabase.rpc('fn_database_health_report');
    
    if (error) {
      console.error('[Health Report] Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('[Health Report] Estado de la base de datos:');
      data.forEach((row: any) => {
        console.log(`   ${row.status} ${row.metric}: ${row.value}`);
      });
      
      // Alertar si hay problemas críticos
      const critical = data.filter((row: any) => row.status.includes('🔴'));
      if (critical.length > 0) {
        console.warn('[Health Report] ⚠️  ALERTA: Se detectaron problemas críticos!');
        critical.forEach((row: any) => {
          console.warn(`   - ${row.metric}: ${row.value}`);
        });
      }
    }
  } catch (err: any) {
    console.error('[Health Report] Error fatal:', err.message);
  }
}

/**
 * Limpia sesiones expiradas
 */
async function cleanupExpiredSessions() {
  console.log('[Cleanup Job] Limpiando sesiones expiradas...');
  
  try {
    const { data, error } = await supabase
      .from('auth.sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error && !error.message.includes('does not exist')) {
      console.error('[Cleanup Job] Error:', error.message);
      return;
    }
    
    console.log('[Cleanup Job] ✅ Sesiones expiradas limpiadas');
  } catch (err: any) {
    // Tabla puede no existir, ignorar error
    console.log('[Cleanup Job] Tabla de sesiones no disponible, saltando...');
  }
}

/**
 * Inicializa los jobs programados
 */
export function initDatabaseCleanupJobs() {
  console.log('[Database Jobs] Inicializando jobs de limpieza...');
  
  // Job 1: Limpieza diaria de sync_logs (3:00 AM)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron] Ejecutando limpieza diaria de sync_logs...');
    await cleanupSyncLogs();
  });
  
  // Job 2: Reporte de salud semanal (Lunes 8:00 AM)
  cron.schedule('0 8 * * 1', async () => {
    console.log('[Cron] Ejecutando reporte de salud semanal...');
    await generateHealthReport();
  });
  
  // Job 3: Limpieza de sesiones (diaria 4:00 AM)
  cron.schedule('0 4 * * *', async () => {
    console.log('[Cron] Ejecutando limpieza de sesiones...');
    await cleanupExpiredSessions();
  });
  
  // Job 4: Reporte de salud diario (cada día 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Ejecutando reporte de salud diario...');
    await generateHealthReport();
  });
  
  console.log('[Database Jobs] ✅ Jobs programados:');
  console.log('   - Limpieza sync_logs: Diario 3:00 AM');
  console.log('   - Reporte salud: Lunes 8:00 AM');
  console.log('   - Limpieza sesiones: Diario 4:00 AM');
  console.log('   - Reporte diario: Diario 9:00 AM');
  
  // Ejecutar reporte inicial
  setTimeout(() => {
    generateHealthReport();
  }, 5000);
}

// Exportar funciones para uso manual
export {
  cleanupSyncLogs,
  generateHealthReport,
  cleanupExpiredSessions
};
