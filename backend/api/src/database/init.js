/**
 * Violet ERP - Database Init
 * Inicialización de Firebird
 */

import { connect, disconnect, query, transaction } from '../database/firebird/connection.js';

export {
  connect,
  disconnect,
  query,
  transaction,
};

// Export database instance
export const db = {
  prepare: (sql) => ({
    get: async (...params) => {
      const result = await query(sql, params);
      return result[0];
    },
    all: async (...params) => {
      return await query(sql, params);
    },
    run: async (...params) => {
      return await transaction([{ sql, params }]);
    },
  }),
};

export default db;
