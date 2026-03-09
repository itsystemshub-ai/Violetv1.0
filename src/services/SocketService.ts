/**
 * SocketService - Cliente Socket.IO para sincronización
 * Características:
 * - Conexión automática
 * - Reconexión automática
 * - Eventos tipados
 * - Heartbeat
 * - Estado de conexión
 */

import { io, Socket } from 'socket.io-client';

interface SocketConfig {
  url: string;
  tenantId: string;
  userId?: string;
  token?: string;
}

interface ServerState {
  connectedClients: number;
  roomClients: number;
  serverUptime: number;
}

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Conectar al servidor Socket.IO
   */
  connect(config: SocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log('[SocketService] Ya conectado');
        resolve();
        return;
      }

      this.config = config;

      try {
        this.socket = io(config.url, {
          auth: {
            tenantId: config.tenantId,
            userId: config.userId,
            token: config.token,
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 10000,
        });

        // Eventos de conexión
        this.socket.on('connect', () => {
          console.log('[SocketService] Conectado:', this.socket?.id);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SocketService] Error de conexión:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('No se pudo conectar al servidor'));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[SocketService] Desconectado:', reason);
          this.stopHeartbeat();
        });

        // Eventos del servidor
        this.socket.on('server:state', (state: ServerState) => {
          console.log('[SocketService] Estado del servidor:', state);
          this.emit('server:state', state);
        });

        this.socket.on('user:connected', (data) => {
          console.log('[SocketService] Usuario conectado:', data.userId);
          this.emit('user:connected', data);
        });

        this.socket.on('user:disconnected', (data) => {
          console.log('[SocketService] Usuario desconectado:', data.userId);
          this.emit('user:disconnected', data);
        });

        // Eventos de sincronización
        this.socket.on('product:updated', (data) => {
          this.emit('product:updated', data);
        });

        this.socket.on('inventory:updated', (data) => {
          this.emit('inventory:updated', data);
        });

        this.socket.on('sale:created', (data) => {
          this.emit('sale:created', data);
        });

        this.socket.on('order:updated', (data) => {
          this.emit('order:updated', data);
        });

        this.socket.on('notification:received', (data) => {
          this.emit('notification:received', data);
        });

        // Heartbeat
        this.socket.on('pong', (data) => {
          // console.log('[SocketService] Pong recibido');
        });

      } catch (error) {
        console.error('[SocketService] Error al crear socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Desconectado manualmente');
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtener ID del socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Emitir evento al servidor
   */
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] No conectado, no se puede enviar:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Suscribirse a evento
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emitir evento local
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Iniciar heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * Detener heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Obtener estado del servidor
   */
  getServerState(): Promise<ServerState> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('No conectado'));
        return;
      }

      this.socket.emit('server:getState');

      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando estado del servidor'));
      }, 5000);

      const unsubscribe = this.on('server:state', (state) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(state);
      });
    });
  }

  // ==================== MÉTODOS DE SINCRONIZACIÓN ====================

  /**
   * Sincronizar actualización de producto
   */
  syncProductUpdate(productId: string, changes: any): void {
    this.send('product:update', { productId, changes });
  }

  /**
   * Sincronizar actualización de inventario
   */
  syncInventoryUpdate(changes: any): void {
    this.send('inventory:update', { changes });
  }

  /**
   * Sincronizar creación de venta
   */
  syncSaleCreate(saleId: string, sale: any): void {
    this.send('sale:create', { saleId, sale });
  }

  /**
   * Sincronizar actualización de orden
   */
  syncOrderUpdate(orderId: string, changes: any): void {
    this.send('order:update', { orderId, changes });
  }

  /**
   * Enviar notificación
   */
  sendNotification(notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    broadcast?: boolean;
    targetUserId?: string;
  }): void {
    this.send('notification:send', notification);
  }
}

// Instancia global
export const socketService = new SocketService();

/**
 * Hook de React para usar Socket.IO
 */
export function useSocket() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [serverState, setServerState] = React.useState<ServerState | null>(null);

  React.useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    const unsubscribe = socketService.on('server:state', (state) => {
      setServerState(state);
    });

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    serverState,
    connect: (config: SocketConfig) => socketService.connect(config),
    disconnect: () => socketService.disconnect(),
    on: (event: string, callback: EventCallback) => socketService.on(event, callback),
    send: (event: string, data: any) => socketService.send(event, data),
    syncProductUpdate: (productId: string, changes: any) =>
      socketService.syncProductUpdate(productId, changes),
    syncInventoryUpdate: (changes: any) =>
      socketService.syncInventoryUpdate(changes),
    syncSaleCreate: (saleId: string, sale: any) =>
      socketService.syncSaleCreate(saleId, sale),
    syncOrderUpdate: (orderId: string, changes: any) =>
      socketService.syncOrderUpdate(orderId, changes),
    sendNotification: (notification: any) =>
      socketService.sendNotification(notification),
  };
}

// Importar React para el hook
import React from 'react';
