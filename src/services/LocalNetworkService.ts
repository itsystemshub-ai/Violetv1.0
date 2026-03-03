import { io, Socket } from 'socket.io-client';

class LocalNetworkService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://localhost:8080';

  /**
   * Inicializar conexión usando la IP del maestro.
   */
  public connect(masterIp: string = 'localhost') {
    this.serverUrl = `http://${masterIp}:8080`;
    
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[LocalNetwork] Conectado al Maestro:', this.serverUrl);
    });

    this.socket.on('disconnect', () => {
      console.log('[LocalNetwork] Desconectado del Maestro.');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[LocalNetwork] Error de conexión:', err.message);
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
