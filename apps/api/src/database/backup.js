/**
 * Violet ERP - Script de Backup de Base de Datos
 * 
 * Uso: pnpm db:backup
 */

import { db } from '@violet-erp/database';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function backup() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   VIOLET ERP - Database Backup                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Conectar
    db.connect();
    console.log('✓ Database connected');

    // Crear directorio de backups
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Nombre del archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `violet-erp-${timestamp}.db`);

    // Copiar archivo de base de datos
    const dbPath = config.sqlitePath || './violet.db';
    fs.copyFileSync(dbPath, backupFile);

    console.log(`✓ Backup created: ${backupFile}`);

    // Comprimir (opcional)
    const compressedFile = `${backupFile}.gz`;
    const zlib = await import('zlib');
    const fileContent = fs.readFileSync(backupFile);
    const compressed = zlib.gzipSync(fileContent);
    fs.writeFileSync(compressedFile, compressed);

    console.log(`✓ Compressed: ${compressedFile}`);

    // Eliminar backup sin comprimir
    fs.unlinkSync(backupFile);

    // Limpiar backups antiguos (mantener últimos 10)
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.gz'))
      .sort()
      .reverse();

    if (backups.length > 10) {
      backups.slice(10).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f));
        console.log(`✓ Deleted old backup: ${f}`);
      });
    }

    console.log('');
    console.log('Backup completed successfully!');
    console.log(`Location: ${backupDir}`);
    console.log('');

    db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    db.disconnect();
    process.exit(1);
  }
}

backup();
