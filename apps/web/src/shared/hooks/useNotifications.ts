import { useState, useEffect } from 'react';
import { localDb } from '@/core/database/localDb';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

/**
 * Hook para gestionar notificaciones del sistema
 * Lee notificaciones de la base de datos local (IndexedDB)
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones desde la base de datos
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const dbNotifications = await localDb.notifications
          .orderBy('timestamp')
          .reverse()
          .limit(50)
          .toArray();

        // Mapear notificaciones de la DB al formato del componente
        const mappedNotifications: Notification[] = dbNotifications.map(n => ({
          id: n.id,
          type: mapNotificationType(n.type),
          module: mapNotificationModule(n.type),
          title: n.title,
          message: n.message,
          read: n.read || false,
          timestamp: n.timestamp,
        }));

        setNotifications(mappedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Recargar cada 5 segundos para captar nuevas notificaciones
    const interval = setInterval(loadNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calcular notificaciones no leídas
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = async (id: string) => {
    try {
      await localDb.notifications.update(id, { read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationIds = notifications.map(n => n.id);
      await Promise.all(
        notificationIds.map(id => localDb.notifications.update(id, { read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await localDb.notifications.clear();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      timestamp: new Date().toISOString(),
    };

    try {
      await localDb.notifications.add({
        id: newNotification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: newNotification.timestamp,
        read: false,
      });
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  };
};

// Mapear tipos de notificación de la DB al formato del componente
function mapNotificationType(type: string): 'success' | 'info' | 'warning' | 'error' {
  switch (type) {
    case 'new_order':
    case 'new_invoice':
      return 'success';
    case 'exchange_rate_update':
    case 'system_update':
      return 'info';
    case 'maintenance':
      return 'warning';
    default:
      return 'info';
  }
}

// Mapear módulo según el tipo de notificación
function mapNotificationModule(type: string): string {
  switch (type) {
    case 'exchange_rate_update':
      return 'Finanzas';
    case 'new_order':
      return 'Ventas';
    case 'new_invoice':
      return 'Facturación';
    case 'system_update':
      return 'Sistema';
    case 'maintenance':
      return 'Mantenimiento';
    default:
      return 'General';
  }
}
