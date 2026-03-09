/**
 * Script de Optimización de Base de Datos
 * Ejecuta las mejoras P0 (críticas) del plan de optimización
 * 
 * Uso: npx ts-node src/scripts/optimize-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface OptimizationResult {
  step: string;
  success: boolean;
  message: string;
  duration?: number;
}

const results: OptimizationResult[] = [];

async function executeSQL(sql: string, description: string): Promise<boolean> {
  const startTime = Date.now();
  console.log(`\n🔄 Ejecutando: ${description}...`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      results.push({
        step: description,
        success: false,
        message: error.message,
        duration: Date.now() - startTime
      });
      return false;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Completado en ${duration}ms`);
    results.push({
      step: description,
      success: true,
      message: 'Ejecutado exitosamente',
      duration
    });
    return true;
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    results.push({
      step: description,
      success: false,
      message: err.message,
      duration: Date.now() - startTime
    });
    return false;
  }
}

async function checkTableSize(tableName: string) {
  console.log(`\n📊 Verificando tamaño de ${tableName}...`);
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `SELECT pg_size_pretty(pg_total_relation_size('${tableName}')) as size;`
  });
  
  if (!error && data) {
    console.log(`   Tamaño actual: ${JSON.stringify(data)}`);
  }
}

async function main() {
  console.log('🚀 Iniciando Optimización de Base de Datos');
  console.log('=' .repeat(60));
  
  // ============================================================================
  // FASE 0: CRÍTICO - Limpieza y Índices
  // ============================================================================
  
  console.log('\n📋 FASE 0: OPTIMIZACIONES CRÍTICAS');
  console.log('=' .repeat(60));
  
  // P0-1: Verificar estado inicial
  await checkTableSize('sync_logs');
  
  // P0-2: Habilitar extensión pg_trgm
  await executeSQL(
    'CREATE EXTENSION IF NOT EXISTS pg_trgm;',
    'Habilitar extensión pg_trgm'
  );
  
  // P0-3: Crear índice para limpieza de sync_logs
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_logs_created_at 
     ON sync_logs(created_at, sync_status)
     WHERE sync_status = 'SYNCED';`,
    'Crear índice para limpieza de sync_logs'
  );
  
  // P0-4: Limpieza inicial de sync_logs (7 días)
  console.log('\n🗑️  Limpiando sync_logs antiguos...');
  const { data: cleanupData, error: cleanupError } = await supabase.rpc('exec_sql', {
    sql_query: `
      WITH deleted AS (
        DELETE FROM sync_logs
        WHERE sync_status = 'SYNCED'
        AND created_at < NOW() - INTERVAL '7 days'
        RETURNING *
      )
      SELECT COUNT(*) as deleted_count FROM deleted;
    `
  });
  
  if (!cleanupError && cleanupData) {
    console.log(`✅ Eliminados: ${JSON.stringify(cleanupData)} registros`);
  }
  
  // P0-5: VACUUM sync_logs
  await executeSQL(
    'VACUUM ANALYZE sync_logs;',
    'VACUUM ANALYZE sync_logs'
  );
  
  await checkTableSize('sync_logs');
  
  // P0-6: Índices de búsqueda en productos
  console.log('\n🔍 Creando índices de búsqueda...');
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm 
     ON products USING GIN (LOWER(name) gin_trgm_ops);`,
    'Índice de búsqueda por nombre de producto'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_oem_trgm 
     ON products USING GIN (LOWER(oem) gin_trgm_ops)
     WHERE oem IS NOT NULL;`,
    'Índice de búsqueda por código OEM'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_cauplas_trgm 
     ON products USING GIN (LOWER(cauplas) gin_trgm_ops)
     WHERE cauplas IS NOT NULL;`,
    'Índice de búsqueda por código Cauplas'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_status 
     ON products(category, status) 
     WHERE status != 'descontinuado';`,
    'Índice compuesto categoría-estado'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_tenant_id 
     ON products(tenant_id)
     WHERE tenant_id IS NOT NULL;`,
    'Índice para multi-tenancy'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock 
     ON products(stock, min_stock) 
     WHERE stock <= min_stock;`,
    'Índice para alertas de stock bajo'
  );
  
  // P0-7: Índices en facturas
  console.log('\n📄 Creando índices en facturas...');
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_number_trgm 
     ON invoices USING GIN (LOWER(number) gin_trgm_ops);`,
    'Índice de búsqueda por número de factura'
  );
  
  await executeSQL(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_tenant_date_status 
     ON invoices(tenant_id, date DESC, status)
     WHERE tenant_id IS NOT NULL;`,
    'Índice compuesto facturas'
  );
  
  // P0-8: Crear funciones de limpieza
  console.log('\n🔧 Creando funciones de limpieza automática...');
  
  await executeSQL(
    `CREATE OR REPLACE FUNCTION fn_cleanup_old_sync_logs()
     RETURNS TABLE(deleted_count BIGINT, freed_space TEXT) AS $$
     DECLARE
         v_deleted_count BIGINT;
         v_table_size_before BIGINT;
         v_table_size_after BIGINT;
     BEGIN
         SELECT pg_total_relation_size('sync_logs') INTO v_table_size_before;
         
         DELETE FROM sync_logs
         WHERE sync_status = 'SYNCED'
           AND created_at < NOW() - INTERVAL '7 days';
         
         GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
         
         EXECUTE 'VACUUM ANALYZE sync_logs';
         
         SELECT pg_total_relation_size('sync_logs') INTO v_table_size_after;
         
         RETURN QUERY SELECT 
             v_deleted_count,
             pg_size_pretty(v_table_size_before - v_table_size_after);
     END;
     $$ LANGUAGE plpgsql;`,
    'Función de limpieza de sync_logs'
  );
  
  await executeSQL(
    `CREATE OR REPLACE FUNCTION fn_database_health_report()
     RETURNS TABLE(metric TEXT, value TEXT, status TEXT) AS $$
     BEGIN
         RETURN QUERY
         SELECT 
             'Sync Logs Size'::TEXT,
             pg_size_pretty(pg_total_relation_size('sync_logs')),
             CASE 
                 WHEN pg_total_relation_size('sync_logs') > 1073741824 THEN '🔴 CRÍTICO'
                 WHEN pg_total_relation_size('sync_logs') > 536870912 THEN '🟠 ALERTA'
                 ELSE '🟢 OK'
             END;
     END;
     $$ LANGUAGE plpgsql;`,
    'Función de reporte de salud'
  );
  
  // P0-9: Actualizar estadísticas
  console.log('\n📊 Actualizando estadísticas...');
  
  await executeSQL('ANALYZE products;', 'ANALYZE products');
  await executeSQL('ANALYZE invoices;', 'ANALYZE invoices');
  await executeSQL('ANALYZE sync_logs;', 'ANALYZE sync_logs');
  
  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE OPTIMIZACIÓN');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.success === false).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`\n✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`⏱️  Tiempo total: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  
  if (failed > 0) {
    console.log('\n❌ Pasos fallidos:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.step}: ${r.message}`);
    });
  }
  
  console.log('\n✅ Optimización completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Verificar métricas de performance');
  console.log('   2. Configurar job de limpieza automática');
  console.log('   3. Monitorear por 24-48 horas');
  console.log('   4. Ejecutar: SELECT * FROM fn_database_health_report();');
}

// Ejecutar
main()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
