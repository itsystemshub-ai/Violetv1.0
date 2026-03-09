# 📁 Scripts de Optimización de Base de Datos

Este directorio contiene scripts SQL para optimizar el rendimiento de la base de datos PostgreSQL.

## 📋 Índice de Scripts

### 1. `create_search_indexes.sql`
**Propósito**: Crear índices optimizados para búsquedas rápidas  
**Tiempo estimado**: 5-10 minutos  
**Riesgo**: 🟢 BAJO  
**Cuándo ejecutar**: Inmediatamente (Fase 0)

**Qué hace**:
- Habilita extensión `pg_trgm` para búsquedas similares
- Crea índices GIN para búsquedas de texto (productos, facturas, empleados)
- Crea índices compuestos para filtros comunes
- Crea índices para multi-tenancy y alertas

**Impacto esperado**:
- ⚡ Búsquedas 5-10x más rápidas
- 📉 Latencia de 800ms → <100ms
- 💾 Espacio adicional: ~50-100MB

**Cómo ejecutar**:
```bash
psql -d your_database -f create_search_indexes.sql
```

**Rollback**:
```sql
-- Ver índices creados
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';

-- Eliminar todos los índices creados
DROP INDEX IF EXISTS idx_products_name_trgm;
DROP INDEX IF EXISTS idx_products_oem_trgm;
-- etc.
```

---

### 2. `cleanup_jobs.sql`
**Propósito**: Configurar limpieza automática de datos antiguos  
**Tiempo estimado**: 2-5 minutos  
**Riesgo**: 🟢 BAJO  
**Cuándo ejecutar**: Inmediatamente (Fase 0)

**Qué hace**:
- Crea función `fn_cleanup_old_sync_logs()` - Elimina logs > 7 días
- Crea función `fn_cleanup_failed_sync_logs()` - Elimina logs fallidos > 30 días
- Crea función `fn_archive_old_invoices()` - Archiva facturas > 1 año
- Crea función `fn_database_health_report()` - Reporte de salud
- Configura jobs automáticos con pg_cron (si está disponible)

**Impacto esperado**:
- 🗑️ Previene crecimiento ilimitado de sync_logs
- 💾 Mantiene tamaño de DB estable
- 📊 Monitoreo proactivo de salud

**Cómo ejecutar**:
```bash
psql -d your_database -f cleanup_jobs.sql
```

**Probar funciones**:
```sql
-- Ejecutar limpieza manual
SELECT * FROM fn_cleanup_old_sync_logs();

-- Ver reporte de salud
SELECT * FROM fn_database_health_report();

-- Ver jobs programados
SELECT * FROM cron.job;
```

**Rollback**:
```sql
DROP FUNCTION IF EXISTS fn_cleanup_old_sync_logs();
DROP FUNCTION IF EXISTS fn_cleanup_failed_sync_logs();
DROP FUNCTION IF EXISTS fn_archive_old_invoices();
DROP FUNCTION IF EXISTS fn_database_health_report();

-- Eliminar jobs
SELECT cron.unschedule('cleanup-sync-logs-daily');
SELECT cron.unschedule('cleanup-failed-logs-weekly');
```

---

### 3. `monitoring_queries.sql`
**Propósito**: Colección de queries para monitoreo y diagnóstico  
**Tiempo estimado**: N/A (queries individuales)  
**Riesgo**: 🟢 NINGUNO (solo lectura)  
**Cuándo ejecutar**: Según necesidad

**Qué contiene**:
1. Tamaño de tablas e índices
2. Uso de índices (más usados, no usados)
3. Cache hit ratio (global y por tabla)
4. Queries lentas (requiere pg_stat_statements)
5. Bloqueos y deadlocks activos
6. Conexiones y sesiones
7. Estado de VACUUM y autovacuum
8. Estadísticas de sync_logs
9. Performance general (I/O, cambios)
10. Reporte de salud completo

**Cómo usar**:
```bash
# Ejecutar query específica
psql -d your_database -c "SELECT * FROM fn_database_health_report();"

# Ejecutar todas las queries y guardar reporte
psql -d your_database -f monitoring_queries.sql > weekly_report.txt

# Ejecutar sección específica (copiar/pegar en psql)
```

