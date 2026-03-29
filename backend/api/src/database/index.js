/**
 * Violet ERP - Database Index
 * Conexión con Firebird
 */

import { connect, disconnect, query, transaction, executeProcedure, getConnection } from '../../database/firebird/connection.js';

export {
  connect,
  disconnect,
  query,
  transaction,
  executeProcedure,
  getConnection,
};

export default {
  connect,
  disconnect,
  query,
  transaction,
  executeProcedure,
  getConnection,
};
