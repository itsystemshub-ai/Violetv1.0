#!/usr/bin/env tsx
/**
 * Script para actualizar imports de localDb a la nueva ubicación
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function updateLocalDbImports(filePath: string): Promise<boolean> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Actualizar import de localDb
  if (content.includes("from '@/lib/localDb'") || content.includes('from "@/lib/localDb"')) {
    content = content.replace(/from ['"]@\/lib\/localDb['"]/g, 'from "@/core/database/localDb"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changed;
}

async function main() {
  console.log('🔄 Actualizando imports de localDb...\n');
  
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  
  for (const file of files) {
    const changed = await updateLocalDbImports(file);
    if (changed) {
      totalFiles++;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n📊 Archivos actualizados: ${totalFiles}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
