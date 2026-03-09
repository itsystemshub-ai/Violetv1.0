-- ============================================================================
-- SCRIPT: Queries de Monitoreo y Diagnóstico
-- Descripción: Colección de queries útiles para monitorear performance
-- Uso: Ejecutar queries individuales según necesidad
-- ============================================================================

-- ============================================================================
-- 1. TAMAÑO DE TABLAS E ÍNDICES
-- ============================================================================

-- Tamaño de todas las tablas (ordenado por tamaño)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- ============================================================================
-- 2. USO DE ÍNDICES
-- ============================================================================

-- Índices más usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;

-- Índices NO usados (candidatos a eliminar)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey'
AND indexname NOT LIKE '%_unique'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Eficiencia de índices (ratio de uso)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    CASE 
        WHEN idx_scan = 0 THEN 0
        ELSE ROUND((idx_tup_read::NUMERIC / idx_scan), 2)
    END AS avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;

-- ============================================================================
-- 3. CACHE HIT RATIO
-- ============================================================================

-- Cache hit ratio global (debe ser > 95%)
SELECT 
    'Cache Hit Ratio' AS metric,
    ROUND(
        (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100,
        2
    ) AS percentage,
    CASE 
        WHEN (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) >= 0.95 THEN '🟢 EXCELENTE'
        WHEN (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) >= 0.90 THEN '🟡 ACEPTABLE'
        ELSE '🔴 CRÍTICO'
    END AS status
FROM pg_statio_user_tables;

-- Cache hit ratio por tabla
SELECT 
    schemaname,
    tablename,
    heap_blks_read AS disk_reads,
    heap_blks_hit AS cache_hits,
    CASE 
        WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 0
        ELSE ROUND((heap_blks_hit::NUMERIC / (heap_blks_hit + heap_blks_read)) * 100, 2)
    END AS cache_hit_ratio
FROM pg_statio_user_tables
WHERE (heap_blks_hit + heap_blks_read) > 0
ORDER BY cache_hit_ratio ASC;

-- ============================================================================
-- 4. QUERIES LENTAS (requiere pg_stat_statements)
-- ============================================================================

-- Top 20 queries más lentas (por tiempo promedio)
SELECT 
    LEFT(query, 100) AS query_preview,
    calls,
    ROUND(total_exec_time::NUMERIC, 2) AS total_time_ms,
    ROUND(mean_exec_time::NUMERIC, 2) AS avg_time_ms,
    ROUND(max_exec_time::NUMERIC, 2) AS max_time_ms,
    ROUND((total_exec_time / sum(total_exec_time) OVER ()) * 100, 2) AS pct_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Top 20 queries más ejecutadas
SELECT 
    LEFT(query, 100) AS query_preview,
    calls,
    ROUND(total_exec_time::NUMERIC, 2) AS total_time_ms,
    ROUND(mean_exec_time::NUMERIC, 2) AS avg_time_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- ============================================================================
-- 5. BLOQUEOS Y DEADLOCKS
-- ============================================================================

-- Bloqueos activos
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement,
    blocked_activity.application_name AS blocked_application
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Queries bloqueadas (simplificado)
SELECT 
    pid,
    usename,
    pg_blocking_pids(pid) AS blocked_by,
    query AS blocked_query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- ============================================================================
-- 6. CONEXIONES Y SESIONES
-- ============================================================================

-- Conexiones activas por estado
SELECT 
    state,
    COUNT(*) AS connections,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM pg_stat_activity
GROUP BY state
ORDER BY connections DESC;

-- Conexiones por usuario y base de datos
SELECT 
    usename,
    datname,
    COUNT(*) AS connections,
    state
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
GROUP BY usename, datname, state
ORDER BY connections DESC;

-- Conexiones idle más antiguas
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    state_change,
    NOW() - state_change AS idle_duration,
    query
FROM pg_stat_activity
WHERE state = 'idle'
AND pid <> pg_backend_pid()
ORDER BY state_change ASC
LIMIT 10;

-- ============================================================================
-- 7. VACUUM Y AUTOVACUUM
-- ============================================================================

-- Estado de vacuum por tabla
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count,
    n_dead_tup AS dead_tuples,
    n_live_tup AS live_tuples,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) * 100, 2) AS dead_tuple_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Tablas que necesitan vacuum urgente
