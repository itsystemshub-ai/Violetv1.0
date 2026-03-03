const { getDb } = require('../config/database');

/**
 * Modelo base para operaciones de base de datos
 */
class DatabaseModel {
  /**
   * Ejecuta una consulta SQL
   */
  static executeSql(query, params = []) {
    try {
      const db = getDb();
      const statement = db.prepare(query);
      
      const upperQuery = query.trim().toUpperCase();
      if (upperQuery.startsWith('SELECT') || upperQuery.includes('RETURNING')) {
        return statement.all(...params);
      } else {
        return statement.run(...params);
      }
    } catch (err) {
      console.error('[DB] Error ejecutando SQL:', err.message);
      throw err;
    }
  }

  /**
   * Realiza un UPSERT dinámico
   */
  static upsertRecord(tableName, payload) {
    const keys = Object.keys(payload);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const updates = keys.filter(k => k !== 'id').map(k => `${k}=excluded.${k}`).join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns}) 
      VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates}
    `;

    return this.executeSql(query, Object.values(payload));
  }
}

module.exports = DatabaseModel;
