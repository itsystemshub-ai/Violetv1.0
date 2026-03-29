/**
 * Database Management Routes
 * Endpoints para gestión y optimización de base de datos
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { cleanupSyncLogs, generateHealthReport } from '../jobs/database-cleanup.job.js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/database/health
 * Obtiene reporte de salud de la base de datos
 */
router.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('fn_database_health_report');
    
    if (error) {
      return res.status(500).json({
        error: 'Failed to get health report',
        message: error.message
      });
    }
    
    res.json({
      status: 'success',
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * POST /api/database/cleanup
 * Ejecuta limpieza manual de sync_logs
 */
router.post('/cleanup', async (req, res) => {
  try {
    await cleanupSyncLogs();
    
    res.json({
      status: 'success',
      message: 'Cleanup job executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Cleanup failed',
      message: err.message
    });
  }
});

/**
 * GET /api/database/stats
 * Obtiene estadísticas de tablas
 */
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
        LIMIT 20;
      `
    });
    
    if (error) {
      return res.status(500).json({
        error: 'Failed to get stats',
        message: error.message
      });
    }
    
    res.json({
      status: 'success',
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * GET /api/database/indexes
 * Obtiene información de índices
 */
router.get('/indexes', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan AS scans,
          idx_tup_read AS tuples_read,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 50;
      `
    });
    
    if (error) {
      return res.status(500).json({
        error: 'Failed to get indexes',
        message: error.message
      });
    }
    
    res.json({
      status: 'success',
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

/**
 * GET /api/database/cache-hit-ratio
 * Obtiene cache hit ratio
 */
router.get('/cache-hit-ratio', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          ROUND(
            (sum(heap_blks_hit)::NUMERIC / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100,
            2
          ) AS cache_hit_ratio
        FROM pg_statio_user_tables;
      `
    });
    
    if (error) {
      return res.status(500).json({
        error: 'Failed to get cache hit ratio',
        message: error.message
      });
    }
    
    const ratio = data && data.length > 0 ? data[0].cache_hit_ratio : 0;
    const status = ratio >= 95 ? 'excellent' : ratio >= 90 ? 'good' : 'poor';
    
    res.json({
      status: 'success',
      data: {
        cache_hit_ratio: ratio,
        status,
        recommendation: ratio < 95 ? 'Consider increasing shared_buffers or adding more indexes' : 'Cache performance is optimal'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

export { router as databaseRouter };
