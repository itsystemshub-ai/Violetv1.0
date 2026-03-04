import { useEffect } from 'react';
import { toast } from 'sonner';
import { localDb } from "@/core/database/localDb";

interface BroadcastNotification {
  id: string;
  type: 'exchange_rate_update' | 'system_update' | 'maintenance' | 'general' | 'new_order' | 'new_invoice';
  title: string;
  message: string;
  timestamp: string;
  userId?: string; // Si es null, es para todos los usuarios
  tenantId?: string;
  data?: any;
}

// Canal de broadcast usando BroadcastChannel API
const broadcastChannel = typeof window !== 'undefined' 
  ? new BroadcastChannel('violet-erp-notifications')
  : null;

export const useBroadcastNotifications = (userId?: string, tenantId?: string) => {
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent<BroadcastNotification>) => {
      const notification = event.data;
      
      // Filtrar por usuario y tenant si es necesario
      if (notification.userId && notification.userId !== userId) return;
      if (notification.tenantId && notification.tenantId !== tenantId) return;

      // Mostrar notificaci├│n seg├║n el tipo
      switch (notification.type) {
        case 'exchange_rate_update':
          toast.info(notification.message, {
            description: notification.title,
            duration: 5000,
            icon: '­ƒÆ▒',
          });
          break;
        case 'new_order':
          toast.success(notification.message, {
            description: notification.title,
            duration: 6000,
            icon: '­ƒôï',
            action: notification.data?.orderId ? {
              label: 'Ver Pedido',
              onClick: () => {
                window.location.hash = `/sales?highlight=${notification.data.orderId}`;
              }
            } : undefined,
          });
          break;
        case 'new_invoice':
          toast.success(notification.message, {
            description: notification.title,
            duration: 6000,
            icon: '­ƒº¥',
            action: notification.data?.invoiceId ? {
              label: 'Ver Factura',
              onClick: () => {
                window.location.hash = `/invoice-preview?id=${notification.data.invoiceId}`;
              }
            } : undefined,
          });
          break;
        case 'system_update':
          toast.warning(notification.message, {
            description: notification.title,
            duration: 7000,
            icon: '­ƒöä',
          });
          break;
        case 'maintenance':
          toast.error(notification.message, {
            description: notification.title,
            duration: 10000,
            icon: 'ÔÜá´©Å',
          });
          break;
        default:
          toast(notification.message, {
            description: notification.title,
            duration: 5000,
          });
      }

      // Guardar notificaci├│n en la base de datos local
      saveNotificationToDb(notification);
    };

    broadcastChannel.addEventListener('message', handleMessage);

    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [userId, tenantId]);
};

// Funci├│n para enviar notificaciones broadcast
export const sendBroadcastNotification = (notification: Omit<BroadcastNotification, 'id' | 'timestamp'>) => {
  if (!broadcastChannel) return;

  const fullNotification: BroadcastNotification = {
    ...notification,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  broadcastChannel.postMessage(fullNotification);
  
  // Tambi├®n guardar en la base de datos
  saveNotificationToDb(fullNotification);
};

// Guardar notificaci├│n en la base de datos
const saveNotificationToDb = async (notification: BroadcastNotification) => {
  try {
    await localDb.notifications.add({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      userId: notification.userId,
      tenantId: notification.tenantId,
      data: notification.data,
      read: false,
    });
  } catch (error) {
    console.error('Error saving notification to DB:', error);
  }
};
