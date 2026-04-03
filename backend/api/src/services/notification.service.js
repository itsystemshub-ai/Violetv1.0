/**
 * Violet ERP - NotificationService
 * Sistema de notificaciones en tiempo real y por correo
 */

import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('NotificationService');

export class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * Inicializar con Socket.IO
   */
  initialize(io) {
    this.io = io;
    logger.info('NotificationService initialized with Socket.IO');
  }

  /**
   * Crear notificación
   */
  async createNotification(data) {
    const id = uuidv4();
    const notification = {
      id,
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info', // info, success, warning, error
      module: data.module,
      url: data.url,
      read: false,
      created_at: new Date().toISOString(),
    };

    try {
      await firebirdPool.executeQuery(
        `INSERT INTO notificaciones (
          id, usuario_id, titulo, mensaje, tipo, modulo, url, leido, creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          notification.user_id,
          notification.title,
          notification.message,
          notification.type,
          notification.module,
          notification.url,
          notification.read ? 'S' : 'N',
        ]
      );

      // Enviar por WebSocket si está disponible
      if (this.io) {
        this.io.to(`user:${data.userId}`).emit('notification:new', notification);
      }

      logger.info(`Notification created: ${id}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId, { limit = 50, unreadOnly = false } = {}) {
    try {
      let whereClause = 'WHERE usuario_id = ?';
      const params = [userId];

      if (unreadOnly) {
        whereClause += ' AND leido = \'N\'';
      }

      const query = `
        SELECT * FROM notificaciones
        ${whereClause}
        ORDER BY creado_en DESC
        ROWS ?
      `;

      const notifications = await firebirdPool.executeQuery(query, [...params, limit]);
      return notifications || [];
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId, userId) {
    try {
      await firebirdPool.executeQuery(
        `UPDATE notificaciones SET leido = 'S', leido_en = CURRENT_TIMESTAMP
         WHERE id = ? AND usuario_id = ?`,
        [notificationId, userId]
      );

      logger.info(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(userId) {
    try {
      const result = await firebirdPool.executeQuery(
        `UPDATE notificaciones SET leido = 'S', leido_en = CURRENT_TIMESTAMP
         WHERE usuario_id = ? AND leido = 'N'`,
        [userId]
      );

      const updated = result.affectedRows || 0;
      logger.info(`All notifications marked as read for user ${userId}: ${updated}`);
      return updated;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId, userId) {
    try {
      await firebirdPool.executeQuery(
        `DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?`,
        [notificationId, userId]
      );

      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Limpiar notificaciones antiguas
   */
  async cleanupOldNotifications(daysOld = 30, userId = null) {
    try {
      let query = `DELETE FROM notificaciones
                   WHERE creado_en < DATEADD(-? DAY TO CURRENT_TIMESTAMP)`;
      const params = [daysOld];

      if (userId) {
        query += ' AND usuario_id = ?';
        params.push(userId);
      }

      const result = await firebirdPool.executeQuery(query, params);
      const deleted = result.affectedRows || 0;

      logger.info(`Cleaned up ${deleted} old notifications`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning up notifications:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación broadcast a todos los usuarios
   */
  async broadcastNotification(data) {
    try {
      // Obtener todos los usuarios activos
      const users = await firebirdPool.executeQuery(
        `SELECT codigo FROM usuarios WHERE activo = 'S'`
      );

      const notifications = [];
      for (const user of users) {
        const notification = await this.createNotification({
          ...data,
          userId: user.CODIGO,
        });
        notifications.push(notification);
      }

      logger.info(`Broadcast notification sent to ${users.length} users`);
      return notifications;
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  /**
   * Notificar evento del sistema
   */
  async notifySystemEvent(eventType, data) {
    const eventNotifications = {
      'sale:created': {
        title: 'Nueva Venta',
        message: `Venta ${data.documento} creada por ${data.usuario}`,
        type: 'success',
        module: 'ventas',
      },
      'sale:cancelled': {
        title: 'Venta Anulada',
        message: `Venta ${data.correlativo} anulada: ${data.motivo}`,
        type: 'warning',
        module: 'ventas',
      },
      'product:low_stock': {
        title: 'Stock Bajo',
        message: `Producto ${data.nombre} tiene stock bajo: ${data.cantidad}`,
        type: 'warning',
        module: 'inventario',
      },
      'purchase:received': {
        title: 'Compra Recepcionada',
        message: `Compra ${data.documento} recepcionada exitosamente`,
        type: 'success',
        module: 'compras',
      },
      'payment:received': {
        title: 'Pago Recibido',
        message: `Pago de ${data.monto} recibido del cliente ${data.cliente}`,
        type: 'success',
        module: 'finanzas',
      },
    };

    const config = eventNotifications[eventType];
    if (!config) return;

    // Notificar a usuarios del módulo
    const adminUsers = await firebirdPool.executeQuery(
      `SELECT u.codigo FROM usuarios u
       JOIN permisos p ON u.perfil_codigo = p.perfil_codigo
       WHERE p.proceso_codigo = ? AND u.activo = 'S'`
    );

    for (const user of adminUsers) {
      await this.createNotification({
        userId: user.CODIGO,
        ...config,
        url: data.url || `/${config.module}`,
      });
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId) {
    try {
      const result = await firebirdPool.executeQuery(
        `SELECT COUNT(*) as total FROM notificaciones
         WHERE usuario_id = ? AND leido = 'N'`,
        [userId]
      );

      return result[0]?.TOTAL || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getStats(userId) {
    try {
      const [total, unread, byType] = await Promise.all([
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ?`,
          [userId]
        ),
        this.getUnreadCount(userId),
        firebirdPool.executeQuery(
          `SELECT tipo, COUNT(*) as cantidad FROM notificaciones
           WHERE usuario_id = ? GROUP BY tipo`,
          [userId]
        ),
      ]);

      return {
        total: total[0]?.TOTAL || 0,
        unread,
        read: (total[0]?.TOTAL || 0) - unread,
        byType: byType.reduce((acc, row) => {
          acc[row.TIPO] = row.CANTIDAD;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
