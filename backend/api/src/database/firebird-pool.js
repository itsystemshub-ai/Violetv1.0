/**
 * Violet ERP - Firebird Connection Pool
 * Implementación avanzada con pool de conexiones, retry y cache
 */

import firebird from 'node-firebird';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

class FirebirdPool {
  constructor() {
    this.pool = [];
    this.maxSize = 10;
    this.minSize = 2;
    this.acquireTimeout = 5000;
    this.idleTimeout = 30000;
    this.connections = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info('Initializing Firebird connection pool...');

    // Crear conexiones iniciales
    for (let i = 0; i < this.minSize; i++) {
      try {
        const connection = await this.createConnection();
        this.pool.push(connection);
        this.connections.push(connection);
      } catch (error) {
        logger.error(`Failed to create initial connection ${i}:`, error);
      }
    }

    this.initialized = true;
    logger.info(`Firebird pool initialized with ${this.pool.length} connections`);
  }

  async createConnection() {
    const options = {
      host: config.firebird.host,
      port: config.firebird.port,
      database: config.firebird.database,
      user: config.firebird.user,
      password: config.firebird.password,
      lowercase_keys: true,
      role: 'RDB$ADMIN',
      pageSize: 4096,
    };

    return new Promise((resolve, reject) => {
      firebird.attach(options, (err, connection) => {
        if (err) {
          logger.error('Firebird connection error:', err);
          reject(err);
          return;
        }

        // Configurar connection events
        connection.on('error', (err) => {
          logger.error('Firebird connection error event:', err);
          this.removeConnection(connection);
        });

        logger.debug('New Firebird connection created');
        resolve(connection);
      });
    });
  }

  async acquire() {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    while (Date.now() - startTime < this.acquireTimeout) {
      if (this.pool.length > 0) {
        const connection = this.pool.shift();
        
        // Verificar si la conexión está viva
        try {
          await this.ping(connection);
          logger.debug('Connection acquired from pool');
          return connection;
        } catch {
          // Conexión muerta, crear una nueva
          logger.warn('Dead connection detected, creating new one');
          return await this.createConnection();
        }
      }

      // Pool vacío, crear nueva conexión si no hemos alcanzado el máximo
      if (this.connections.length < this.maxSize) {
        const connection = await this.createConnection();
        this.connections.push(connection);
        logger.debug('New connection created (pool exhausted)');
        return connection;
      }

      // Esperar y reintentar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error('Connection pool timeout - no available connections');
  }

  async release(connection) {
    if (!connection) return;

    try {
      await this.ping(connection);
      this.pool.push(connection);
      logger.debug('Connection released to pool');
    } catch {
      // Conexión muerta, remover del pool
      await this.removeConnection(connection);
    }
  }

  async ping(connection) {
    return new Promise((resolve, reject) => {
      connection.query('SELECT 1 FROM RDB$DATABASE', (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  async removeConnection(connection) {
    const index = this.connections.indexOf(connection);
    if (index > -1) {
      this.connections.splice(index, 1);
    }

    const poolIndex = this.pool.indexOf(connection);
    if (poolIndex > -1) {
      this.pool.splice(poolIndex, 1);
    }

    try {
      connection.detach();
    } catch (error) {
      logger.error('Error detaching connection:', error);
    }

    logger.debug('Connection removed from pool');
  }

  async executeQuery(sql, params = []) {
    const connection = await this.acquire();
    
    try {
      return await this.execute(connection, sql, params);
    } finally {
      await this.release(connection);
    }
  }

  async execute(connection, sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) {
          logger.error(`Query error: ${sql}`, err);
          reject(err);
          return;
        }
        logger.debug(`Query executed: ${sql.substring(0, 100)}...`);
        resolve(result);
      });
    });
  }

  async executeTransaction(queries) {
    const connection = await this.acquire();
    
    try {
      return await this.transaction(connection, queries);
    } finally {
      await this.release(connection);
    }
  }

  async transaction(connection, queries) {
    return new Promise((resolve, reject) => {
      connection.transaction(firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
        if (err) {
          reject(err);
          return;
        }

        const executeQueries = async () => {
          try {
            const results = [];
            
            for (const q of queries) {
              const result = await new Promise((resolveQuery, rejectQuery) => {
                transaction.query(q.sql, q.params || [], (err, result) => {
                  if (err) rejectQuery(err);
                  else resolveQuery(result);
                });
              });
              results.push(result);
            }

            transaction.commit((err) => {
              if (err) reject(err);
              else {
                logger.debug('Transaction committed successfully');
                resolve(results);
              }
            });
          } catch (err) {
            transaction.rollback(() => {
              logger.error('Transaction rolled back:', err);
              reject(err);
            });
          }
        };

        executeQueries();
      });
    });
  }

  async executeProcedure(procName, params = []) {
    const connection = await this.acquire();
    
    try {
      return await this.procedure(connection, procName, params);
    } finally {
      await this.release(connection);
    }
  }

  async procedure(connection, procName, params = []) {
    return new Promise((resolve, reject) => {
      connection.execute(procName, params, (err, result) => {
        if (err) {
          logger.error(`Procedure error: ${procName}`, err);
          reject(err);
          return;
        }
        logger.debug(`Procedure executed: ${procName}`);
        resolve(result);
      });
    });
  }

  async cleanup() {
    logger.info('Cleaning up connection pool...');
    
    for (const connection of this.connections) {
      try {
        connection.detach();
      } catch (error) {
        logger.error('Error detaching connection during cleanup:', error);
      }
    }
    
    this.connections = [];
    this.pool = [];
    this.initialized = false;
    
    logger.info('Connection pool cleaned up');
  }

  getStats() {
    return {
      total: this.connections.length,
      available: this.pool.length,
      inUse: this.connections.length - this.pool.length,
      maxSize: this.maxSize,
      minSize: this.minSize,
    };
  }
}

// Singleton instance
export const firebirdPool = new FirebirdPool();

// Helper functions for backward compatibility
export const query = (sql, params) => firebirdPool.executeQuery(sql, params);
export const transaction = (queries) => firebirdPool.executeTransaction(queries);
export const executeProcedure = (procName, params) => firebirdPool.executeProcedure(procName, params);

export default firebirdPool;
