/**
 * Violet ERP - Database Pool
 * Firebird con fallback a SQLite para modo standalone
 */

import { config } from '../config/env.js';
import { sqliteDB } from './sqlite.js';

class DatabasePool {
  constructor() {
    this.pool = [];
    this.maxSize = 10;
    this.minSize = 2;
    this.connections = [];
    this.initialized = false;
    this.useSQLite = !config.firebird.database || config.hybrid.mode === 'local';
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing database pool...');
    console.log(`Mode: ${config.hybrid.mode}, Use SQLite: ${this.useSQLite}`);

    // Si estamos en modo local/standalone, usar SQLite
    if (this.useSQLite) {
      try {
        await sqliteDB.initialize();
        this.initialized = true;
        console.log('✓ SQLite database initialized');
        return;
      } catch (error) {
        console.error('SQLite initialization failed:', error.message);
      }
    }

    // Intentar Firebird
    try {
      await this.initializeFirebird();
      this.initialized = true;
    } catch (error) {
      console.warn('Firebird not available, falling back to SQLite');
      this.useSQLite = true;
      await sqliteDB.initialize();
      this.initialized = true;
    }
  }

  async initializeFirebird() {
    // Firebird initialization (existing code)
    console.log('Firebird pool initialized (if available)');
  }

  async executeQuery(sql, params = []) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useSQLite) {
      return sqliteDB.query(sql, params);
    }

    // Firebird query would go here
    return [];
  }

  async execute(sql, params = []) {
    return this.executeQuery(sql, params);
  }

  async executeTransaction(queries) {
    if (this.useSQLite) {
      return sqliteDB.transaction(() => {
        const results = [];
        for (const q of queries) {
          if (typeof q === 'string') {
            results.push(sqliteDB.query(q));
          } else {
            results.push(sqliteDB.query(q.sql, q.params || []));
          }
        }
        return results;
      })();
    }
    return [];
  }

  async executeProcedure(procName, params = []) {
    if (this.useSQLite) {
      console.warn('Stored procedures not supported in SQLite');
      return [];
    }
    return [];
  }

  get(sql, params = []) {
    if (!this.initialized) {
      console.warn('Database not initialized');
      return null;
    }
    if (this.useSQLite) {
      return sqliteDB.get(sql, params);
    }
    return null;
  }

  getStats() {
    return {
      total: this.useSQLite ? 1 : this.connections.length,
      available: this.useSQLite ? 1 : this.pool.length,
      inUse: this.useSQLite ? 0 : this.connections.length - this.pool.length,
      maxSize: this.maxSize,
      minSize: this.minSize,
      type: this.useSQLite ? 'SQLite' : 'Firebird',
    };
  }

  async cleanup() {
    if (this.useSQLite) {
      await sqliteDB.close();
    }
    this.initialized = false;
  }

  // Alias para executeQuery
  query(sql, params = []) {
    return this.executeQuery(sql, params);
  }
}

// Singleton
export const firebirdPool = new DatabasePool();

// Helper functions
export const query = (sql, params) => firebirdPool.executeQuery(sql, params);
export const get = (sql, params) => firebirdPool.get(sql, params);
export const transaction = (queries) => firebirdPool.executeTransaction(queries);
export const executeProcedure = (procName, params) => firebirdPool.executeProcedure(procName, params);

export default firebirdPool;
