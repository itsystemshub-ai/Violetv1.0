/**
 * Violet ERP - Rutas de Notificaciones
 */

import { Router } from 'express';
import { notificationService } from '../../services/notification.service.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, unreadOnly = false } = req.query;

    const notifications = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/notifications/unread-count
 * Obtener conteo de no leídas
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await notificationService.getUnreadCount(userId);

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/notifications/stats
 * Estadísticas de notificaciones
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await notificationService.getStats(userId);

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/mark-read
 * Marcar notificación como leída
 */
router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ success: false, error: 'notificationId requerido' });
    }

    await notificationService.markAsRead(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Marcar todas como leídas
 */
router.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await notificationService.markAllAsRead(userId);

    res.json({ success: true, data: { updated: result } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Eliminar notificación
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/cleanup
 * Limpiar notificaciones antiguas
 */
router.post('/cleanup', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { daysOld = 30 } = req.body;

    const deleted = await notificationService.cleanupOldNotifications(daysOld, userId);
    res.json({ success: true, data: { deleted } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
