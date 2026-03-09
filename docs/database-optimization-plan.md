# Plan de Optimización de Base de Datos - Sistema ERP Violet

## 📊 Contexto del Sistema

### Stack Tecnológico
- **Base de Datos**: PostgreSQL (Supabase)
- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript + Vite
- **ORM/Cliente**: Supabase Client + Dexie.js (IndexedDB local)
- **Arquitectura**: Híbrida (Local-First con sincronización cloud)

### Volumen Aproximado (Estimado)
- **Productos**: ~5,000-10,000 filas, crecimiento: 500/mes
- **Facturas**: ~2,000-5,000 filas, crecimiento: 300/mes
- **Transacciones Financieras**: ~10,000 filas, crecimiento: 1,000/mes
- **Empleados**: ~50-200 filas, crecimiento: 5/mes
- **Sync Logs**: Crecimiento exponencial sin límite

### Carga Estimada
- **Lecturas**: 100-500 consultas/minuto (picos en horario laboral)
- **Escrituras**: 20-100 inserts/updates/minuto
- **Sincronización**: Batch cada 5-30 segundos
- **Picos**: Cierre de mes, facturación masiva

### Problemas Actuales Detectados
1. ❌ **Sync logs sin límite** - Crecimiento infinito de tabla de logs
2. ❌ **Sin índices en campos de búsqueda** - Búsquedas por OEM, nombre, categoría lentas
3. ❌ **JSONB sin índices** - Campos `ventasHistory`, `metadata` sin optimizar
4. ❌ **N+1 queries potenciales** - Relaciones sin eager loading
5. ❌ **Sin particionamiento** - Tablas grandes sin estrategia de partición
6. ❌ **Triggers pesados** - Todos los cambios generan logs sin filtro
7. ❌ **Sin políticas de retención** - Datos históricos sin archivado

### Restricciones
- ✅ Ventana de mantenimiento: Madrugadas (2-5 AM)
- ✅ Presupuesto: Limitado (Supabase Free/Pro tier)
- ✅ Compatibilidad: Debe mantener sync local-cloud
- ✅ Zero downtime preferido

---

## 🔍 DIAGNÓSTICO INICIAL

### 1. Riesgos Principales

| Categoría | Riesgo | Severidad | Impacto |
|-----------|--------|-----------|---------|
| **Esquema** | Sync logs sin límite | 🔴 CRÍTICO | Disco lleno, queries lentas |
| **Índices** | Búsquedas sin índice | 🟠 ALTO | Latencia p95 > 2s |
| **Consultas** | SELECT * en todas partes | 🟡 MEDIO | Ancho de banda desperdiciado |
| **Transacciones** | Triggers en cada cambio | 🟠 ALTO | Overhead 30-50% |
| **Concurrencia** | Sin control de deadlocks | 🟡 MEDIO | Fallos esporádicos |

### 2. Antipatrones Detectados

#### ❌ A1: Sync Logs Sin Límite
```sql
-- PROBLEMA: Tabla crece infinitamente
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    -- Sin TTL, sin particionamiento
);
```

#### ❌ A2: Triggers en Todas las Operaciones
```sql
-- PROBLEMA: Overhead en cada INSERT/UPDATE/DELETE
CREATE TRIGGER trg_sync_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();
```

