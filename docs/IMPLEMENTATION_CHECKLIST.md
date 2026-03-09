# ✅ Checklist de Implementación - Optimización de Base de Datos

## 📋 Pre-Implementación

### Preparación (1 hora)
- [ ] **Backup completo de base de datos**
  ```bash
  pg_dump -h your_host -U your_user -d your_database -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- [ ] **Documentar estado actual**
  ```sql
  -- Guardar en archivo: baseline_metrics.txt
  \o baseline_metrics.txt
  SELECT * FROM fn_database_health_report();
  \o
  ```
- [ ] **Notificar al equipo** sobre ventana de mantenimiento
- [ ] **Verificar espacio en disco** (mínimo 20% libre)
  ```sql
  SELECT pg_size_pretty(pg_database_size(current_database()));
  ```
- [ ] **Configurar monitoreo temporal** para detectar problemas

---

## 🚨 Fase 0: Crítico (4 horas) - EJECUTAR PRIMERO

### P0-1: Limpieza de Sync Logs (30 min)

- [ ] **Verificar tamaño actual**
  ```sql
  SELECT pg_size_pretty(pg_total_relation_size('sync_logs'));
  SELECT COUNT(*) FROM sync_logs;
  ```

- [ ] **Crear índice para limpieza eficiente**
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_logs_created_at 
  ON sync_logs(created_at, sync_status)
  WHERE sync_status = 'SYNCED';
  ```

- [ ] **Limpieza manual inicial** (ejecutar en lotes si hay muchos registros)
  ```sql
  -- Lote 1: Eliminar logs > 30 días
  DELETE FROM sync_logs
  WHERE sync_status = 'SYNCED'
  AND created_at < NOW() - INTERVAL '30 days'
  LIMIT 10000;
  
  -- Repetir hasta que no haya más registros
  -- Luego reducir a 7 días
  DELETE FROM sync_logs
  WHERE sync_status = 'SYNCED'
  AND created_at < NOW() - INTERVAL '7 days'
  LIMIT 10000;
  ```

- [ ] **Ejecutar VACUUM**
  ```sql
  VACUUM ANALYZE sync_logs;
  ```

- [ ] **Verificar reducción de tamaño**
  ```sql
  SELECT pg_size_pretty(pg_total_relation_size('sync_logs'));
  ```

### P0-2: Índices de Búsqueda (2 horas)

- [ ] **Ejecutar script completo**
  ```bash
  psql -d your_database -f database/scripts/create_search_indexes.sql
  ```

- [ ] **Verificar creación de índices**
  ```sql
  SELECT 
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  ORDER BY tablename;
  ```

- [ ] **Probar búsquedas optimizadas**
  ```sql
  -- Antes (sin índice)
  EXPLAIN ANALYZE
  SELECT * FROM products WHERE name ILIKE '%busqueda%';
  
  -- Después (con índice)
  EXPLAIN ANALYZE
  SELECT id, name, price, stock 
  FROM products 
  WHERE LOWER(name) LIKE LOWER('%busqueda%');
  ```

- [ ] **Comparar tiempos** (debe ser 5-10x más rápido)

### P0-3: Jobs de Limpieza Automática (1 hora)

- [ ] **Ejecutar script de jobs**
  ```bash
  psql -d your_database -f database/scripts/cleanup_jobs.sql
  ```

- [ ] **Verificar funciones creadas**
  ```sql
  \df fn_cleanup_*
  ```

- [ ] **Probar funciones manualmente**
  ```sql
  SELECT * FROM fn_cleanup_old_sync_logs();
  SELECT * FROM fn_database_health_report();
  ```

- [ ] **Verificar jobs programados** (si pg_cron está disponible)
  ```sql
  SELECT * FROM cron.job;
  ```

- [ ] **Alternativa: Configurar cron en backend** si pg_cron no está disponible
  ```javascript
  // backend/src/jobs/database-cleanup.js
  const cron = require('node-cron');
  
  // Diario a las 3 AM
  cron.schedule('0 3 * * *', async () => {
    await supabase.rpc('fn_cleanup_old_sync_logs');
  });
  ```

### P0-4: Validación Crítica (30 min)

- [ ] **Ejecutar reporte de salud**
  ```sql
  SELECT * FROM fn_database_health_report();
  ```

- [ ] **Verificar métricas clave**
  ```sql
  -- Cache hit ratio
  SELECT 
      ROUND((sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2) AS cache_hit_pct
  FROM pg_statio_user_tables;
  
  -- Tamaño de tablas
  SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(tablename::regclass) DESC
  LIMIT 10;
  ```

- [ ] **Probar aplicación** en ambiente de staging/desarrollo

---

## 🟠 Fase 1: Alto Impacto (8 horas) - SIGUIENTE SPRINT

### P1-1: Índices JSONB (2 horas)

- [ ] **Crear índices JSONB**
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_ventas_history 
  ON products USING GIN (ventas_history);
  
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_metadata 
  ON products USING GIN (metadata);
  ```

- [ ] **Probar queries JSONB**
  ```sql
  EXPLAIN ANALYZE
  SELECT id, name, ventas_history
  FROM products
  WHERE ventas_history ? '2025';
  ```

### P1-2: Optimización de Triggers (3 horas)

- [ ] **Crear función optimizada**
  ```sql
  CREATE OR REPLACE FUNCTION fn_log_sync_change_optimized()
  RETURNS TRIGGER AS $$
  BEGIN
      -- Solo loguear cambios reales
      IF (TG_OP = 'UPDATE' AND NEW = OLD) THEN
          RETURN NULL;
      END IF;
      
      INSERT INTO sync_logs (table_name, record_id, action, payload)
      VALUES (
          TG_TABLE_NAME,
          CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
          TG_OP,
          CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
      );
      RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] **Reemplazar triggers**
  ```sql
  DROP TRIGGER IF EXISTS trg_sync_products ON products;
  CREATE TRIGGER trg_sync_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change_optimized();
  ```

