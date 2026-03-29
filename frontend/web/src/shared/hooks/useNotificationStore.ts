import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationModule = 'Finanzas' | 'RRHH' | 'Ventas' | 'Inventario' | 'Sistema' | 'Seguridad';
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface ERPNotification {
  id: string;
  module: NotificationModule;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationState {
  notifications: ERPNotification[];
  addNotification: (notification: Omit<ERPNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notif) => {
        const newNotification: ERPNotification = {
          ...notif,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => 
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'violet-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