SELECT 
    schemaname,
    tablename,
    n_dead_tup AS dead_tuples,
    n_live_tup AS live_tuples,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) * 100, 2) AS dead_tuple_pct,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
AND (n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0)) > 0.1
ORDER BY dead_tuple_pct DESC;

-- ============================================================================
-- 8. ESTADÍSTICAS DE SYNC LOGS
-- ============================================================================

-- Resumen de sync logs
SELECT 
    sync_status,
    COUNT(*) AS count,
    pg_size_pretty(SUM(pg_column_size(payload))) AS payload_size,
    MIN(created_at) AS oldest,
    MAX(created_at) AS newest,
    AVG(attempts) AS avg_attempts
FROM sync_logs
GROUP BY sync_status
ORDER BY count DESC;

-- Sync logs por tabla
SELECT 
    table_name,
    sync_status,
    COUNT(*) AS count,
    AVG(attempts) AS avg_attempts
FROM sync_logs
GROUP BY table_name, sync_status
ORDER BY count DESC;

-- Sync logs fallidos con más intentos
SELECT 
    table_name,
    record_id,
    attempts,
    last_error,
    created_at,
    updated_at
FROM sync_logs
WHERE sync_status = 'FAILED'
ORDER BY attempts DESC
LIMIT 20;

-- ============================================================================
-- 9. PERFORMANCE GENERAL
-- ============================================================================

-- Estadísticas de I/O por tabla
SELECT 
    schemaname,
    tablename,
    heap_blks_read AS disk_reads,
    heap_blks_hit AS cache_hits,
    idx_blks_read AS index_disk_reads,
    idx_blks_hit AS index_cache_hits,
    toast_blks_read AS toast_disk_reads,
    toast_blks_hit AS toast_cache_hits
FROM pg_statio_user_tables
WHERE heap_blks_read + heap_blks_hit > 0
ORDER BY heap_blks_read DESC;

-- Tablas con más inserts/updates/deletes
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_tup_ins + n_tup_upd + n_tup_del AS total_changes
FROM pg_stat_user_tables
ORDER BY total_changes DESC;

-- ============================================================================
-- 10. REPORTE DE SALUD COMPLETO
-- ============================================================================

-- Ejecutar función de reporte de salud (si existe)
SELECT * FROM fn_database_health_report();

-- Resumen manual si la función no existe
SELECT 
    'Database Size' AS metric,
    pg_size_pretty(pg_database_size(current_database())) AS value,
    '🟢 INFO' AS status
UNION ALL
SELECT 
    'Total Tables',
    COUNT(*)::TEXT,
    '🟢 INFO'
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::TEXT,
    '🟢 INFO'
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Active Connections',
    COUNT(*)::TEXT,
    CASE 
        WHEN COUNT(*) > 80 THEN '🔴 CRÍTICO'
        WHEN COUNT(*) > 50 THEN '🟠 ALERTA'
        ELSE '🟢 OK'
    END
FROM pg_stat_activity
WHERE state = 'active';

-- ============================================================================
-- NOTAS DE USO
-- ============================================================================

/*
CÓMO USAR ESTE SCRIPT:

1. Ejecutar queries individuales según necesidad
2. Guardar resultados para comparación histórica
3. Configurar alertas basadas en umbrales críticos
4. Ejecutar semanalmente para monitoreo proactivo

UMBRALES RECOMENDADOS:
- Cache Hit Ratio: > 95%
- Dead Tuple %: < 10%
- Conexiones Activas: < 80% del máximo
- Índices No Usados: Revisar y eliminar
- Sync Logs: < 100MB total

TROUBLESHOOTING:
- Si cache hit ratio < 90%: Aumentar shared_buffers
- Si muchos dead tuples: Ajustar autovacuum
- Si queries lentas: Revisar índices y EXPLAIN ANALYZE
- Si bloqueos frecuentes: Reducir duración de transacciones
*/
