/**
 * Violet ERP - AuditService
 * Sistema avanzado de auditoría y trazabilidad
 */

import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('AuditService');

export class AuditService {
  /**
   * Registrar evento de auditoría
   */
  async logAudit(data) {
    const id = uuidv4();

    const auditData = {
      id,
      usuario_codigo: data.userId,
      tabla_afectada: data.table,
      registro_afectado: data.recordId,
      accion: data.action, // INSERT, UPDATE, DELETE, VIEW, EXPORT, PRINT, LOGIN, LOGOUT
      estacion: data.station || 'SERVER',
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      cambios: data.changes ? JSON.stringify(data.changes) : null,
      observaciones: data.observations,
      modulo: data.module,
      severidad: data.severity || 'INFO', // INFO, WARNING, ERROR, CRITICAL
      creado_en: new Date().toISOString(),
    };

    try {
      await firebirdPool.executeQuery(
        `INSERT INTO auditoria (
          id, usuario_codigo, tabla_afectada, registro_afectado, accion,
          estacion, ip_address, user_agent, cambios, observaciones,
          modulo, severidad, fecha_hora
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditData.id,
          auditData.usuario_codigo,
          auditData.tabla_afectada,
          auditData.registro_afectado,
          auditData.accion,
          auditData.estacion,
          auditData.ip_address,
          auditData.user_agent,
          auditData.cambios,
          auditData.observaciones,
          auditData.modulo,
          auditData.severidad,
        ]
      );

      logger.debug(`Audit logged: ${auditData.accion} on ${auditData.tabla_afectada}`);

      return { id: auditData.id, success: true };
    } catch (error) {
      logger.error('Error logging audit:', error);
      // No lanzar error para no interrumpir el flujo principal
      return { id: null, success: false, error: error.message };
    }
  }

  /**
   * Registrar cambio específico en un registro
   */
  async logChange(userId, table, recordId, changes, module = null) {
    const oldValues = changes.old || {};
    const newValues = changes.new || {};

    // Calular campos cambiados
    const changedFields = {};
    const allFields = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const field of allFields) {
      if (JSON.stringify(oldValues[field]) !== JSON.stringify(newValues[field])) {
        changedFields[field] = {
          old: oldValues[field],
          new: newValues[field],
        };
      }
    }

    // Determinar acción
    let action = 'UPDATE';
    if (!oldValues || Object.keys(oldValues).length === 0) {
      action = 'INSERT';
    } else if (!newValues || Object.keys(newValues).length === 0) {
      action = 'DELETE';
    }

    return await this.logAudit({
      userId,
      table,
      recordId,
      action,
      changes: changedFields,
      module,
      severity: this.getSeverityForAction(action),
    });
  }

  /**
   * Obtener severidad según acción
   */
  getSeverityForAction(action) {
    const severityMap = {
      'INSERT': 'INFO',
      'UPDATE': 'INFO',
      'DELETE': 'WARNING',
      'LOGIN': 'INFO',
      'LOGOUT': 'INFO',
      'EXPORT': 'INFO',
      'PRINT': 'INFO',
      'VIEW': 'INFO',
      'ERROR': 'ERROR',
      'UNAUTHORIZED': 'WARNING',
    };

    return severityMap[action] || 'INFO';
  }

  /**
   * Obtener logs de auditoría con filtros
   */
  async getAuditLogs(options = {}) {
    const {
      table,
      recordId,
      userId,
      action,
      dateFrom,
      dateTo,
      module,
      severity,
      limit = 100,
      offset = 0,
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (table) {
      whereClause += ' AND tabla_afectada = ?';
      params.push(table);
    }

    if (recordId) {
      whereClause += ' AND registro_afectado = ?';
      params.push(recordId);
    }

    if (userId) {
      whereClause += ' AND usuario_codigo = ?';
      params.push(userId);
    }

    if (action) {
      whereClause += ' AND accion = ?';
      params.push(action);
    }

    if (dateFrom) {
      whereClause += ' AND fecha_hora >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND fecha_hora <= ?';
      params.push(dateTo);
    }

    if (module) {
      whereClause += ' AND modulo = ?';
      params.push(module);
    }

    if (severity) {
      whereClause += ' AND severidad = ?';
      params.push(severity);
    }

    const query = `
      SELECT a.*, u.nombre as usuario_nombre
      FROM auditoria a
      LEFT JOIN usuarios u ON a.usuario_codigo = u.codigo
      ${whereClause}
      ORDER BY a.fecha_hora DESC
      ROWS ? OFFSET ?
    `;

    try {
      const logs = await firebirdPool.executeQuery(query, [...params, limit, offset]);

      // Obtener total
      const countQuery = `SELECT COUNT(*) as total FROM auditoria ${whereClause}`;
      const countResult = await firebirdPool.executeQuery(countQuery, params);

      return {
        logs: logs || [],
        pagination: {
          total: countResult[0]?.TOTAL || 0,
          limit,
          offset,
          hasMore: offset + limit < (countResult[0]?.TOTAL || 0),
        },
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de cambios de un registro específico
   */
  async getRecordHistory(table, recordId, limit = 50) {
    try {
      const logs = await firebirdPool.executeQuery(
        `SELECT FIRST ? a.*, u.nombre as usuario_nombre
         FROM auditoria a
         LEFT JOIN usuarios u ON a.usuario_codigo = u.codigo
         WHERE a.tabla_afectada = ? AND a.registro_afectado = ?
         ORDER BY a.fecha_hora DESC`,
        [limit, table, recordId]
      );

      // Reconstruir historial de cambios
      const history = (logs || []).map(log => ({
        ...log,
        changes: log.CAMBIOS ? JSON.parse(log.CAMBIOS) : null,
        timestamp: log.FECHA_HORA,
      }));

      return {
        table,
        recordId,
        history,
        totalChanges: history.length,
      };
    } catch (error) {
      logger.error('Error getting record history:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(dateFrom, dateTo) {
    try {
      const [
        totalLogs,
        byAction,
        byUser,
        byTable,
        bySeverity,
      ] = await Promise.all([
        // Total logs
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM auditoria
           WHERE fecha_hora BETWEEN ? AND ?`,
          [dateFrom, dateTo]
        ),
        // Por acción
        firebirdPool.executeQuery(
          `SELECT accion, COUNT(*) as cantidad
           FROM auditoria
           WHERE fecha_hora BETWEEN ? AND ?
           GROUP BY accion
           ORDER BY cantidad DESC`,
          [dateFrom, dateTo]
        ),
        // Por usuario
        firebirdPool.executeQuery(
          `SELECT a.usuario_codigo, u.nombre, COUNT(*) as cantidad
           FROM auditoria a
           LEFT JOIN usuarios u ON a.usuario_codigo = u.codigo
           WHERE a.fecha_hora BETWEEN ? AND ?
           GROUP BY a.usuario_codigo, u.nombre
           ORDER BY cantidad DESC
           ROWS 10`,
          [dateFrom, dateTo]
        ),
        // Por tabla
        firebirdPool.executeQuery(
          `SELECT tabla_afectada, COUNT(*) as cantidad
           FROM auditoria
           WHERE fecha_hora BETWEEN ? AND ?
           GROUP BY tabla_afectada
           ORDER BY cantidad DESC
           ROWS 10`,
          [dateFrom, dateTo]
        ),
        // Por severidad
        firebirdPool.executeQuery(
          `SELECT severidad, COUNT(*) as cantidad
           FROM auditoria
           WHERE fecha_hora BETWEEN ? AND ?
           GROUP BY severidad`,
          [dateFrom, dateTo]
        ),
      ]);

