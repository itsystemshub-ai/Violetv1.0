/**
 * NotificationCenter - Centro de notificaciones mejorado
 * Características:
 * - Notificaciones persistentes
 * - Historial de notificaciones
 * - Categorías (info, success, warning, error)
 * - Acciones personalizadas
 * - Contador de no leídas
 */

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { cn } from '@/core/shared/utils/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  maxNotifications?: number;
  persistKey?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxNotifications = 50,
  persistKey = 'notifications',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar notificaciones desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(persistKey);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, [persistKey]);

  // Guardar notificaciones en localStorage
  useEffect(() => {
    localStorage.setItem(persistKey, JSON.stringify(notifications));
  }, [notifications, persistKey]);

  // Agregar notificación
  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    action?: Notification['action']
  ) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      action,
    };

    setNotifications((prev) => {
      const newNotifications = [notification, ...prev];
      return newNotifications.slice(0, maxNotifications);
    });
  };

  // Marcar como leída
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Eliminar notificación
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Limpiar todas
  const clearAll = () => {
    setNotifications([]);
  };

  // Contador de no leídas
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Icono según tipo
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // Formatear tiempo
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent/50 transition-colors',
                    !notification.read && 'bg-accent/20'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action!.onClick();
                              markAsRead(notification.id);
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Hook para usar el centro de notificaciones
 */
export const useNotifications = () => {
  const [notificationCenter, setNotificationCenter] = useState<{
    addNotification: (
      type: NotificationType,
      title: string,
      message: string,
      action?: Notification['action']
    ) => void;
  } | null>(null);

  // Este hook debe ser usado junto con el componente NotificationCenter
  // que debe estar montado en el layout principal

  const notify = {
    info: (title: string, message: string, action?: Notification['action']) => {
      notificationCenter?.addNotification('info', title, message, action);
    },
    success: (title: string, message: string, action?: Notification['action']) => {
      notificationCenter?.addNotification('success', title, message, action);
    },
    warning: (title: string, message: string, action?: Notification['action']) => {
      notificationCenter?.addNotification('warning', title, message, action);
    },
    error: (title: string, message: string, action?: Notification['action']) => {
      notificationCenter?.addNotification('error', title, message, action);
    },
  };

  return { notify, setNotificationCenter };
};
