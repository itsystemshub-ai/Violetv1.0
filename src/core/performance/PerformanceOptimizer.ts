/**
 * PerformanceOptimizer - Sistema de optimización de rendimiento
 * Incluye: caché, memoización, debouncing, throttling, virtualización
 */

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  renderCount: number;
  errorRate: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache: Map<string, { data: any; timestamp: number; hits: number }> = new Map();
  private metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    renderCount: 0,
    errorRate: 0
  };
  private config: CacheConfig = {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'lru'
  };

  private constructor() {
    // Limpiar caché expirada periódicamente
    setInterval(() => this.cleanExpiredCache(), 60000); // Cada minuto
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // ===== CACHÉ =====
  
  public setCacheConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const startTime = performance.now();
    
    // Verificar caché si no se fuerza refresh
    if (!options?.forceRefresh) {
      const cached = this.getFromCache<T>(key);
      if (cached !== undefined) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + 0.1; // Moving average
        return cached;
      }
    }

    // Computar valor
    try {
      const result = await (typeof computeFn === 'function' ? computeFn() : computeFn);
      this.setToCache(key, result, options?.ttl);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
      
      return result;
    } catch (error) {
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1;
      throw error;
    }
  }

  private getFromCache<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    
    if (!cached) return undefined;
    
    // Verificar expiración
    if (Date.now() - cached.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Actualizar hits para estrategia LRU/LFU
    cached.hits++;
    cached.timestamp = Date.now();
    
    return cached.data;
  }

  private setToCache(key: string, data: any, ttl?: number): void {
    // Aplicar estrategia de reemplazo si el caché está lleno
    if (this.cache.size >= this.config.maxSize) {
      this.applyEvictionStrategy();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  private applyEvictionStrategy(): void {
    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        let lruKey: string | undefined;
        let lruTimestamp = Infinity;
        
        for (const [key, value] of this.cache.entries()) {
          if (value.timestamp < lruTimestamp) {
            lruTimestamp = value.timestamp;
            lruKey = key;
          }
        }
        
        if (lruKey) this.cache.delete(lruKey);
        break;
        
      case 'fifo': // First In First Out
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
        break;
        
      case 'lfu': // Least Frequently Used
        let lfuKey: string | undefined;
        let lfuHits = Infinity;
        
        for (const [key, value] of this.cache.entries()) {
          if (value.hits < lfuHits) {
            lfuHits = value.hits;
            lfuKey = key;
          }
        }
        
        if (lfuKey) this.cache.delete(lfuKey);
        break;
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): {
    size: number;
    hitRate: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate,
      keys: Array.from(this.cache.keys())
    };
  }

  // ===== MEMOIZACIÓN =====
  
  public memoize<T extends (...args: any[]) => any>(
    fn: T,
    options?: { maxSize?: number; resolver?: (...args: Parameters<T>) => string }
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    const maxSize = options?.maxSize || 100;
    const resolver = options?.resolver || ((...args: any[]) => JSON.stringify(args));
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = resolver(...args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      // Aplicar límite de tamaño
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // ===== DEBOUNCING Y THROTTLING =====
  
  public debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  public throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // ===== VIRTUALIZACIÓN =====
  
  public createVirtualList<T>(
    items: T[],
    options: {
      containerHeight: number;
      itemHeight: number;
      overscan?: number;
    }
  ): {
    visibleItems: T[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetTop: number;
  } {
    const { containerHeight, itemHeight, overscan = 3 } = options;
    const totalHeight = items.length * itemHeight;
    
    // Calcular índices visibles (simulado - en realidad se usaría scroll position)
    const startIndex = 0;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan * 2, items.length);
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight,
      offsetTop: startIndex * itemHeight
    };
  }

  // ===== MÉTRICAS Y MONITOREO =====
  
  public measurePerformance<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    
    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;
      
      console.log(`⏱️  [Performance] ${name}: ${duration.toFixed(2)}ms, Memory: ${this.formatBytes(memoryDelta)}`);
      
      // Actualizar métricas
      this.metrics.renderCount++;
      this.metrics.memoryUsage = (this.metrics.memoryUsage * 0.9) + (memoryDelta * 0.1);
      
      return result;
    } catch (error) {
      this.metrics.errorRate = (this.metrics.errorRate * 0.9) + 0.1;
      throw error;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      cacheHitRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      renderCount: 0,
      errorRate: 0
    };
  }

  // ===== UTILIDADES =====
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public async batchProcess<T, R>(
    items: T[],
    processFn: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize = 50,
      delayBetweenBatches = 100,
      onProgress
    } = options;
    
    const results: R[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = start + batchSize;
      const batch = items.slice(start, end);
      
      // Procesar lote
      const batchResults = await Promise.all(
        batch.map(item => processFn(item))
      );
      
      results.push(...batchResults);
      
      // Notificar progreso
      if (onProgress) {
        onProgress(Math.min(end, items.length), items.length);
      }
      
      // Delay entre lotes (excepto el último)
      if (i < totalBatches - 1 && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    return results;
  }
}

// Instancia global
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Hooks React
import { useCallback, useRef, useEffect } from 'react';

export function usePerformanceMeasure(name: string) {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const duration = performance.now() - startTime.current;
    console.log(`⏱️  [Render] ${name}: ${duration.toFixed(2)}ms`);
  }, [name]);
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const optimizer = performanceOptimizer;
  return useCallback(
    optimizer.debounce(callback, delay) as T,
    [callback, delay, optimizer]
  );
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const optimizer = performanceOptimizer;
  return useCallback(
    optimizer.throttle(callback, limit) as T,
    [callback, limit, optimizer]
  );
}

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  const optimizer = performanceOptimizer;
  return useCallback(
    optimizer.memoize(callback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, optimizer, ...dependencies]
  );
}