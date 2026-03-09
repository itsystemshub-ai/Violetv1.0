-- ============================================================================
-- SCRIPT: Jobs de Limpieza Automática
-- Descripción: Funciones y jobs para mantener la base de datos limpia
-- Impacto: Previene crecimiento ilimitado de tablas de logs
-- Riesgo: BAJO - Solo elimina datos antiguos ya sincronizados
-- ============================================================================

-- ============================================================================
-- FUNCIÓN 1: Limpieza de Sync Logs Sincronizados (7 días)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_cleanup_old_sync_logs()
RETURNS TABLE(deleted_count BIGINT, freed_space TEXT) AS $$
DECLARE
    v_deleted_count BIGINT;
    v_table_size_before BIGINT;
    v_table_size_after BIGINT;
BEGIN
    -- Obtener tamaño antes
    SELECT pg_total_relation_size('sync_logs') INTO v_table_size_before;
    
    -- Eliminar logs sincronizados mayores a 7 días
    DELETE FROM sync_logs
    WHERE sync_status = 'SYNCED'
      AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Vacuum para liberar espacio
    EXECUTE 'VACUUM ANALYZE sync_logs';
    
    -- Obtener tamaño después
    SELECT pg_total_relation_size('sync_logs') INTO v_table_size_after;
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        v_deleted_count,
        pg_size_pretty(v_table_size_before - v_table_size_after);
    
    RAISE NOTICE '✅ Limpieza completada: % filas eliminadas, % espacio liberado',
                 v_deleted_count,
                 pg_size_pretty(v_table_size_before - v_table_size_after);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN 2: Limpieza de Sync Logs Fallidos (30 días)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_cleanup_failed_sync_logs()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
    v_deleted_count BIGINT;
BEGIN
    -- Eliminar logs fallidos mayores a 30 días
    DELETE FROM sync_logs
    WHERE sync_status = 'FAILED'
      AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count;
    
    RAISE NOTICE '✅ Logs fallidos limpiados: % filas eliminadas', v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN 3: Archivado de Facturas Antiguas (1 año)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_archive_old_invoices()
RETURNS TABLE(archived_count BIGINT) AS $$
DECLARE
    v_archived_count BIGINT;
BEGIN
    -- Crear tabla de archivo si no existe
    CREATE TABLE IF NOT EXISTS invoices_archive (
        LIKE invoices INCLUDING ALL
    );
    
    -- Mover facturas antiguas a archivo
    WITH moved_rows AS (
        DELETE FROM invoices
        WHERE date < NOW() - INTERVAL '1 year'
        AND status IN ('pagada', 'anulada')
        RETURNING *
    )
    INSERT INTO invoices_archive
    SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_archived_count;
    
    RAISE NOTICE '✅ Facturas archivadas: % filas movidas', v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN 4: Limpieza de Sesiones Expiradas
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_cleanup_expired_sessions()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
    v_deleted_count BIGINT;
BEGIN
    -- Eliminar sesiones expiradas (si existe tabla de sesiones)
    DELETE FROM auth.sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count;
    
    RAISE NOTICE '✅ Sesiones expiradas limpiadas: % filas eliminadas', v_deleted_count;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE '⚠️  Tabla auth.sessions no existe, saltando limpieza';
        RETURN QUERY SELECT 0::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN 5: Reporte de Salud de Base de Datos
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_database_health_report()
RETURNS TABLE(
    metric TEXT,
    value TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Tamaño de sync_logs
    SELECT 
        'Sync Logs Size'::TEXT,
        pg_size_pretty(pg_total_relation_size('sync_logs')),
        CASE 
            WHEN pg_total_relation_size('sync_logs') > 1073741824 THEN '🔴 CRÍTICO'
            WHEN pg_total_relation_size('sync_logs') > 536870912 THEN '🟠 ALERTA'
            ELSE '🟢 OK'
        END
    
    UNION ALL
    
    -- Logs pendientes
    SELECT 
        'Pending Sync Logs'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 10000 THEN '🔴 CRÍTICO'
            WHEN COUNT(*) > 5000 THEN '🟠 ALERTA'
            ELSE '🟢 OK'
        END
    FROM sync_logs
    WHERE sync_status = 'PENDING'
    
    UNION ALL
    
    -- Logs fallidos
    SELECT 
        'Failed Sync Logs'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 1000 THEN '🔴 CRÍTICO'
            WHEN COUNT(*) > 500 THEN '🟠 ALERTA'
            ELSE '🟢 OK'
        END
    FROM sync_logs
    WHERE sync_status = 'FAILED'
    
    UNION ALL
    
    -- Cache hit ratio
    SELECT 
        'Cache Hit Ratio'::TEXT,
        ROUND((sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2)::TEXT || '%',
        CASE 
            WHEN (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) < 0.90 THEN '🔴 CRÍTICO'
            WHEN (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) < 0.95 THEN '🟠 ALERTA'
            ELSE '🟢 OK'
        END
    FROM pg_statio_user_tables
    
    UNION ALL
    
    -- Conexiones activas
    SELECT 
        'Active Connections'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) > 80 THEN '🔴 CRÍTICO'
            WHEN COUNT(*) > 50 THEN '🟠 ALERTA'
            ELSE '🟢 OK'
        END
    FROM pg_stat_activity
    WHERE state = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONFIGURACIÓN DE JOBS (pg_cron)
-- ============================================================================

-- NOTA: pg_cron debe estar habilitado en Supabase
-- Si no está disponible, ejecutar estas funciones desde el backend con cron

-- Job 1: Limpieza diaria de sync logs (3 AM)
SELECT cron.schedule(
    'cleanup-sync-logs-daily',
    '0 3 * * *',
    $$SELECT fn_cleanup_old_sync_logs()$$
);

-- Job 2: Limpieza semanal de logs fallidos (Domingo 3 AM)
SELECT cron.schedule(
    'cleanup-failed-logs-weekly',
    '0 3 * * 0',
    $$SELECT fn_cleanup_failed_sync_logs()$$
);

-- Job 3: Archivado mensual de facturas (Primer día del mes, 2 AM)
SELECT cron.schedule(
    'archive-old-invoices-monthly',
    '0 2 1 * *',
    $$SELECT fn_archive_old_invoices()$$
);

-- Job 4: Limpieza diaria de sesiones (4 AM)
SELECT cron.schedule(
    'cleanup-expired-sessions-daily',
    '0 4 * * *',
    $$SELECT fn_cleanup_expired_sessions()$$
);

-- Job 5: Reporte de salud semanal (Lunes 8 AM)
SELECT cron.schedule(
    'database-health-report-weekly',
    '0 8 * * 1',
    $$SELECT * FROM fn_database_health_report()$$
);

-- ============================================================================
-- VALIDACIÓN
-- ============================================================================

-- Ver jobs programados
SELECT * FROM cron.job ORDER BY jobid;

-- Ejecutar limpieza manual (testing)
SELECT * FROM fn_cleanup_old_sync_logs();
SELECT * FROM fn_cleanup_failed_sync_logs();

-- Ver reporte de salud
SELECT * FROM fn_database_health_report();

RAISE NOTICE '✅ Jobs de limpieza configurados exitosamente';
RAISE NOTICE '📊 Ejecuta SELECT * FROM fn_database_health_report() para ver el estado';
