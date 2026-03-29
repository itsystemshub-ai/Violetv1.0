/**
 * Sistema de caché para búsquedas frecuentes
 * Mejora el rendimiento al evitar queries repetidas
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  maxSize?: number; // Máximo número de entradas
}

/**
 * Clase genérica de caché con LRU (Least Recently Used)
 */
export class SearchCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutos por defecto
    this.maxSize = options.maxSize || 100; // 100 entradas por defecto
  }

  /**
   * Genera una clave de caché a partir de parámetros
   */
  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  /**
   * Obtiene un valor del caché
   */
  get(params: Record<string, any>): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si expiró
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Incrementar hits y actualizar timestamp (LRU)
    entry.hits++;
    entry.timestamp = now;

    return entry.data;
  }

  /**
   * Guarda un valor en el caché
   */
  set(params: Record<string, any>, data: T): void {
    const key = this.generateKey(params);

    // Si el caché está lleno, eliminar la entrada menos usada
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 1,
    });
  }

  /**
   * Elimina la entrada menos usada (LRU)
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Priorizar por hits, luego por antigüedad
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTimestamp)) {
        leastUsedKey = key;
        leastHits = entry.hits;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(params: Record<string, any>): void {
    const key = this.generateKey(params);
    this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: Partial<Record<string, any>>): void {
    const patternKeys = Object.keys(pattern);
    
    for (const [key] of this.cache.entries()) {
      try {
        const params = JSON.parse(key);
        const matches = patternKeys.every(
          (k) => params[k] === pattern[k]
        );
        
        if (matches) {
          this.cache.delete(key);
        }
      } catch {
        // Ignorar errores de parsing
      }
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries,
    };
  }
}

/**
 * Instancias de caché para diferentes tipos de búsquedas
 */
export const productSearchCache = new SearchCache<any[]>({
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 50,
});

export const invoiceSearchCache = new SearchCache<any[]>({
  ttl: 2 * 60 * 1000, // 2 minutos
  maxSize: 30,
});

export const clientSearchCache = new SearchCache<any[]>({
  ttl: 10 * 60 * 1000, // 10 minutos
  maxSize: 20,
});

/**
 * Hook helper para usar caché en búsquedas
 */
export const useCachedSearch = <T>(
  cache: SearchCache<T>,
  searchFn: (params: Record<string, any>) => Promise<T>,
  params: Record<string, any>
): {
  search: () => Promise<T>;
  invalidate: () => void;
} => {
  const search = async (): Promise<T> => {
    // Intentar obtener del caché
    const cached = cache.get(params);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, ejecutar búsqueda
    const result = await searchFn(params);
    
    // Guardar en caché
    cache.set(params, result);
    
    return result;
  };

  const invalidate = () => {
    cache.invalidate(params);
  };

  return { search, invalidate };
};

/**
 * Decorator para funciones de búsqueda con caché automático
 */
export function withCache<T>(
  cache: SearchCache<T>,
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    const params = { args };
    
    // Intentar obtener del caché
    const cached = cache.get(params);
    if (cached !== null) {
      return cached;
    }

    // Ejecutar función original
    const result = await fn(...args);
    
    // Guardar en caché
    cache.set(params, result);
    
    return result;
  };
}