- [ ] **Benchmark antes/después**
  ```sql
  -- Medir tiempo de 1000 inserts
  \timing on
  INSERT INTO products (name, price, stock, ...) 
  SELECT ...
  FROM generate_series(1, 1000);
  \timing off
  ```

### P1-3: Particionamiento (3 horas)

- [ ] **Crear tabla particionada** (solo si sync_logs > 1GB)
- [ ] **Migrar datos en lotes**
- [ ] **Validar queries en particiones**
- [ ] **Configurar creación automática de particiones**

---

## 🟡 Fase 2: Mejoras Continuas (16 horas) - SPRINT 2

### P2-1: Refactorizar Queries SELECT * (8 horas)

- [ ] **Identificar queries problemáticas**
  ```sql
  SELECT query, calls, mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%SELECT *%'
  ORDER BY mean_exec_time DESC;
  ```

- [ ] **Refactorizar en código TypeScript**
  ```typescript
  // ❌ ANTES
  const products = await supabase.from('products').select('*');
  
  // ✅ DESPUÉS
  const products = await supabase
    .from('products')
    .select('id, name, price, stock, category, status');
  ```

- [ ] **Code review de cambios**
- [ ] **Testing exhaustivo**

### P2-2: Configurar Monitoreo (4 horas)

- [ ] **Instalar Grafana + Prometheus** (si no existe)
- [ ] **Configurar dashboards**
  - Query latency (p50, p95, p99)
  - Throughput (queries/sec)
  - Cache hit ratio
  - Table sizes
  - Connection pool usage

- [ ] **Configurar alertas**
  ```yaml
  alerts:
    - name: high_query_latency
      condition: p95 > 500ms
    - name: low_cache_hit
      condition: cache_hit_ratio < 0.95
    - name: sync_logs_size
      condition: size > 100MB
  ```

### P2-3: Documentación (4 horas)

- [ ] **Documentar cambios realizados**
- [ ] **Actualizar README del proyecto**
- [ ] **Crear guía de troubleshooting**
- [ ] **Training al equipo**

---

## 🔵 Fase 3: Seguridad y Archivado (24 horas) - SPRINT 3

### P3-1: Row Level Security (6 horas)

- [ ] **Habilitar RLS en tablas**
  ```sql
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **Crear políticas**
  ```sql
  CREATE POLICY tenant_isolation_products ON products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
  ```

- [ ] **Testing de políticas**
- [ ] **Validar performance con RLS**

### P3-2: Archivado Histórico (8 horas)

- [ ] **Crear tablas de archivo**
- [ ] **Implementar función de archivado**
- [ ] **Configurar job mensual**
- [ ] **Crear vistas unificadas**

### P3-3: Auditoría Final (10 horas)

- [ ] **Revisión completa de seguridad**
- [ ] **Optimización final de queries**
- [ ] **Documentación completa**
- [ ] **Plan de mantenimiento continuo**

---

## 📊 Post-Implementación (Continuo)

### Monitoreo Diario
- [ ] Revisar dashboard de Grafana
- [ ] Verificar alertas
- [ ] Revisar logs de errores

### Monitoreo Semanal
- [ ] Ejecutar queries de monitoreo
  ```bash
  psql -d your_database -f database/scripts/monitoring_queries.sql > weekly_report.txt
  ```
- [ ] Revisar índices no usados
- [ ] Verificar crecimiento de tablas
- [ ] Analizar queries lentas

### Monitoreo Mensual
- [ ] Ejecutar reporte de salud completo
- [ ] Revisar y ajustar políticas de retención
- [ ] Optimizar índices según uso real
- [ ] Actualizar documentación

---

## 🔄 Rollback Plan

### Si algo sale mal en Fase 0:

1. **Restaurar índices**
   ```sql
   DROP INDEX IF EXISTS idx_sync_logs_created_at;
   DROP INDEX IF EXISTS idx_products_name_trgm;
   -- etc.
   ```

2. **Restaurar funciones**
   ```sql
   DROP FUNCTION IF EXISTS fn_cleanup_old_sync_logs();
   DROP FUNCTION IF EXISTS fn_database_health_report();
   ```

3. **Restaurar backup completo** (último recurso)
   ```bash
   pg_restore -h your_host -U your_user -d your_database backup_YYYYMMDD_HHMMSS.dump
   ```

---

## ✅ Criterios de Éxito

### Métricas Objetivo

| Métrica | Baseline | Target | Actual | Status |
|---------|----------|--------|--------|--------|
| Búsqueda productos | 800ms | <100ms | ___ | ⏳ |
| Tamaño sync_logs | ___GB | <100MB | ___ | ⏳ |
| Cache hit ratio | ___% | >95% | ___ | ⏳ |
| Query p95 latency | ___ms | <500ms | ___ | ⏳ |
| Overhead triggers | ___% | <20% | ___ | ⏳ |

### Validación Final

- [ ] Todas las métricas objetivo alcanzadas
- [ ] Sin errores en logs por 48 horas
- [ ] Aplicación funcionando correctamente
- [ ] Equipo capacitado en nuevas prácticas
- [ ] Documentación completa y actualizada

---

**Fecha de inicio**: ___________  
**Fecha de finalización**: ___________  
**Responsable**: ___________  
**Aprobado por**: ___________
