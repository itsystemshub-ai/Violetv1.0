/**
 * Violet ERP - Servicio de Sincronización Híbrida Nativa
 * Sincroniza entre nodos locales y servidor maestro sin dependencias externas
 * 
 * Arquitectura:
 * - Master Node: Servidor principal con Firebird principal
 * - Slave Nodes: Nodos secundarios que sync con el master
 * - Standalone: Modo local sin sync
 */

import { firebirdPool } from '../database/firebird-pool.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

class HybridSyncService {
  constructor() {
    this.isProcessing = false;
    this.timer = null;
    this.syncQueue = [];
    this.stats = {
      synced: 0,
      failed: 0,
      pending: 0,
      lastSync: null,
    };
  }

  /**
   * Iniciar el servicio de sincronización
   */
  start() {
    if (!config.isHybrid) {
      logger.info('[HybridSync] Sync deshabilitado (modo standalone)');
      return;
    }

    if (!config.isMasterNode) {
      logger.info('[HybridSync] Iniciando sync como nodo slave');
      this.timer = setInterval(() => this.processQueue(), config.hybrid.syncInterval);
    } else {
      logger.info('[HybridSync] Corriendo como nodo maestro - recibiendo syncs');
    }
  }

  /**
   * Detener el servicio
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Encolar registro para sincronización
   */
  async enqueueSync(data) {
    const syncLog = {
      table_name: data.tableName,
      record_id: data.recordId,
      action: data.action, // INSERT, UPDATE, DELETE
      payload: JSON.stringify(data.payload),
      sync_status: 'PENDING',
      attempts: 0,
      created_at: new Date(),
      node_id: this.getNodeId(),
    };

    try {
      await firebirdPool.executeQuery(
        `INSERT INTO SYNC_LOGS 
         (TABLE_NAME, RECORD_ID, ACTION, PAYLOAD, SYNC_STATUS, ATTEMPTS, CREATED_AT, NODE_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          syncLog.table_name,
          syncLog.record_id,
          syncLog.action,
          syncLog.payload,
          syncLog.sync_status,
          syncLog.attempts,
          syncLog.created_at,
          syncLog.node_id,
        ]
      );

      logger.debug(`[HybridSync] Registro encolado: ${data.tableName}:${data.recordId}`);
      this.stats.pending++;
    } catch (error) {
      logger.error('[HybridSync] Error al encolar sync:', error);
      throw error;
    }
  }

  /**
   * Procesar cola de sincronización
   */
  async processQueue() {
    if (this.isProcessing) return;
    if (!config.isHybrid || config.isMasterNode) return;

    this.isProcessing = true;

    try {
      // Obtener registros pendientes
      const pending = await firebirdPool.executeQuery(
        `SELECT FIRST ? * FROM SYNC_LOGS
         WHERE SYNC_STATUS = 'PENDING'
         AND ATTEMPTS < ?
         ORDER BY CREATED_AT ASC`,
        [config.hybrid.syncBatchSize, config.hybrid.syncMaxRetries]
      );

      if (pending.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info(`[HybridSync] Procesando ${pending.length} registros pendientes...`);

      for (const log of pending) {
        await this.processSyncLog(log);
      }

      this.stats.lastSync = new Date();
      logger.info(`[HybridSync] Ciclo completado. Synced: ${this.stats.synced}, Failed: ${this.stats.failed}`);
    } catch (error) {
      logger.error('[HybridSync] Error crítico en processQueue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Procesar un registro de sync individual
   */
  async processSyncLog(log) {
    try {
      const { id, table_name, action, payload, record_id } = log;
      const parsedPayload = JSON.parse(payload || '{}');

      // Enviar al servidor maestro
      const response = await this.sendToMaster({
        action: 'SYNC_RECORD',
        data: {
          table_name,
          action,
          payload: parsedPayload,
          record_id,
          source_node: this.getNodeId(),
        },
      });

      if (response.success) {
        // Marcar como sincronizado
        await firebirdPool.executeQuery(
          `UPDATE SYNC_LOGS 
           SET SYNC_STATUS = 'SYNCED', UPDATED_AT = ?, MASTER_RESPONSE = ?
           WHERE ID = ?`,
          [new Date(), JSON.stringify(response), id]
        );

        this.stats.synced++;
        logger.debug(`[HybridSync] ✓ Sincronizado: ${table_name}:${record_id}`);
      } else {
        throw new Error(response.error || 'Error en master');
      }
    } catch (error) {
      logger.error(`[HybridSync] ✗ Error en ${log.record_id}:`, error.message);

      // Aumentar intentos
      await firebirdPool.executeQuery(
        `UPDATE SYNC_LOGS 
         SET ATTEMPTS = ATTEMPTS + 1, LAST_ERROR = ?, UPDATED_AT = ?
         WHERE ID = ?`,
        [error.message, new Date(), log.id]
      );

      this.stats.failed++;
    }
  }

  /**
   * Enviar datos al servidor maestro
   */
  async sendToMaster(data) {
    try {
      const response = await fetch(`${config.hybrid.cloudApiUrl}/api/sync/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-ID': this.getNodeId(),
          'X-API-Key': process.env.HYBRID_API_KEY || 'default-key',
        },
        body: JSON.stringify(data),
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('[HybridSync] Error enviando al master:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Recibir sync desde nodo slave (endpoint del master)
   */
  async receiveFromSlave(data, nodeId) {
    try {
      const { table_name, action, payload, record_id } = data;

      // Aplicar cambios en Firebird local del master
      await this.applyChange(table_name, action, payload, record_id);

      // Broadcast a otros slaves (opcional)
      if (config.isHybrid) {
        await this.broadcastToSlaves(data, nodeId);
      }

      logger.info(`[HybridSync] Master recibió sync de ${nodeId}: ${table_name}:${record_id}`);

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('[HybridSync] Error recibiendo del slave:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Aplicar cambio en base de datos
   */
  async applyChange(tableName, action, payload, recordId) {
    let sql = '';
    const params = [];

    switch (action) {
      case 'INSERT':
        const columns = Object.keys(payload).join(', ');
        const values = Object.keys(payload).map(() => '?').join(', ');
        sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;
        params.push(...Object.values(payload));
        break;

      case 'UPDATE':
        const updates = Object.keys(payload).map(key => `${key} = ?`).join(', ');
        sql = `UPDATE ${tableName} SET ${updates} WHERE ID = ?`;
        params.push(...Object.values(payload), recordId);
        break;

      case 'DELETE':
        sql = `DELETE FROM ${tableName} WHERE ID = ?`;
        params.push(recordId);
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    await firebirdPool.executeQuery(sql, params);
  }

  /**
   * Broadcast a otros nodos slaves
   */
  async broadcastToSlaves(data, excludeNodeId) {
    // Obtener lista de nodos slaves registrados
    const slaves = await this.getRegisteredSlaves();

    for (const slave of slaves) {
      if (slave.node_id === excludeNodeId) continue;

      try {
        await fetch(`${slave.node_url}/api/sync/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, broadcast: true }),
          timeout: 10000,
        });
      } catch (error) {
        logger.warn(`[HybridSync] No se pudo broadcast a ${slave.node_id}:`, error.message);
      }
    }
  }

  /**
   * Obtener nodos slaves registrados
   */
  async getRegisteredSlaves() {
    try {
      const rows = await firebirdPool.executeQuery(
        `SELECT NODE_ID, NODE_URL, LAST_HEARTBEAT 
         FROM SYNC_NODES 
         WHERE ACTIVE = 'S' AND NODE_ROLE = 'SLAVE'`
      );
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Obtener ID único del nodo
   */
  getNodeId() {
    return process.env.HYBRID_NODE_ID || `node-${process.pid}-${Date.now()}`;
  }

  /**
   * Registrar nodo en el master
   */
  async registerNode(nodeData) {
    try {
      await firebirdPool.executeQuery(
        `INSERT OR UPDATE INTO SYNC_NODES 
         (NODE_ID, NODE_URL, NODE_ROLE, ACTIVE, LAST_HEARTBEAT, REGISTERED_AT)
         VALUES (?, ?, ?, 'S', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [nodeData.nodeId, nodeData.nodeUrl, nodeData.nodeRole || 'SLAVE']
      );

      logger.info(`[HybridSync] Nodo registrado: ${nodeData.nodeId}`);
      return { success: true };
    } catch (error) {
      logger.error('[HybridSync] Error registrando nodo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de sync
   */
  getStats() {
    return {
      ...this.stats,
      mode: config.hybrid.mode,
      isMaster: config.isMasterNode,
      nodeId: this.getNodeId(),
    };
  }

  /**
   * Limpiar logs antiguos
   */
  async cleanupOldLogs(daysOld = 30) {
    try {
      const result = await firebirdPool.executeQuery(
        `DELETE FROM SYNC_LOGS 
         WHERE SYNC_STATUS IN ('SYNCED', 'FAILED')
         AND CREATED_AT < DATEADD(-? DAY TO CURRENT_TIMESTAMP)`,
        [daysOld]
      );

      logger.info(`[HybridSync] Limpiados ${result.affectedRows || 0} logs antiguos`);
      return result.affectedRows || 0;
    } catch (error) {
      logger.error('[HybridSync] Error en cleanup:', error);
      return 0;
    }
  }
}

// Singleton
export const hybridSyncService = new HybridSyncService();

export default hybridSyncService;