#### ❌ A3: Sin Índices en Búsquedas Comunes
```typescript
// PROBLEMA: Full table scan en búsquedas
const products = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${search}%`); // Sin índice GIN/trigram
```

#### ❌ A4: JSONB Sin Índices
```typescript
// PROBLEMA: Búsquedas en JSONB sin índice
interface Product {
  ventasHistory?: { 2023: number; 2024: number; 2025: number };
  metadata?: any;
}
```

#### ❌ A5: SELECT * Everywhere
```typescript
// PROBLEMA: Trae todos los campos innecesariamente
const { data } = await supabase.from('products').select('*');
```

---

## 📋 PLAN DE MEJORAS PRIORIZADO


| # | Problema | Impacto | Esfuerzo | Riesgo | Prioridad |
|---|----------|---------|----------|--------|-----------|
| 1 | Sync logs sin límite | 🔴 90% | 2h | Bajo | **P0 - CRÍTICO** |
| 2 | Índices en búsquedas | 🟠 70% | 1h | Bajo | **P0 - CRÍTICO** |
| 3 | Índices JSONB | 🟠 60% | 1h | Bajo | **P1 - ALTO** |
| 4 | Particionamiento sync_logs | 🟠 50% | 4h | Medio | **P1 - ALTO** |
| 5 | Optimizar triggers | 🟡 40% | 3h | Medio | **P2 - MEDIO** |
| 6 | SELECT específicos | 🟡 30% | 8h | Bajo | **P2 - MEDIO** |
| 7 | Políticas RLS | 🟡 25% | 6h | Alto | **P3 - BAJO** |
| 8 | Archivado histórico | 🟡 20% | 8h | Medio | **P3 - BAJO** |

---

## 🛠️ IMPLEMENTACIÓN DETALLADA

### P0-1: Limpieza Automática de Sync Logs (CRÍTICO)

**Problema**: Tabla `sync_logs` crece sin límite, puede llenar disco.

**Solución**: Política de retención automática (7 días).

```sql
-- ✅ MEJORA 1: Agregar índice en created_at para limpieza eficiente
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at 
ON sync_logs(created_at) 
WHERE sync_status = 'SYNCED';

-- ✅ MEJORA 2: Función de limpieza automática
CREATE OR REPLACE FUNCTION fn_cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_logs
    WHERE sync_status = 'SYNCED'
      AND created_at < NOW() - INTERVAL '7 days';
    
    -- Log de limpieza
    RAISE NOTICE 'Sync logs limpiados: % filas eliminadas', 
                 (SELECT COUNT(*) FROM sync_logs WHERE created_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql;

-- ✅ MEJORA 3: Job programado (pg_cron si está disponible)
-- Alternativa: Ejecutar desde backend con cron job
SELECT cron.schedule(
    'cleanup-sync-logs',
    '0 3 * * *', -- Diario a las 3 AM
    'SELECT fn_cleanup_old_sync_logs();'
);

-- ✅ MEJORA 4: Mantener logs FAILED por más tiempo (30 días)
CREATE OR REPLACE FUNCTION fn_cleanup_failed_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_logs
    WHERE sync_status = 'FAILED'
      AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

**Rollback**:
```sql
DROP FUNCTION IF EXISTS fn_cleanup_old_sync_logs();
DROP FUNCTION IF EXISTS fn_cleanup_failed_sync_logs();
DROP INDEX IF EXISTS idx_sync_logs_created_at;
```

**Métricas**:
- Antes: Crecimiento ilimitado (~10MB/día)
- Después: Máximo 7 días de logs (~70MB estable)
- KPI: `SELECT pg_size_pretty(pg_total_relation_size('sync_logs'));`

---

### P0-2: Índices en Búsquedas de Productos (CRÍTICO)

**Problema**: Búsquedas por nombre, OEM, categoría hacen full table scan.

**Solución**: Índices GIN con trigram para búsquedas ILIKE.

```sql
-- ✅ MEJORA 1: Habilitar extensión pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ✅ MEJORA 2: Índice GIN para búsqueda por nombre (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING GIN (LOWER(name) gin_trgm_ops);

-- ✅ MEJORA 3: Índice para búsqueda por código OEM
CREATE INDEX IF NOT EXISTS idx_products_oem_trgm 
ON products USING GIN (LOWER(oem) gin_trgm_ops);

-- ✅ MEJORA 4: Índice para búsqueda por código Cauplas
CREATE INDEX IF NOT EXISTS idx_products_cauplas_trgm 
ON products USING GIN (LOWER(cauplas) gin_trgm_ops);

-- ✅ MEJORA 5: Índice compuesto para filtros comunes
CREATE INDEX IF NOT EXISTS idx_products_category_status 
ON products(category, status) 
WHERE status != 'descontinuado';

-- ✅ MEJORA 6: Índice para tenant_id (multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_products_tenant_id 
ON products(tenant_id);

-- ✅ MEJORA 7: Índice para stock bajo (alertas)
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
ON products(stock, min_stock) 
WHERE stock <= min_stock;
```

**Uso optimizado en código**:
```typescript
// ❌ ANTES: Full table scan
const products = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${search}%`);