      return {
        periodo: { dateFrom, dateTo },
        total: totalLogs[0]?.TOTAL || 0,
        byAction: byAction.reduce((acc, row) => {
          acc[row.ACCION] = row.CANTIDAD;
          return acc;
        }, {}),
        byUser: byUser.map(row => ({
          userId: row.USUARIO_CODIGO,
          userName: row.NOMBRE,
          count: row.CANTIDAD,
        })),
        byTable: byTable.reduce((acc, row) => {
          acc[row.TABLA_AFECTADA] = row.CANTIDAD;
          return acc;
        }, {}),
        bySeverity: bySeverity.reduce((acc, row) => {
          acc[row.SEVERIDAD] = row.CANTIDAD;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Error getting audit stats:', error);
      throw error;
    }
  }

  /**
   * Detectar actividades sospechosas
   */
  async detectSuspiciousActivity(options = {}) {
    const {
      maxFailedLogins = 5,
      timeWindowMinutes = 30,
      maxDeletesPerHour = 50,
    } = options;

    const suspicious = [];

    try {
      // Múltiples intentos de login fallidos
      const failedLogins = await firebirdPool.executeQuery(
        `SELECT usuario_codigo, ip_address, COUNT(*) as intentos
         FROM auditoria
         WHERE accion = 'LOGIN'
         AND observaciones LIKE '%fallido%'
         AND fecha_hora >= DATEADD(-? MINUTE TO CURRENT_TIMESTAMP)
         GROUP BY usuario_codigo, ip_address
         HAVING COUNT(*) >= ?`,
        [timeWindowMinutes, maxFailedLogins]
      );

      if (failedLogins && failedLogins.length > 0) {
        suspicious.push({
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'WARNING',
          data: failedLogins,
        });
      }

      // Múltiples eliminaciones en poco tiempo
      const massDeletes = await firebirdPool.executeQuery(
        `SELECT usuario_codigo, COUNT(*) as eliminaciones
         FROM auditoria
         WHERE accion = 'DELETE'
         AND fecha_hora >= DATEADD(-1 HOUR TO CURRENT_TIMESTAMP)
         GROUP BY usuario_codigo
         HAVING COUNT(*) >= ?`,
        [maxDeletesPerHour]
      );

      if (massDeletes && massDeletes.length > 0) {
        suspicious.push({
          type: 'MASS_DELETE',
          severity: 'CRITICAL',
          data: massDeletes,
        });
      }

      // Accesos fuera de horario laboral
      const afterHoursAccess = await firebirdPool.executeQuery(
        `SELECT usuario_codigo, COUNT(*) as accesos
         FROM auditoria
         WHERE (EXTRACT(HOUR FROM fecha_hora) < 6 OR EXTRACT(HOUR FROM fecha_hora) > 22)
         AND fecha_hora >= DATEADD(-1 DAY TO CURRENT_TIMESTAMP)
         GROUP BY usuario_codigo
         HAVING COUNT(*) >= 3`
      );

      if (afterHoursAccess && afterHoursAccess.length > 0) {
        suspicious.push({
          type: 'AFTER_HOURS_ACCESS',
          severity: 'INFO',
          data: afterHoursAccess,
        });
      }

      return {
        detected: suspicious.length > 0,
        alerts: suspicious,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error detecting suspicious activity:', error);
      return { detected: false, error: error.message };
    }
  }

  /**
   * Exportar logs de auditoría
   */
  async exportAuditLogs(options = {}, format = 'json') {
    const { logs } = await this.getAuditLogs({ ...options, limit: 10000 });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    if (format === 'csv') {
      const headers = [
        'Fecha',
        'Usuario',
        'Tabla',
        'Registro',
        'Acción',
        'Módulo',
        'Severidad',
        'IP',
        'Cambios',
      ];

      const rows = logs.map(log => [
        log.FECHA_HORA,
        log.USUARIO_NOMBRE || log.USUARIO_CODIGO,
        log.TABLA_AFECTADA,
        log.REGISTRO_AFECTADO,
        log.ACCION,
        log.MODULO,
        log.SEVERIDAD,
        log.IP_ADDRESS,
        log.CAMBIOS || '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return logs;
  }

  /**
   * Limpiar logs antiguos
   */
  async cleanupOldLogs(daysOld = 90) {
    try {
      const result = await firebirdPool.executeQuery(
        `DELETE FROM auditoria
         WHERE fecha_hora < DATEADD(-? DAY TO CURRENT_TIMESTAMP)`,
        [daysOld]
      );

      const deleted = result.affectedRows || 0;
      logger.info(`Cleaned up ${deleted} audit logs older than ${daysOld} days`);

      return deleted;
    } catch (error) {
      logger.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }
}

export const auditService = new AuditService();
export default auditService;
