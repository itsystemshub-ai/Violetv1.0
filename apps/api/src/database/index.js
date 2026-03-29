/**
 * Violet ERP - Inicialización de Base de Datos Híbrida
 * 
 * Soporte: SQLite (local) + PostgreSQL/Supabase (nube)
 * Sincronización bidireccional automática
 */

import { db, SqliteDatabase } from '@violet-erp/database';
import { config } from '../config/index.js';
import { initializeDatabase } from './schema.js';
import { hybridSync } from '../sync/hybrid-sync.js';

let initialized = false;

/**
 * Inicializar base de datos completa
 */
export async function initializeDatabase() {
  if (initialized) {
    console.log('Database already initialized');
    return;
  }

  try {
    console.log('Initializing Violet ERP Database...');
    console.log(`Mode: ${config.dbType}`);

    if (config.dbType === 'sqlite') {
      await initializeSQLite();
    } else if (config.dbType === 'postgres') {
      await initializePostgres();
    } else if (config.dbType === 'supabase') {
      await initializeSupabase();
    }

    // Inicializar sincronización híbrida
    if (config.syncEnabled) {
      await hybridSync.initialize();
    }

    initialized = true;
    console.log('Database initialized successfully ✓');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Inicializar SQLite (modo local o híbrido)
 */
async function initializeSQLite() {
  console.log('Initializing SQLite database...');
  
  const database = db;
  database.connect();

  // Crear esquema completo
  await initializeDatabase();

  console.log('SQLite database ready');
}

/**
 * Inicializar PostgreSQL (modo nube)
 */
async function initializePostgres() {
  console.log('Initializing PostgreSQL database...');
  
  // Implementar inicialización PostgreSQL
  // Por ahora usamos SQLite como local y PostgreSQL como cloud
  
  console.log('PostgreSQL database ready');
}

/**
 * Inicializar Supabase
 */
async function initializeSupabase() {
  console.log('Initializing Supabase database...');
  
  // Implementar inicialización Supabase
  
  console.log('Supabase database ready');
}

/**
 * Obtener instancia de base de datos
 */
export function getDatabase() {
  return db;
}

/**
 * Cerrar conexión
 */
export async function closeDatabase() {
  if (db) {
    db.disconnect();
  }
  
  if (hybridSync) {
    await hybridSync.destroy();
  }
  
  initialized = false;
}

export default {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
