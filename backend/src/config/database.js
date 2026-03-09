const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

let db;
let pool;

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

/**
 * Determinar la ruta de la base de datos según el entorno
 */
function getDatabasePath() {
  // 1. Prioridad: Variable de entorno explícita (útil para Docker/xCloud)
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  // 2. Entorno Electron
  try {
    const { app } = require('electron');
    if (app && app.getPath) {
      return path.join(app.getPath('userData'), 'violet_erp.db');
    }
  } catch (e) {
    // No estamos en Electron
  }

  // 3. Fallback: Directorio data local (útil para desarrollo y servidores Linux)
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'violet_erp.db');
}

/**
 * Inicializa la conexión a la base de datos
 */
async function initDatabase() {
  if (DB_TYPE === 'mariadb' || DB_TYPE === 'mysql') {
    console.log('[DB] Iniciando conexión a MariaDB...');
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'violet_erp',
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('[DB] Pool de MariaDB inicializado.');
      return pool;
    } catch (err) {
      console.error('[DB] Error al conectar con MariaDB:', err.message);
      throw err;
    }
  } else {
    const dbPath = getDatabasePath();
    console.log('[DB] Iniciando SQLite en:', dbPath);
    try {
      db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
      });
      db.pragma('journal_mode = WAL');
      console.log('[DB] SQLite inicializado.');
      return db;
    } catch (err) {
      console.error('[DB] Error al inicializar SQLite:', err.message);
      throw err;
    }
  }
}

/**
 * Obtiene la instancia de la base de datos (Pool para MariaDB, Síncrono para SQLite)
 */
function getDb() {
  if (DB_TYPE === 'mariadb' || DB_TYPE === 'mysql') return pool;
  if (!db) {
    const dbPath = getDatabasePath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

module.exports = {
  initDatabase,
  getDb,
  DB_TYPE
};
