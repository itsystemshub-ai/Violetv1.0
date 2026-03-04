#!/usr/bin/env tsx
/**
 * Script para recuperar archivos faltantes del historial de git
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface FileRecovery {
  commit: string;
  sourcePath: string;
  targetPath: string;
}

const filesToRecover: FileRecovery[] = [
  // Sync files
  {
    commit: '8dab030',
    sourcePath: 'src/lib/SyncEngine.ts',
    targetPath: 'src/core/sync/SyncEngine.ts'
  },
  {
    commit: '8dab030',
    sourcePath: 'src/lib/SyncManager.ts',
    targetPath: 'src/core/sync/SyncManager.ts'
  },
  {
    commit: '8dab030',
    sourcePath: 'src/lib/SyncService.ts',
    targetPath: 'src/core/sync/SyncService.ts'
  },
  // Database files
  {
    commit: '8dab030',
    sourcePath: 'src/lib/localDb.ts',
    targetPath: 'src/core/database/localDb.ts'
  },
  // Schemas
  {
    commit: '8dab030',
    sourcePath: 'src/lib/schemas/product.schema.ts',
    targetPath: 'src/core/database/schemas/product.schema.ts'
  },
  {
    commit: '8dab030',
    sourcePath: 'src/lib/schemas/invoice.schema.ts',
    targetPath: 'src/core/database/schemas/invoice.schema.ts'
  },
  {
    commit: '8dab030',
    sourcePath: 'src/lib/schemas/employee.schema.ts',
    targetPath: 'src/core/database/schemas/employee.schema.ts'
  },
  {
    commit: '8dab030',
    sourcePath: 'src/lib/schemas/user.schema.ts',
    targetPath: 'src/core/database/schemas/user.schema.ts'
  },
  // Utils
  {
    commit: '8dab030',
    sourcePath: 'src/lib/utils.ts',
    targetPath: 'src/core/shared/utils/utils.ts'
  }
];

function recoverFile(recovery: FileRecovery): boolean {
  try {
    // Crear directorio si no existe
    const targetDir = path.dirname(recovery.targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Verificar si el archivo ya existe
    if (fs.existsSync(recovery.targetPath)) {
      console.log(`⏭️  ${recovery.targetPath} ya existe`);
      return true;
    }

    // Recuperar archivo del historial
    const content = execSync(
      `git show ${recovery.commit}:${recovery.sourcePath}`,
      { encoding: 'utf-8' }
    );

    // Escribir archivo
    fs.writeFileSync(recovery.targetPath, content, 'utf-8');
    console.log(`✅ ${recovery.targetPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error recuperando ${recovery.targetPath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔄 Recuperando archivos faltantes...\n');

  let recovered = 0;
  let skipped = 0;
  let failed = 0;

  for (const recovery of filesToRecover) {
    const result = recoverFile(recovery);
    if (result) {
      if (fs.existsSync(recovery.targetPath)) {
        recovered++;
      } else {
        skipped++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos recuperados: ${recovered}`);
  console.log(`   Archivos existentes: ${skipped}`);
  console.log(`   Errores: ${failed}`);
  console.log(`\n✅ Recuperación completada!`);
}

main().catch(console.error);
