/**
 * imageCache - Sistema de caché de imágenes
 * Características:
 * - Caché en memoria con LRU
 * - Caché en IndexedDB para persistencia
 * - Precarga de imágenes
 * - Limpieza automática
 * - Estadísticas de uso
 */

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 50 * 1024 * 1024; // 50MB
  private maxEntries: number = 100;
  private hits: number = 0;
  private misses: number = 0;
  private dbName: string = 'imageCache';
  private storeName: string = 'images';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Inicializa IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' });
        }
      };
    });
  }

  /**
   * Obtiene una imagen del caché
   */
  async get(url: string): Promise<string | null> {
    // Buscar en memoria
    const memoryEntry = this.cache.get(url);
    if (memoryEntry) {
      this.hits++;
      memoryEntry.accessCount++;
      memoryEntry.lastAccess = Date.now();
      return URL.createObjectURL(memoryEntry.blob);
    }

    // Buscar en IndexedDB
    try {
      const dbEntry = await this.getFromDB(url);
      if (dbEntry) {
        this.hits++;
        // Agregar a memoria
        this.cache.set(url, dbEntry);
        this.enforceMemoryLimit();
        return URL.createObjectURL(dbEntry.blob);
      }
    } catch (error) {
      console.error('Error reading from IndexedDB:', error);
    }

    this.misses++;
    return null;
  }

  /**
   * Guarda una imagen en el caché
   */
  async set(url: string, blob: Blob): Promise<void> {
    const entry: CacheEntry = {
      url,
      blob,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
      size: blob.size,
    };

    // Guardar en memoria
    this.cache.set(url, entry);
    this.enforceMemoryLimit();

    // Guardar en IndexedDB
    try {
      await this.saveToDB(entry);
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  }

  /**
   * Precarga múltiples imágenes
   */
  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      // Si ya está en caché, no hacer nada
      const cached = await this.get(url);
      if (cached) {
        URL.revokeObjectURL(cached);
        return;
      }

      // Descargar y cachear
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        await this.set(url, blob);
      } catch (error) {
        console.error(`Error preloading ${url}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Elimina una entrada del caché
   */
  async remove(url: string): Promise<void> {
    this.cache.delete(url);

    try {
      await this.removeFromDB(url);
    } catch (error) {
      console.error('Error removing from IndexedDB:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;

    try {
      await this.clearDB();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );

    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hits: this.hits,
      misses: this.misses,
      hitRate,
    };
  }

  /**
   * Limpia entradas antiguas
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let removed = 0;

    // Limpiar memoria
    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(url);
        removed++;
      }
    }

    // Limpiar IndexedDB
    try {
      const allEntries = await this.getAllFromDB();
      for (const entry of allEntries) {
        if (now - entry.timestamp > maxAge) {
          await this.removeFromDB(entry.url);
          removed++;
        }
      }
    } catch (error) {
      console.error('Error cleaning up IndexedDB:', error);
    }

    return removed;
  }

  /**
   * Aplica límite de memoria usando LRU
   */
  private enforceMemoryLimit(): void {
    // Verificar tamaño total
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    // Si excede el límite, eliminar las menos usadas
    if (totalSize > this.maxSize || this.cache.size > this.maxEntries) {
      const entries = Array.from(this.cache.entries());
      
      // Ordenar por última acceso (LRU)
      entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

      // Eliminar hasta estar bajo el límite
      while (
        (totalSize > this.maxSize || this.cache.size > this.maxEntries) &&
        entries.length > 0
      ) {
        const [url, entry] = entries.shift()!;
        this.cache.delete(url);
        totalSize -= entry.size;
      }
    }
  }

  /**
   * Obtiene una entrada de IndexedDB
   */
  private async getFromDB(url: string): Promise<CacheEntry | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Guarda una entrada en IndexedDB
   */
  private async saveToDB(entry: CacheEntry): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina una entrada de IndexedDB
   */
  private async removeFromDB(url: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todas las entradas de IndexedDB
   */
  private async getAllFromDB(): Promise<CacheEntry[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpia IndexedDB
   */
  private async clearDB(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Instancia global
export const imageCache = new ImageCache();

/**
 * Hook de React para usar el caché de imágenes
 */
export function useImageCache(url: string | null): {
  cachedUrl: string | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [cachedUrl, setCachedUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!url) {
      setCachedUrl(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Intentar obtener del caché
        const cached = await imageCache.get(url);
        
        if (cached && mounted) {
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // Si no está en caché, descargar
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Guardar en caché
        await imageCache.set(url, blob);
        
        // Obtener URL del caché
        const newCached = await imageCache.get(url);
        
        if (mounted) {
          setCachedUrl(newCached);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, [url]);

  return { cachedUrl, isLoading, error };
}

// Importar React para el hook
import React from 'react';
