/**
 * Violet ERP - Script de Restauración de Base de Datos
 * 
 * Uso: pnpm db:restore <archivo>
 */

import { db } from '@violet-erp/database';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function restore(backupFile) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   VIOLET ERP - Database Restore                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  if (!backupFile) {
    console.error('Error: Backup file required');
    console.log('Usage: pnpm db:restore <archivo>');
    console.log('');
    console.log('Available backups:');
    
    const backupDir = path.join(__dirname, '../../backups');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.gz'))
        .sort()
        .reverse();
      
      backups.slice(0, 10).forEach((f, i) => {
        console.log(`  ${i + 1}. ${f}`);
      });
    }
    process.exit(1);
  }

  try {
    // Descomprimir si es .gz
    let sourceFile = backupFile;
    
    if (backupFile.endsWith('.gz')) {
      const zlib = await import('zlib');
      const compressed = fs.readFileSync(backupFile);
      const decompressed = zlib.gunzipSync(compressed);
      
      sourceFile = backupFile.replace('.gz', '');
      fs.writeFileSync(sourceFile, decompressed);
      console.log(`✓ Decompressed: ${backupFile}`);
    }

    // Cerrar conexión actual
    db.disconnect();

    // Copiar backup a ubicación de base de datos
    const dbPath = config.sqlitePath || './violet.db';
    
    // Backup de la base de datos actual antes de restaurar
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const preRestoreBackup = `${dbPath}.pre-restore-${timestamp}`;
    fs.copyFileSync(dbPath, preRestoreBackup);
    console.log(`✓ Pre-restore backup: ${preRestoreBackup}`);

    // Restaurar
    fs.copyFileSync(sourceFile, dbPath);
    console.log(`✓ Restored: ${dbPath}`);

    // Eliminar archivo temporal descomprimido
    if (backupFile.endsWith('.gz') && fs.existsSync(sourceFile)) {
      fs.unlinkSync(sourceFile);
    }

    console.log('');
    console.log('Restore completed successfully!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

// Obtener archivo desde argumentos
const backupFile = process.argv[2];
restore(backupFile);