// ✅ DESPUÉS: Usa índice GIN
const products = await supabase
  .from('products')
  .select('id, name, price, stock, category, status')
  .or(`name.ilike.%${search}%,oem.ilike.%${search}%,cauplas.ilike.%${search}%`)
  .eq('tenant_id', tenantId)
  .neq('status', 'descontinuado')
  .order('name');
```

**Rollback**:
```sql
DROP INDEX IF EXISTS idx_products_name_trgm;
DROP INDEX IF EXISTS idx_products_oem_trgm;
DROP INDEX IF EXISTS idx_products_cauplas_trgm;
DROP INDEX IF EXISTS idx_products_category_status;
DROP INDEX IF EXISTS idx_products_tenant_id;
DROP INDEX IF EXISTS idx_products_low_stock;
```

**Métricas**:
- Antes: Búsqueda ~800ms (10k productos)
- Después: Búsqueda ~50ms
- KPI: `EXPLAIN ANALYZE SELECT ... WHERE name ILIKE '%search%';`

---

### P1-3: Índices JSONB para Ventas Históricas

**Problema**: Búsquedas y agregaciones en `ventasHistory` JSONB son lentas.

**Solución**: Índices GIN en campos JSONB.

```sql
-- ✅ MEJORA 1: Índice GIN en ventasHistory completo
CREATE INDEX IF NOT EXISTS idx_products_ventas_history 
ON products USING GIN (ventas_history);

-- ✅ MEJORA 2: Índice para búsquedas específicas por año
CREATE INDEX IF NOT EXISTS idx_products_ventas_2025 
ON products ((ventas_history->>'2025')) 
WHERE ventas_history ? '2025';

-- ✅ MEJORA 3: Índice en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_products_metadata 
ON products USING GIN (metadata);

-- ✅ MEJORA 4: Índice para ranking history
CREATE INDEX IF NOT EXISTS idx_products_ranking_history 
ON products USING GIN (ranking_history);
```

**Uso optimizado**:
```typescript
// ✅ Consulta optimizada con índice JSONB
const topSellers = await supabase
  .from('products')
  .select('id, name, ventas_history')
  .not('ventas_history', 'is', null)
  .order('(ventas_history->>\'2025\')::int', { ascending: false })
  .limit(10);
