/**
 * Violet ERP - Módulo de Sincronización Híbrida
 * Endpoints para sync entre nodos
 */

import { Router } from 'express';
import { hybridSyncService } from '../../services/hybrid-sync.service.js';
import { config } from '../../config/env.js';

const router = Router();

/**
 * POST /api/sync/receive
 * Recibe sincronización desde nodos slaves
 */
router.post('/receive', async (req, res) => {
  try {
    const nodeId = req.headers['x-node-id'];
    const apiKey = req.headers['x-api-key'];

    if (!nodeId) {
      return res.status(400).json({ success: false, error: 'Node ID requerido' });
    }

    // Validar API key en modo producción
    if (config.isProduction && apiKey !== process.env.HYBRID_API_KEY) {
      return res.status(401).json({ success: false, error: 'API key inválida' });
    }

    const { action, data, broadcast } = req.body;

    if (action === 'SYNC_RECORD') {
      const result = await hybridSyncService.receiveFromSlave(data, nodeId);
      return res.json(result);
    }

    if (action === 'REGISTER_NODE') {
      const result = await hybridSyncService.registerNode(data);
      return res.json(result);
    }

    res.status(400).json({ success: false, error: 'Acción no válida' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sync/stats
 * Obtiene estadísticas de sincronización
 */
router.get('/stats', (req, res) => {
  const stats = hybridSyncService.getStats();
  res.json({ success: true, data: stats });
});

/**
 * POST /api/sync/register
 * Registra un nodo slave en el master
 */
router.post('/register', async (req, res) => {
  try {
    const { nodeId, nodeUrl, nodeRole } = req.body;

    if (!nodeId || !nodeUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'nodeId y nodeUrl requeridos' 
      });
    }

    const result = await hybridSyncService.registerNode({ nodeId, nodeUrl, nodeRole });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sync/nodes
 * Lista nodos registrados
 */
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await hybridSyncService.getRegisteredSlaves();
    res.json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sync/enqueue
 * Encola un registro para sincronización
 */
router.post('/enqueue', async (req, res) => {
  try {
    const { tableName, recordId, action, payload } = req.body;

    if (!tableName || !recordId || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'tableName, recordId y action requeridos' 
      });
    }

    await hybridSyncService.enqueueSync({ tableName, recordId, action, payload });
    res.json({ success: true, message: 'Registro encolado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sync/cleanup
 * Limpia logs antiguos
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld } = req.body;
    const deleted = await hybridSyncService.cleanupOldLogs(daysOld || 30);
    res.json({ success: true, deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
