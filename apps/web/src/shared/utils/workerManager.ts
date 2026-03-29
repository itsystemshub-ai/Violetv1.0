/**
 * Worker Manager - Gestiona Web Workers para operaciones pesadas
 * 
 * Proporciona una interfaz simple para usar workers sin bloquear el UI
 */

type WorkerMessage = {
  type: string;
  id: string;
  data: any;
};

type WorkerCallback = (data: any) => void;

class WorkerManager {
  private worker: Worker | null = null;
  private callbacks: Map<string, WorkerCallback> = new Map();
  private progressCallbacks: Map<string, WorkerCallback> = new Map();
  private messageId = 0;

  /**
   * Initialize the worker
   */
  initialize(workerPath: string = '/workers/import-worker.js') {
    if (this.worker) {
      console.warn('[WorkerManager] Worker already initialized');
      return;
    }

    try {
      this.worker = new Worker(workerPath);
      
      this.worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
        const { type, id, data } = event.data;
        
        switch (type) {
          case 'READY':
            console.log('[WorkerManager] ✅ Worker ready');
            break;
            
          case 'PROGRESS': {
            const progressCallback = this.progressCallbacks.get(id);
            if (progressCallback) {
              progressCallback(data);
            }
            break;
          }
          
          case 'ERROR': {
            const callback = this.callbacks.get(id);
            if (callback) {
              callback({ error: data });
              this.callbacks.delete(id);
              this.progressCallbacks.delete(id);
            }
            console.error('[WorkerManager] ❌ Worker error:', data);
            break;
          }
          
          default: {
            const callback = this.callbacks.get(id);
            if (callback) {
              callback(data);
              this.callbacks.delete(id);
              this.progressCallbacks.delete(id);
            }
            break;
          }
        }
      });
      
      this.worker.addEventListener('error', (error) => {
        console.error('[WorkerManager] ❌ Worker error:', error);
      });
      
    } catch (error) {
      console.error('[WorkerManager] ❌ Failed to initialize worker:', error);
      this.worker = null;
    }
  }

  /**
   * Check if worker is available
   */
  isAvailable(): boolean {
    return this.worker !== null && typeof Worker !== 'undefined';
  }

  /**
   * Send message to worker
   */
  private sendMessage(
    type: string, 
    data: any, 
    onComplete: WorkerCallback,
    onProgress?: WorkerCallback
  ): string {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = `msg_${++this.messageId}`;
    this.callbacks.set(id, onComplete);
    
    if (onProgress) {
      this.progressCallbacks.set(id, onProgress);
    }

    this.worker.postMessage({ type, id, data });
    
    return id;
  }

  /**
   * Validate products in background
   */
  validateProducts(
    products: any[],
    onComplete: (result: { valid: any[], invalid: any[], total: number }) => void,
    onProgress?: (progress: { current: number, total: number, message: string }) => void
  ): string {
    return this.sendMessage(
      'VALIDATE_PRODUCTS',
      { products },
      onComplete,
      onProgress
    );
  }

  /**
   * Clean products data in background
   */
  cleanProducts(
    products: any[],
    onComplete: (result: { products: any[] }) => void,
    onProgress?: (progress: { current: number, total: number, message: string }) => void
  ): string {
    return this.sendMessage(
      'CLEAN_PRODUCTS',
      { products },
      onComplete,
      onProgress
    );
  }

  /**
   * Process products in batches
   */
  processBatch(
    products: any[],
    batchSize: number = 100,
    onComplete: (result: { batches: any[][], totalBatches: number }) => void
  ): string {
    return this.sendMessage(
      'PROCESS_BATCH',
      { products, batchSize },
      onComplete
    );
  }

  /**
   * Terminate the worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.callbacks.clear();
      this.progressCallbacks.clear();
      console.log('[WorkerManager] 🛑 Worker terminated');
    }
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// Auto-initialize if Web Workers are supported
if (typeof Worker !== 'undefined') {
  workerManager.initialize();
}
