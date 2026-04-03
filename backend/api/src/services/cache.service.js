/**
 * Violet ERP - CacheService Avanzado
 * Sistema de caché en memoria con fallback a Redis opcional
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('CacheService');

/**
 * Clase de caché en memoria con TTL
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Obtener valor del caché
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verificar TTL
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Establecer valor en caché
   */
  set(key, value, ttlSeconds = 3600) {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;

    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now(),
    });

    this.stats.sets++;
    logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Eliminar valor del caché
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Eliminar múltiples keys por patrón
   */
  deleteByPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    logger.debug(`Cache DELETE BY PATTERN: ${pattern} (${deleted} keys)`);
    return deleted;
  }

  /**
   * Limpiar todo el caché
   */
  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Verificar si existe una key
   */
  has(key) {
    const item = this.cache.get(key);

    if (!item) return false;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Obtener tamaño del caché
   */
  size() {
    return this.cache.size;
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Incrementar valor numérico
   */
  increment(key, amount = 1, ttlSeconds = 3600) {
    const current = parseInt(this.get(key)) || 0;
    const newValue = current + amount;
    this.set(key, newValue, ttlSeconds);
    return newValue;
  }

  /**
   * Decrementar valor numérico
   */
  decrement(key, amount = 1, ttlSeconds = 3600) {
    return this.increment(key, -amount, ttlSeconds);
  }
}

/**
 * Servicio de caché principal
 */
class CacheService {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.enabled = true;
    this.defaultTTL = 3600; // 1 hora por defecto
  }

  /**
   * Inicializar servicio de caché
   */
  initialize(options = {}) {
    this.enabled = options.enabled !== false;
    this.defaultTTL = options.defaultTTL || 3600;

    logger.info(`CacheService initialized (enabled: ${this.enabled}, defaultTTL: ${this.defaultTTL}s)`);
  }

  /**
   * Obtener valor del caché con fallback a función
   */
  async get(key, fallbackFn = null, ttl = null) {
    if (!this.enabled) {
      return fallbackFn ? await fallbackFn() : null;
    }

    const cachedValue = this.memoryCache.get(key);

    if (cachedValue !== null) {
      logger.debug(`Cache HIT: ${key}`);
      return cachedValue;
    }

    // Si hay fallback, ejecutarlo
    if (fallbackFn) {
      try {
        const value = await fallbackFn();
        await this.set(key, value, ttl);
        return value;
      } catch (error) {
        logger.error(`Cache fallback error for ${key}:`, error);
        throw error;
      }
    }

    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Establecer valor en caché
   */
  async set(key, value, ttl = null) {
    if (!this.enabled) return;

    this.memoryCache.set(key, value, ttl || this.defaultTTL);
  }

  /**
   * Eliminar valor del caché
   */
  async delete(key) {
    if (!this.enabled) return;

    this.memoryCache.delete(key);
  }

  /**
   * Eliminar por patrón
   */
  async deleteByPattern(pattern) {
    if (!this.enabled) return;

    this.memoryCache.deleteByPattern(pattern);
  }

  /**
   * Limpiar caché
   */
  async clear() {
    if (!this.enabled) return;

    this.memoryCache.clear();
  }

  /**
   * Verificar si existe
   */
  async has(key) {
    if (!this.enabled) return false;

    return this.memoryCache.has(key);
  }

  /**
   * Incrementar valor
   */
  async increment(key, amount = 1, ttl = null) {
    if (!this.enabled) return amount;

    return this.memoryCache.increment(key, amount, ttl || this.defaultTTL);
  }

  /**
   * Decrementar valor
   */
  async decrement(key, amount = 1, ttl = null) {
    if (!this.enabled) return amount;

    return this.memoryCache.decrement(key, amount, ttl || this.defaultTTL);
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return this.memoryCache.getStats();
  }

  /**
   * Habilitar caché
   */
  enable() {
    this.enabled = true;
    logger.info('Cache enabled');
  }

  /**
   * Deshabilitar caché
   */
  disable() {
    this.enabled = false;
    logger.info('Cache disabled');
  }
}

/**
 * Decorador para cachear resultados de funciones
 */
export function cached(ttl = 3600, keyPrefix = 'fn') {
  const cacheService = new CacheService();

  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      // Generar key única basada en argumentos
      const argsKey = args.map(arg => JSON.stringify(arg)).join(':');
      const key = `${keyPrefix}:${propertyKey}:${argsKey}`;

      // Intentar obtener del caché
      const cachedValue = await cacheService.get(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      // Ejecutar función original
      const result = await originalMethod.apply(this, args);

      // Guardar en caché
      await cacheService.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Helper para cachear queries de base de datos
 */
export async function cachedQuery(pool, queryKey, sql, params = [], ttl = 300) {
  const cacheService = new CacheService();

  return await cacheService.get(
    `db:${queryKey}`,
    async () => {
      const result = await pool.executeQuery(sql, params);
      return result;
    },
    ttl
  );
}

// Singleton
export const cacheService = new CacheService();
export default cacheService;
