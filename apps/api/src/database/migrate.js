/**
 * Violet ERP - Script de Migración de Base de Datos
 * 
 * Uso: pnpm db:migrate
 */

import { db } from '@violet-erp/database';
import { initializeDatabase } from '../database/schema.js';

async function migrate() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   VIOLET ERP - Database Migration                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Conectar a la base de datos
    db.connect();
    console.log('✓ Database connected');

    // Ejecutar migraciones
    await initializeDatabase();
    console.log('✓ Migrations applied');

    // Verificar estado
    const tables = db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log(`✓ ${tables.length} tables created`);
    console.log('');
    console.log('Migration completed successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log('  Email: admin@violet-erp.com');
    console.log('  Password: admin123');
    console.log('');

    db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    db.disconnect();
    process.exit(1);
  }
}

migrate();
