#!/usr/bin/env tsx
/**
 * Script para actualizar imports de Sync services a la nueva ubicación
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function updateSyncImports(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  // Actualizar imports de SyncEngine
  if (content.includes("from '@/lib/SyncEngine'") || content.includes('from "@/lib/SyncEngine"')) {
    content = content.replace(/from ['"]@\/lib\/SyncEngine['"]/g, 'from "@/core/sync/SyncEngine"');
    changes++;
  }
  
  // Actualizar imports de SyncManager
  if (content.includes("from '@/lib/SyncManager'") || content.includes('from "@/lib/SyncManager"')) {
    content = content.replace(/from ['"]@\/lib\/SyncManager['"]/g, 'from "@/core/sync/SyncManager"');
    changes++;
  }
  
  // Actualizar imports de SyncService
  if (content.includes("from '@/lib/SyncService'") || content.includes('from "@/lib/SyncService"')) {
    content = content.replace(/from ['"]@\/lib\/SyncService['"]/g, 'from "@/core/sync/SyncService"');
    changes++;
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changes;
}

async function main() {
  console.log('🔄 Actualizando imports de Sync services...\n');
  
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await updateSyncImports(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`✅ ${file}: ${changes} imports`);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos actualizados: ${totalFiles}`);
  console.log(`   Total de imports: ${totalChanges}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
