/**
 * Violet ERP - Rutas de Configuración del Sistema
 */

import { Router } from 'express';
import { firebirdPool } from '../../database/firebird-pool.js';
import { requireAuth } from '../../middleware/auth.js';
import { hybridSyncService } from '../../services/hybrid-sync.service.js';
import { cacheService } from '../../services/cache.service.js';
import { jobQueueService } from '../../services/job-queue.service.js';

const router = Router();

/**
 * GET /api/settings
 * Obtener configuración del sistema
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await firebirdPool.executeQuery(
      `SELECT clave, valor, descripcion FROM sistema_config ORDER BY clave`
    );

    const config = {};
    (settings || []).forEach(row => {
      config[row.CLAVE] = {
        value: row.VALOR,
        description: row.DESCRIPCION,
      };
    });

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings/:key
 * Actualizar configuración
 */
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'value requerido' });
    }

    // Verificar si existe
    const existing = await firebirdPool.executeQuery(
      `SELECT clave FROM sistema_config WHERE clave = ?`,
      [key]
    );

    if (existing && existing.length > 0) {
      await firebirdPool.executeQuery(
        `UPDATE sistema_config SET valor = ?, descripcion = ?, actualizado_en = CURRENT_TIMESTAMP
         WHERE clave = ?`,
        [value, description || null, key]
      );
    } else {
      await firebirdPool.executeQuery(
        `INSERT INTO sistema_config (clave, valor, descripcion, actualizado_en)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [key, value, description || null]
      );
    }

    res.json({ success: true, data: { key, value, description } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/sync
 * Obtener configuración de sincronización
 */
router.get('/sync/config', requireAuth, async (req, res) => {
  try {
    const config = await firebirdPool.executeQuery(
      `SELECT key, value, description FROM sync_config ORDER BY key`
    );

    const syncConfig = {};
    (config || []).forEach(row => {
      syncConfig[row.KEY] = {
        value: row.VALUE,
        description: row.DESCRIPTION,
      };
    });

    res.json({ success: true, data: syncConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/sync/stats
 * Estadísticas de sincronización
 */
router.get('/sync/stats', requireAuth, async (req, res) => {
  try {
    const stats = hybridSyncService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/sync/cleanup
 * Limpiar logs de sync antiguos
 */
router.post('/sync/cleanup', requireAuth, async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const deleted = await hybridSyncService.cleanupOldLogs(daysOld);
    res.json({ success: true, data: { deleted } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/cache/stats
 * Estadísticas de caché
 */
router.get('/cache/stats', requireAuth, async (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/cache/clear
 * Limpiar caché
 */
router.post('/cache/clear', requireAuth, async (req, res) => {
  try {
    await cacheService.clear();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/jobs
 * Obtener trabajos en cola
 */
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const { status, type, limit = 100 } = req.query;
    const jobs = jobQueueService.getJobs({ status, type, limit: parseInt(limit) });
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/jobs/stats
 * Estadísticas de trabajos
 */
router.get('/jobs/stats', requireAuth, async (req, res) => {
  try {
    const stats = jobQueueService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/jobs/:id/cancel
 * Cancelar trabajo
 */
router.post('/jobs/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await jobQueueService.cancelJob(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/settings/jobs/:id/retry
 * Reintentar trabajo fallido
 */
router.post('/jobs/:id/retry', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await jobQueueService.retryJob(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/settings/jobs/:id
 * Eliminar trabajo completado/fallido
 */
router.delete('/jobs/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await jobQueueService.removeJob(id);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings/system-info
 * Información del sistema
 */
router.get('/system-info', requireAuth, async (req, res) => {
  try {
    const poolStats = firebirdPool.getStats();

    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      database: {
        pool: poolStats,
      },
      cache: cacheService.getStats(),
      jobs: jobQueueService.getStats(),
      sync: hybridSyncService.getStats(),
    };

    res.json({ success: true, data: systemInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
