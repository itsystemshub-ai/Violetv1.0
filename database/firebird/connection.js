/**
 * Violet ERP - Conexión Firebird
 */

import firebird from 'node-firebird';
import { config } from '../config/index.js';

let db = null;

export const firebirdConfig = {
  host: config.firebird.host || 'localhost',
  port: config.firebird.port || 3050,
  database: config.firebird.database || 'C:/VioletERP/database/valery3.fdb',
  user: config.firebird.user || 'SYSDBA',
  password: config.firebird.password || 'masterkey',
  lowercase_keys: config.firebird.lowercase_keys || false,
  role: config.firebird.role || undefined,
  pageSize: config.firebird.pageSize || 4096,
};

/**
 * Conectar a Firebird
 */
export async function connect() {
  return new Promise((resolve, reject) => {
    firebird.attach(firebirdConfig, (err, connection) => {
      if (err) {
        console.error('Firebird connection error:', err);
        reject(err);
        return;
      }
      db = connection;
      console.log('Firebird connected ✓');
      resolve(connection);
    });
  });
}

/**
 * Desconectar de Firebird
 */
export async function disconnect() {
  if (db) {
    db.detach();
    db = null;
    console.log('Firebird disconnected');
  }
}

/**
 * Ejecutar query
 */
export async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not connected'));
      return;
    }
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Ejecutar query con transacción
 */
export async function transaction(queries) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not connected'));
      return;
    }
    db.transaction(firebird.ISOLATION_READ_COMMITTED, (err, transaction) => {
      if (err) {
        reject(err);
        return;
      }

      const executeQueries = async () => {
        try {
          for (const q of queries) {
            await new Promise((resolveQuery, rejectQuery) => {
              transaction.query(q.sql, q.params || [], (err, result) => {
                if (err) {
                  rejectQuery(err);
                  return;
                }
                resolveQuery(result);
              });
            });
          }
          transaction.commit((err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve('Transaction completed');
          });
        } catch (err) {
          transaction.rollback(() => {
            reject(err);
          });
        }
      };

      executeQueries();
    });
  });
}

/**
 * Ejecutar stored procedure
 */
export async function executeProcedure(procName, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not connected'));
      return;
    }
    db.execute(procName, params, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Obtener conexión directa
 */
export function getConnection() {
  return db;
}

export default {
  connect,
  disconnect,
  query,
  transaction,
  executeProcedure,
  getConnection,
};