```

**Rollback**:
```sql
DROP INDEX IF EXISTS idx_products_ventas_history;
DROP INDEX IF EXISTS idx_products_ventas_2025;
DROP INDEX IF EXISTS idx_products_metadata;
DROP INDEX IF EXISTS idx_products_ranking_history;
```

---

### P1-4: Particionamiento de Sync Logs

**Problema**: Tabla `sync_logs` muy grande dificulta queries y mantenimiento.

**Solución**: Particionamiento por rango de fechas (mensual).

```sql
-- ✅ MEJORA 1: Crear tabla particionada
CREATE TABLE sync_logs_partitioned (
    id UUID DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    payload JSONB,
    sync_status TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- ✅ MEJORA 2: Crear particiones para próximos 3 meses
CREATE TABLE sync_logs_2025_01 PARTITION OF sync_logs_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE sync_logs_2025_02 PARTITION OF sync_logs_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE sync_logs_2025_03 PARTITION OF sync_logs_partitioned
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- ✅ MEJORA 3: Función para crear particiones automáticamente
CREATE OR REPLACE FUNCTION fn_create_sync_logs_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'sync_logs_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date::TEXT;
    end_date := (partition_date + INTERVAL '1 month')::TEXT;
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF sync_logs_partitioned FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;

-- ✅ MEJORA 4: Migración de datos existentes (ejecutar en ventana de mantenimiento)
-- NOTA: Esto puede tomar tiempo, ejecutar en lotes
INSERT INTO sync_logs_partitioned 
SELECT * FROM sync_logs 
WHERE created_at >= '2025-01-01'
LIMIT 10000; -- Ejecutar en lotes

-- ✅ MEJORA 5: Renombrar tablas (después de migración completa)
-- ALTER TABLE sync_logs RENAME TO sync_logs_old;
-- ALTER TABLE sync_logs_partitioned RENAME TO sync_logs;
```

**Rollback**:
```sql
-- Restaurar tabla original
ALTER TABLE sync_logs RENAME TO sync_logs_partitioned_backup;
ALTER TABLE sync_logs_old RENAME TO sync_logs;
```

---


### P2-5: Optimización de Triggers

**Problema**: Triggers se ejecutan en CADA operación, incluso cuando no es necesario.

**Solución**: Triggers condicionales y batch logging.

```sql
-- ✅ MEJORA 1: Trigger condicional (solo cambios significativos)
CREATE OR REPLACE FUNCTION fn_log_sync_change_optimized()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo loguear si hay cambios reales (no UPDATE sin cambios)
    IF (TG_OP = 'UPDATE' AND NEW = OLD) THEN
        RETURN NULL;
    END IF;
    
    -- Solo loguear campos importantes (no updated_at, last_sync, etc.)
    IF (TG_OP = 'UPDATE' AND 
        NEW.name = OLD.name AND 
        NEW.price = OLD.price AND 
        NEW.stock = OLD.stock) THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO sync_logs (table_name, record_id, action, payload)
    VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        CASE 
            WHEN TG_OP = 'DELETE' THEN NULL 
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
                'id', NEW.id,
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
                )
            )
            ELSE to_jsonb(NEW)
        END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ✅ MEJORA 2: Reemplazar triggers existentes
DROP TRIGGER IF EXISTS trg_sync_products ON products;
CREATE TRIGGER trg_sync_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change_optimized();

-- Repetir para otras tablas críticas
```

**Métricas**:
- Antes: 100% de operaciones generan logs
- Después: ~40% de operaciones generan logs (solo cambios reales)
- Reducción overhead: 60%

---

### P2-6: SELECT Específicos (Eliminar SELECT *)

**Problema**: Queries traen todos los campos innecesariamente.

**Solución**: Selects específicos por caso de uso.

```typescript
// ❌ ANTES: Trae todos los campos (incluyendo JSONB pesados)
const products = await supabase
  .from('products')
  .select('*');

// ✅ DESPUÉS: Solo campos necesarios
const products = await supabase
  .from('products')
  .select('id, name, price, stock, category, status');

// ✅ Para listados (mínimo)
const productList = await supabase
  .from('products')
  .select('id, name, price, stock')
  .eq('tenant_id', tenantId)
  .order('name');

// ✅ Para detalles (completo)
const productDetail = await supabase
  .from('products')
  .select('*, ventas_history, metadata')
  .eq('id', productId)
  .single();

// ✅ Para búsquedas (optimizado)
const searchResults = await supabase
  .from('products')
  .select('id, name, oem, cauplas, price, stock')
  .or(`name.ilike.%${query}%,oem.ilike.%${query}%`)
  .limit(20);
