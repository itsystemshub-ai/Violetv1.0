const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'violet_erp.db');
  console.log('[DB] Iniciando SQLite en:', dbPath);

  try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');

    // Crear tablas básicas si no existen
    db.exec(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        sync_status TEXT DEFAULT 'PENDING',
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // ════════════════════════════════════════════════════════════════════════
    // ═══ CLOUD READY STANDARDIZATION (UUIDs, is_dirty, last_sync) ═══
    // ════════════════════════════════════════════════════════════════════════

    const allTables = [
      'sync_logs', 'config', 'tenants', 'employees', 'salary_history', 
      'prestaciones_acumuladas', 'payroll_records', 'igtf_records',
      'sales_invoices', 'purchases_invoices', 'financial_transactions',
      'financial_accounts', 'products', 'profiles'
    ];

    const standardMetadata = [
      ['last_sync', 'DATETIME'],
      ['is_dirty', 'INTEGER DEFAULT 1'],
      ['updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
      ['created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
      ['deleted_at', 'DATETIME'],
      ['version', 'INTEGER DEFAULT 1']
    ];

    for (const table of allTables) {
      // Intentar crear la tabla si no existe (con estructura mínima)
      try {
        db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY)`);
      } catch (e) {}

      // Agregar columnas estándar a todas las tablas
      for (const [col, def] of standardMetadata) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        } catch (e) {}
      }
    }

    const extraColumns = {
      tenants: [
        ['name', 'TEXT'], ['slug', 'TEXT'], ['settings', 'TEXT'],
        ['fiscal_name', 'TEXT'], ['commercial_name', 'TEXT'], ['rif', 'TEXT'], 
        ['address', 'TEXT'], ['city', 'TEXT'], ['state', 'TEXT'], 
        ['postal_code', 'TEXT'], ['sector', 'TEXT'],
        ['phone', 'TEXT'], ['email', 'TEXT'], ['website', 'TEXT'],
        ['logo_url', 'TEXT'], ['primary_color', 'TEXT'], ['secondary_color', 'TEXT'],
        ['currency', 'TEXT'], ['exchange_rate', 'REAL DEFAULT 1'],
        ['is_active', 'INTEGER DEFAULT 1'],
        ['status', "TEXT DEFAULT 'active'"]
      ],
      employees: [
        ['tenant_id', 'TEXT'], ['first_name', 'TEXT'], ['last_name', 'TEXT'],
        ['dni', 'TEXT'], ['rif', 'TEXT'], ['military_registration', 'TEXT'],
        ['cargas_familiares', 'INTEGER DEFAULT 0'], ['centro_costos', 'TEXT'],
        ['status', "TEXT DEFAULT 'activo'"]
      ],
      financial_transactions: [
        ['tenant_id', 'TEXT'], ['account_id', 'TEXT'], ['description', 'TEXT'],
        ['amount', 'REAL DEFAULT 0'], ['type', 'TEXT'], ['monto_bs', 'REAL DEFAULT 0'],
        ['tasa_cambio', 'REAL DEFAULT 1']
      ],
      sales_invoices: [
        ['tenant_id', 'TEXT'], ['number', 'TEXT'], ['date', 'TEXT'],
        ['total', 'REAL DEFAULT 0'], ['metadata', 'TEXT'], ['type', "TEXT DEFAULT 'venta'"]
      ],
      profiles: [
        ['tenant_id', 'TEXT'], ['username', 'TEXT'], ['full_name', 'TEXT'],
        ['email', 'TEXT'], ['role', 'TEXT'], ['department', 'TEXT'],
        ['password', 'TEXT'], ['avatar_url', 'TEXT'],
        ['two_factor_enabled', 'INTEGER DEFAULT 0'],
        ['permissions', 'TEXT'], ['loyalty_points', 'INTEGER DEFAULT 0']
      ]
    };

    for (const [table, cols] of Object.entries(extraColumns)) {
      for (const [col, def] of cols) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        } catch (e) {}
      }
    }

    console.log('[DB] SQLite migrado y estandarizado para la nube.');

    console.log('[DB] SQLite inicializado correctamente.');
  } catch (err) {
    console.error('[DB] Error al inicializar SQLite:', err.message);
    throw err;
  }
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

function executeSql(query, params = []) {
  try {
    const database = getDb();
    const statement = database.prepare(query);
    
    // Si es un SELECT o tiene RETURNING, usamos .all() o .get()
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
 * Realiza un UPSERT dinámico en SQLite.
 * @param {string} tableName 
 * @param {object} payload 
 */
function upsertRecord(tableName, payload) {
  const keys = Object.keys(payload);
  const placeholders = keys.map(() => '?').join(', ');
  const columns = keys.join(', ');
  const updates = keys.filter(k => k !== 'id').map(k => `${k}=excluded.${k}`).join(', ');

  const query = `
    INSERT INTO ${tableName} (${columns}) 
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${updates}
  `;

  return executeSql(query, Object.values(payload));
}

module.exports = {
  initDatabase,
  getDb,
  executeSql,
  upsertRecord
};
