const { getDb, DB_TYPE } = require('../config/database');

/**
 * Modelo base para operaciones de base de datos
 */
class DatabaseModel {
  /**
   * Ejecuta una consulta SQL
   */
  static async executeSql(query, params = []) {
    try {
      const db = getDb();
      
      if (DB_TYPE === 'mariadb' || DB_TYPE === 'mysql') {
        const [rows] = await db.execute(query, params);
        return rows;
      } else {
        // SQLite
        const statement = db.prepare(query);
        const upperQuery = query.trim().toUpperCase();
        if (upperQuery.startsWith('SELECT') || upperQuery.includes('RETURNING')) {
          return statement.all(...params);
        } else {
          return statement.run(...params);
        }
      }
    } catch (err) {
      console.error(`[DB] Error ejecutando SQL (${DB_TYPE}):`, err.message);
      throw err;
    }
  }

  /**
   * Realiza un UPSERT dinámico compatible con SQLite y MariaDB
   */
  static async upsertRecord(tableName, payload) {
    const keys = Object.keys(payload);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    
    let query = '';
    
    if (DB_TYPE === 'mariadb' || DB_TYPE === 'mysql') {
      const updates = keys.filter(k => k !== 'id').map(k => `${k}=VALUES(${k})`).join(', ');
      query = `
        INSERT INTO ${tableName} (${columns}) 
        VALUES (${placeholders})
        ON DUPLICATE KEY UPDATE ${updates}
      `;
    } else {
      // SQLite
      const updates = keys.filter(k => k !== 'id').map(k => `${k}=excluded.${k}`).join(', ');
      query = `
        INSERT INTO ${tableName} (${columns}) 
        VALUES (${placeholders})
        ON CONFLICT(id) DO UPDATE SET ${updates}
      `;
    }

    return await this.executeSql(query, Object.values(payload));
  }
}

module.exports = DatabaseModel;