```

**Impacto**:
- Reducción ancho de banda: 60-70%
- Mejora latencia: 30-40%
- Reducción memoria cliente: 50%

---

### P3-7: Políticas RLS (Row Level Security)

**Problema**: Sin políticas de seguridad a nivel de fila.

**Solución**: RLS por tenant_id.

```sql
-- ✅ MEJORA 1: Habilitar RLS en tablas principales
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- ✅ MEJORA 2: Política para usuarios autenticados (solo su tenant)
CREATE POLICY tenant_isolation_products ON products
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ✅ MEJORA 3: Política para super admins (acceso total)
CREATE POLICY superadmin_access_products ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- ✅ MEJORA 4: Índice para optimizar RLS
CREATE INDEX IF NOT EXISTS idx_products_tenant_rls 
ON products(tenant_id) 
WHERE tenant_id IS NOT NULL;
```

**Uso en código**:
```typescript
// Configurar tenant_id en sesión
await supabase.rpc('set_tenant_context', { tenant_id: currentTenantId });

// Ahora todas las queries respetan RLS automáticamente
const products = await supabase.from('products').select('*');
```

---

### P3-8: Archivado Histórico

**Problema**: Datos antiguos ralentizan queries actuales.

**Solución**: Tablas de archivo para datos > 1 año.

```sql
-- ✅ MEJORA 1: Tabla de archivo para facturas
CREATE TABLE invoices_archive (
    LIKE invoices INCLUDING ALL
);

-- ✅ MEJORA 2: Función de archivado
CREATE OR REPLACE FUNCTION fn_archive_old_invoices()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_rows AS (
        DELETE FROM invoices
        WHERE date < NOW() - INTERVAL '1 year'
        AND status IN ('pagada', 'anulada')
        RETURNING *
    )
    INSERT INTO invoices_archive
    SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ✅ MEJORA 3: Vista unificada (actual + archivo)
CREATE VIEW invoices_all AS
SELECT *, false AS is_archived FROM invoices
UNION ALL
SELECT *, true AS is_archived FROM invoices_archive;

-- ✅ MEJORA 4: Job mensual de archivado
SELECT cron.schedule(
    'archive-old-invoices',
    '0 2 1 * *', -- Primer día del mes a las 2 AM
    'SELECT fn_archive_old_invoices();'
);
```

---

## 📊 VALIDACIÓN Y MÉTRICAS

### Métricas Clave a Monitorear

```sql
-- ✅ 1. Tamaño de tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- ✅ 2. Índices más usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ✅ 3. Índices no usados (candidatos a eliminar)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- ✅ 4. Queries más lentas (requiere pg_stat_statements)
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ✅ 5. Cache hit ratio (debe ser > 95%)
SELECT 
    sum(heap_blks_read) AS heap_read,
    sum(heap_blks_hit) AS heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- ✅ 6. Bloqueos activos
SELECT 
    pid,
    usename,
    pg_blocking_pids(pid) AS blocked_by,
    query AS blocked_query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- ✅ 7. Conexiones activas
SELECT 
    state,
    COUNT(*) AS connections
FROM pg_stat_activity
GROUP BY state;
```

### Dashboards Recomendados

**Grafana + Prometheus**:
1. Query latency (p50, p95, p99)
2. Throughput (queries/sec)
3. Connection pool usage
4. Cache hit ratio
5. Table sizes over time
6. Index usage
7. Slow query log

**Alertas Críticas**:
```yaml
alerts:
  - name: high_query_latency
    condition: p95 > 500ms
    action: notify_team
  
  - name: low_cache_hit_ratio
    condition: cache_hit_ratio < 0.95
    action: investigate_indexes
  
  - name: table_size_growth
    condition: sync_logs > 1GB
    action: check_cleanup_job
  
  - name: connection_pool_exhausted
    condition: active_connections > 80%
    action: scale_up
```

---

## ⚡ QUICK WINS (7 DÍAS)

### Sprint 1: Día 1-2 (Crítico)

```bash
# ✅ 1. Limpieza inmediata de sync_logs
psql -c "DELETE FROM sync_logs WHERE sync_status = 'SYNCED' AND created_at < NOW() - INTERVAL '7 days';"

# ✅ 2. Crear índices de búsqueda
psql -f scripts/create_search_indexes.sql

# ✅ 3. Configurar job de limpieza
# (Agregar a cron del backend)
```

### Sprint 2: Día 3-4 (Alto Impacto)

```bash
# ✅ 4. Índices JSONB
psql -f scripts/create_jsonb_indexes.sql

