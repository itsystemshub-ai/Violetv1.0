const DatabaseModel = require('../models/database.model');

/**
 * Controlador para operaciones SQL directas
 */
class SqlController {
  /**
   * Ejecuta una consulta SQL
   */
  static async execute(req, res, next) {
    try {
      const { query, params } = req.body;
      const result = await DatabaseModel.executeSql(query, params || []);
      
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Ejecuta una mutación (INSERT/UPDATE/DELETE)
   */
  static async mutate(req, res, next) {
    try {
      const { tableName, action, payload, recordId } = req.body;
      
      if (action === 'INSERT' || action === 'UPDATE') {
        await DatabaseModel.upsertRecord(tableName, payload);
      } else if (action === 'DELETE') {
        await DatabaseModel.executeSql(`DELETE FROM ${tableName} WHERE id = ?`, [recordId]);
      }

      // Registrar en sync_logs
      const syncLogId = require('crypto').randomUUID();
      await DatabaseModel.executeSql(`
        INSERT INTO sync_logs (id, table_name, record_id, action, payload, sync_status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `, [syncLogId, tableName, recordId, action, JSON.stringify(payload)]);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SqlController;
