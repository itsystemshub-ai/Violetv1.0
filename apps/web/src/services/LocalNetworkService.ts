import { io, Socket } from 'socket.io-client';

class LocalNetworkService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://localhost:8080';

  /**
   * Inicializar conexión usando la IP del maestro.
   * NOTA: El servidor Socket.IO debe estar corriendo en localhost:8080
   * Si no está disponible, el sistema funcionará en modo local únicamente
   */
  public connect(masterIp: string = 'localhost') {
    this.serverUrl = `http://${masterIp}:8080`;
    
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      reconnectionAttempts: 3, // Reducido de 10 a 3
      reconnectionDelay: 5000, // Aumentado de 2000 a 5000
      timeout: 10000, // Timeout de 10 segundos
    });

    this.socket.on('connect', () => {
      console.log('[LocalNetwork] Conectado al Maestro:', this.serverUrl);
    });

    this.socket.on('disconnect', () => {
      console.log('[LocalNetwork] Desconectado del Maestro.');
    });

    this.socket.on('connect_error', (err) => {
      // Silenciar errores si el servidor no está disponible
      // El sistema funciona en modo local sin problemas
      if (err.message !== 'xhr poll error') {
        console.warn('[LocalNetwork] Servidor maestro no disponible - Modo local activo');
      }
    });
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * API Wrapper para transacciones SQL en el Servidor Maestro.
   */
  public async executeSql(query: string, params: any[] = []): Promise<any> {
    try {
      const response = await fetch(`${this.serverUrl}/api/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      return { data: data.data, error: null };
    } catch (err: any) {
      console.error('[API:executeSql] Error local network:', err.message);
      return { data: null, error: err };
    }
  }

  /**
   * Informar eventos (Ej. Recargas de configuración global).
   */
  public broadcastConfigUpdate(payload: any) {
    if (this.socket) {
      this.socket.emit('config:update', payload);
    }
  }

  /**
   * Suscribirse a eventos.
   */
  public onConfigUpdate(callback: (payload: any) => void) {
    if (this.socket) {
      this.socket.on('config:update', callback);
    }
  }

  public offConfigUpdate(callback: (payload: any) => void) {
    if (this.socket) {
      this.socket.off('config:update', callback);
    }
  }
}

export const NetworkService = new LocalNetworkService();
