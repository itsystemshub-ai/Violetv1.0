/**
 * Violet ERP - Base de Datos SQLite Local
 * Fallback para modo standalone sin Firebird
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    if (!config.sqlite.enabled) return false;

    try {
      // Crear directorio data si no existe
      const fs = await import('fs');
      const dataDir = path.dirname(config.sqlite.path);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Conectar a SQLite
      this.db = new Database(config.sqlite.path);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      // Crear tablas básicas
      await this.createTables();

      // Insertar datos por defecto
      await this.seedData();

      this.initialized = true;
      console.log('[SQLite] Database initialized ✓');
      return true;
    } catch (error) {
      console.error('[SQLite] Initialization error:', error.message);
      return false;
    }
  }

  async createTables() {
    const tables = `
      -- Usuarios
      CREATE TABLE IF NOT EXISTS usuarios (
        codigo TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        nombre TEXT NOT NULL,
        correo_e TEXT,
        clave TEXT NOT NULL,
        perfil_codigo TEXT DEFAULT 'user',
        activo TEXT DEFAULT 'S',
        bloqueado TEXT DEFAULT 'N',
        intentos_fallidos INTEGER DEFAULT 0,
        ultimo_login DATETIME,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Roles
      CREATE TABLE IF NOT EXISTS roles (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT
      );

      -- Permisos
      CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        perfil_codigo TEXT NOT NULL,
        proceso_codigo TEXT NOT NULL,
        insertar TEXT DEFAULT 'N',
        modificar TEXT DEFAULT 'N',
        eliminar TEXT DEFAULT 'N',
        consultar TEXT DEFAULT 'S',
        procesar TEXT DEFAULT 'N',
        FOREIGN KEY (perfil_codigo) REFERENCES roles(codigo)
      );

      -- Productos
      CREATE TABLE IF NOT EXISTS productos (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT,
        precio_venta REAL DEFAULT 0,
        costo_actual REAL DEFAULT 0,
        existencia_actual REAL DEFAULT 0,
        existencia_minima REAL DEFAULT 10,
        unidad_medida TEXT DEFAULT 'UND',
        activo TEXT DEFAULT 'S',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Clientes
      CREATE TABLE IF NOT EXISTS clientes (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        rif TEXT,
        direccion TEXT,
        telefono TEXT,
        correo_e TEXT,
        activo TEXT DEFAULT 'S',
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Ventas
      CREATE TABLE IF NOT EXISTS ventas (
        correlativo INTEGER PRIMARY KEY AUTOINCREMENT,
        documento TEXT,
        cliente_codigo TEXT,
        total_operacion REAL DEFAULT 0,
        estado TEXT DEFAULT 'CONFIRMADA',
        anulada TEXT DEFAULT 'N',
        usuario_codigo TEXT,
        fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_codigo) REFERENCES clientes(codigo)
      );

      -- Inventario
      CREATE TABLE IF NOT EXISTS inventario (
        id TEXT PRIMARY KEY,
        producto_codigo TEXT NOT NULL,
        deposito_codigo TEXT DEFAULT 'PRINCIPAL',
        cantidad REAL DEFAULT 0,
        reservado REAL DEFAULT 0,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_codigo) REFERENCES productos(codigo)
      );

      -- Configuración del sistema
      CREATE TABLE IF NOT EXISTS sistema_config (
        clave TEXT PRIMARY KEY,
        valor TEXT,
        descripcion TEXT,
        actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Logs de sincronización
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
        updated_at DATETIME
      );

      -- Notificaciones
      CREATE TABLE IF NOT EXISTS notificaciones (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        titulo TEXT NOT NULL,
        mensaje TEXT,
        tipo TEXT DEFAULT 'info',
        modulo TEXT,
        url TEXT,
        leido TEXT DEFAULT 'N',
        leido_en DATETIME,
        creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(codigo)
      );

      -- Auditoría
      CREATE TABLE IF NOT EXISTS auditoria (
        id TEXT PRIMARY KEY,
        usuario_codigo TEXT,
        tabla_afectada TEXT,
        registro_afectado TEXT,
        accion TEXT,
        estacion TEXT,
        ip_address TEXT,
        cambios TEXT,
        modulo TEXT,
        severidad TEXT DEFAULT 'INFO',
        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sesiones
      CREATE TABLE IF NOT EXISTS sesiones_usuario (
        id TEXT PRIMARY KEY,
        usuario_codigo TEXT NOT NULL,
        token TEXT,
        estacion TEXT,
        ip_address TEXT,
        inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        vencimiento DATETIME,
        activa TEXT DEFAULT 'S',
        FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo)
      );

      -- Índice para búsquedas
      CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
      CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(sync_status);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
    `;

    this.db.exec(tables);
    console.log('[SQLite] Tables created ✓');
  }

  async seedData() {
    const bcrypt = await import('bcrypt');

    // Verificar si ya existe admin
    const existing = this.db.prepare('SELECT codigo FROM usuarios WHERE codigo = ?').get('ADMIN');
    if (existing) return;

    // Insertar roles
    const roles = [
      ['super_admin', 'Super Administrador', 'Acceso total al sistema'],
      ['admin', 'Administrador', 'Administración general'],
      ['manager', 'Gerente', 'Gestión de operaciones'],
      ['user', 'Usuario', 'Usuario estándar'],
      ['viewer', 'Visualizador', 'Solo lectura'],
    ];

    const insertRole = this.db.prepare(`
      INSERT OR IGNORE INTO roles (codigo, nombre, descripcion) VALUES (?, ?, ?)
    `);

    for (const role of roles) {
      insertRole.run(...role);
    }

    // Insertar permisos para super_admin
    const procesos = ['USUARIOS', 'PRODUCTOS', 'VENTAS', 'COMPRAS', 'INVENTARIO', 'REPORTES'];
    const insertPermiso = this.db.prepare(`
      INSERT OR IGNORE INTO permisos (perfil_codigo, proceso_codigo, insertar, modificar, eliminar, consultar, procesar)
      VALUES (?, ?, 'S', 'S', 'S', 'S', 'S')
    `);

    for (const proceso of procesos) {
      insertPermiso.run('super_admin', proceso);
    }

    // Insertar usuario admin por defecto con USERNAME
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.db.prepare(`
      INSERT OR IGNORE INTO usuarios (codigo, username, nombre, correo_e, clave, perfil_codigo, activo, bloqueado)
      VALUES ('ADMIN', 'admin', 'Administrador del Sistema', 'admin@violet-erp.com', ?, 'super_admin', 'S', 'N')
    `).run(hashedPassword);

    // Configuración por defecto
    const configData = [
      ['EMPRESA_NOMBRE', 'Violet ERP', 'Nombre de la empresa'],
      ['MONEDA_LOCAL', 'DOP', 'Moneda local'],
      ['IMPUESTO_TASA', '18', 'Tasa de impuesto (%)'],
      ['SYNC_ENABLED', 'S', 'Sincronización habilitada'],
    ];

    const insertConfig = this.db.prepare(`
      INSERT OR REPLACE INTO sistema_config (clave, valor, descripcion, actualizado_en)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const conf of configData) {
      insertConfig.run(...conf);
    }

    console.log('[SQLite] Seed data inserted ✓');
  }

  // Métodos de consulta
  query(sql, params = []) {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...params);
      }
      const result = stmt.run(...params);
      return { affectedRows: result.changes, lastInsertRowid: result.lastInsertRowid };
    } catch (error) {
      console.error('[SQLite] Query error:', error.message, sql);
      throw error;
    }
  }

  get(sql, params = []) {
    if (!this.db) return null;
    try {
      return this.db.prepare(sql).get(...params);
    } catch (error) {
      console.error('[SQLite] Get error:', error.message);
      throw error;
    }
  }

  // Transacciones
  transaction(callback) {
    if (!this.db) return callback();
    return this.db.transaction(callback)();
  }

  // Cerrar conexión
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      console.log('[SQLite] Database closed');
    }
  }

  // Obtener instancia
  getInstance() {
    return this.db;
  }
}

// Singleton
export const sqliteDB = new SQLiteDatabase();
export default sqliteDB;
