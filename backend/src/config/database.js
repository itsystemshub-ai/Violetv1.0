const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

/**
 * Configuración de la base de datos SQLite
 */
const dbConfig = {
  path: path.join(app.getPath('userData'), 'violet_erp.db'),
  options: {
    verbose: console.log
  }
};

/**
 * Inicializa la conexión a la base de datos
 */
function initDatabase() {
  console.log('[DB] Iniciando SQLite en:', dbConfig.path);

  try {
    db = new Database(dbConfig.path, dbConfig.options);
    db.pragma('journal_mode = WAL');
    
    console.log('[DB] SQLite inicializado correctamente.');
    return db;
  } catch (err) {
    console.error('[DB] Error al inicializar SQLite:', err.message);
    throw err;
  }
}

/**
 * Obtiene la instancia de la base de datos
 */
function getDb() {
  if (!db) initDatabase();
  return db;
}

module.exports = {
  initDatabase,
  getDb,
  dbConfig
};
