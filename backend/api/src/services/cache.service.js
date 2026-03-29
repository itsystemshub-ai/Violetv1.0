/**
 * Violet ERP - Redis Cache Service
 * Caché distribuida con Redis
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('CacheService');

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.defaultTTL = 3600; // 1 hora
  }

  /**
   * Inicializar conexión a Redis
   */
  async initialize(config = {}) {
    const { enabled = false, url = 'redis://localhost:6379/0' } = config;

    if (!enabled) {
      logger.info('Redis cache disabled');
      this.enabled = false;
      return;
    }

    try {
      const redis = await import('redis');
      
      this.client = redis.createClient({ url });
      
      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.enabled = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.enabled = true;
      });

      await this.client.connect();
      
      logger.info('Redis cache initialized');
    } catch (error) {
      logger.warn('Redis not available, cache disabled:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Obtener valor del caché
   */
  async get(key) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        logger.debug(`Cache miss: ${key}`);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Guardar valor en caché
   */
  async set(key, value, ttl = null) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const expireTime = ttl || this.defaultTTL;
      await this.client.set(key, JSON.stringify(value), { EX: expireTime });
      
      logger.debug(`Cache set: ${key} (TTL: ${expireTime}s)`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Eliminar valor del caché
   */
  async delete(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug(`Cache delete: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Eliminar múltiples keys por patrón
   */
  async deleteByPattern(pattern) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug(`Cache delete pattern: ${pattern} (${keys.length} keys)`);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Limpiar todo el caché
   */
  async flush() {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.warn('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Verificar si existe una key
   */
  async exists(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Obtener TTL restante
   */
  async getTTL(key) {
    if (!this.enabled || !this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  /**
   * Incrementar valor numérico
   */
  async increment(key, amount = 1) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  /**
   * Decrementar valor numérico
   */
  async decrement(key, amount = 1) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      return await this.client.decrBy(key, amount);
    } catch (error) {
      logger.error('Cache decrement error:', error);
      return null;
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  async getStats() {
    if (!this.enabled || !this.client) {
      return {
        enabled: false,
        connected: false,
      };
    }

    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbSize();
      
      return {
        enabled: true,
        connected: true,
        keys: dbSize,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return {
        enabled: false,
        connected: false,
      };
    }
  }

  /**
   * Parsear información de Redis
   */
  parseRedisInfo(infoString) {
    const info = {};
    const lines = infoString.split('\r\n');
    
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        info[key] = value;
      }
    }
    
    return info;
  }

  /**
   * Cerrar conexión
   */
  async disconnect() {
    if (this.client && this.enabled) {
      await this.client.quit();
      this.enabled = false;
      this.client = null;
      logger.info('Redis disconnected');
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Helper function para caché con fallback
export async function cached(key, ttl, fetchFunction) {
  // Intentar obtener del caché
  const cachedValue = await cacheService.get(key);
  
  if (cachedValue !== null) {
    return cachedValue;
  }

  // Fetch y guardar en caché
  const value = await fetchFunction();
  
  if (value !== null && value !== undefined) {
    await cacheService.set(key, value, ttl);
  }
  
  return value;
}

export default cacheService;