**Queries más útiles**:
```sql
-- Tamaño de tablas
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Cache hit ratio
SELECT ROUND((sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2)
FROM pg_statio_user_tables;

-- Índices no usados
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes WHERE idx_scan = 0 AND indexname NOT LIKE '%_pkey';
```

---

## 🚀 Orden de Ejecución Recomendado

### Fase 0: Crítico (Ejecutar primero)
```bash
# 1. Backup
pg_dump -F c -f backup_$(date +%Y%m%d).dump your_database

# 2. Limpieza manual inicial de sync_logs
psql -d your_database -c "DELETE FROM sync_logs WHERE sync_status = 'SYNCED' AND created_at < NOW() - INTERVAL '7 days';"

# 3. Crear índices
psql -d your_database -f create_search_indexes.sql

# 4. Configurar jobs de limpieza
psql -d your_database -f cleanup_jobs.sql

# 5. Validar
psql -d your_database -c "SELECT * FROM fn_database_health_report();"
```

### Fase 1: Monitoreo Continuo
```bash
# Ejecutar semanalmente
psql -d your_database -f monitoring_queries.sql > reports/weekly_$(date +%Y%m%d).txt
```

---

## 📊 Validación Post-Ejecución

### Después de `create_search_indexes.sql`:
```sql
-- Verificar índices creados
SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';

-- Probar búsqueda optimizada
EXPLAIN ANALYZE SELECT * FROM products WHERE LOWER(name) LIKE '%test%';

-- Verificar tamaño de índices
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass))
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### Después de `cleanup_jobs.sql`:
```sql
-- Verificar funciones creadas
\df fn_cleanup_*
\df fn_database_health_report

-- Probar función de limpieza
SELECT * FROM fn_cleanup_old_sync_logs();

-- Ver jobs programados
SELECT * FROM cron.job;

-- Ejecutar reporte de salud
SELECT * FROM fn_database_health_report();
```

---

## ⚠️ Precauciones

### Antes de Ejecutar
- ✅ Hacer backup completo
- ✅ Ejecutar en horario de bajo tráfico
- ✅ Notificar al equipo
- ✅ Tener plan de rollback listo
- ✅ Verificar espacio en disco (mínimo 20% libre)

### Durante Ejecución
- ⏱️ Los índices CONCURRENTLY pueden tomar 5-15 minutos
- 📊 Monitorear uso de CPU y memoria
- 🔍 Revisar logs de errores
- 🚫 No interrumpir creación de índices CONCURRENTLY

### Después de Ejecutar
- ✅ Validar métricas de performance
- ✅ Ejecutar ANALYZE en tablas modificadas
- ✅ Monitorear por 24-48 horas
- ✅ Documentar resultados

---

## 🔄 Rollback

Cada script tiene su sección de rollback documentada. En general:

1. **Índices**: `DROP INDEX` es instantáneo y seguro
2. **Funciones**: `DROP FUNCTION` no afecta datos
3. **Jobs**: `SELECT cron.unschedule('job-name')`
4. **Datos**: Restaurar desde backup si es necesario

---

## 📚 Recursos Adicionales

### Documentación Completa
- `docs/database-optimization-plan.md` - Plan detallado completo
- `docs/DATABASE_OPTIMIZATION_SUMMARY.md` - Resumen ejecutivo
- `docs/IMPLEMENTATION_CHECKLIST.md` - Checklist paso a paso

### Enlaces Útiles
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/performance)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)

---

## 🆘 Soporte

### Si algo sale mal:
1. **No entrar en pánico** - Los scripts son seguros
2. **Revisar logs** de PostgreSQL
3. **Ejecutar rollback** específico del script
4. **Restaurar backup** si es necesario
5. **Contactar equipo** de infraestructura

### Contacto
- **Responsable**: Equipo de Infraestructura
- **Documentación**: `docs/database-optimization-plan.md`
- **Issues**: Crear issue en repositorio

---

**Última actualización**: 2025-03-09  
**Versión**: 1.0  
**Estado**: ✅ Listo para producción