# ✅ 5. Optimizar triggers
psql -f scripts/optimize_triggers.sql
```

### Sprint 3: Día 5-7 (Mejoras Continuas)

```bash
# ✅ 6. Refactorizar queries SELECT *
# (Cambios en código TypeScript)

# ✅ 7. Configurar monitoreo
# (Setup Grafana dashboards)
```

---

## 📝 CHECKLIST EJECUTABLE

### Pre-Implementación
- [ ] Backup completo de base de datos
- [ ] Documentar queries actuales y sus tiempos
- [ ] Configurar monitoreo baseline
- [ ] Notificar ventana de mantenimiento

### Implementación P0 (Crítico - 4 horas)
- [ ] Crear índice `idx_sync_logs_created_at`
- [ ] Implementar `fn_cleanup_old_sync_logs()`
- [ ] Configurar cron job de limpieza
- [ ] Ejecutar limpieza inicial manual
- [ ] Crear índices de búsqueda (name, oem, cauplas)
- [ ] Habilitar extensión pg_trgm
- [ ] Validar mejora en tiempos de búsqueda

### Implementación P1 (Alto - 8 horas)
- [ ] Crear índices JSONB
- [ ] Implementar particionamiento sync_logs
- [ ] Migrar datos a tabla particionada
- [ ] Validar queries en particiones

### Implementación P2 (Medio - 16 horas)
- [ ] Optimizar función de triggers
- [ ] Reemplazar triggers en todas las tablas
- [ ] Refactorizar queries SELECT * en código
- [ ] Code review de cambios

### Implementación P3 (Bajo - 24 horas)
- [ ] Implementar RLS policies
- [ ] Crear tablas de archivo
- [ ] Configurar jobs de archivado
- [ ] Documentar políticas de retención

### Post-Implementación
- [ ] Validar métricas (latencia, throughput, cache hit)
- [ ] Configurar alertas
- [ ] Documentar cambios
- [ ] Training al equipo

---

## 🎯 CRITERIOS DE ÉXITO

| Métrica | Antes | Meta | Validación |
|---------|-------|------|------------|
| Búsqueda productos | 800ms | <100ms | `EXPLAIN ANALYZE` |
| Tamaño sync_logs | Ilimitado | <100MB | `pg_total_relation_size` |
| Cache hit ratio | ~85% | >95% | `pg_statio_user_tables` |
| Query p95 latency | 2s | <500ms | APM monitoring |
| Overhead triggers | 50% | <20% | Benchmark inserts |
| Índices no usados | ? | 0 | `pg_stat_user_indexes` |

---

## 🔄 ESTRATEGIA DE ROLLBACK

Cada cambio tiene su rollback específico documentado arriba. Plan general:

1. **Índices**: `DROP INDEX` es instantáneo y seguro
2. **Triggers**: Restaurar función anterior con `CREATE OR REPLACE`
3. **Particionamiento**: Mantener tabla original hasta validación completa
4. **RLS**: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`
5. **Código**: Feature flags para rollback sin deploy

---

## 📚 RECURSOS ADICIONALES

### Scripts SQL
- `scripts/create_search_indexes.sql` - Índices de búsqueda
- `scripts/create_jsonb_indexes.sql` - Índices JSONB
- `scripts/optimize_triggers.sql` - Triggers optimizados
- `scripts/setup_partitioning.sql` - Particionamiento
- `scripts/cleanup_jobs.sql` - Jobs de limpieza
- `scripts/monitoring_queries.sql` - Queries de monitoreo

### Documentación
- PostgreSQL Performance Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization
- Supabase Best Practices: https://supabase.com/docs/guides/database/performance
- pg_trgm Extension: https://www.postgresql.org/docs/current/pgtrgm.html

---

**Última actualización**: 2025-03-09  
**Responsable**: Equipo de Infraestructura  
**Próxima revisión**: 2025-04-09
