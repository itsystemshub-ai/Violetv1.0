#!/usr/bin/env tsx
/**
 * Script para actualizar imports de utils a la nueva ubicación
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function updateUtilsImports(filePath: string): Promise<boolean> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Actualizar import de utils
  if (content.includes("from '@/lib/utils'") || content.includes('from "@/lib/utils"')) {
    content = content.replace(/from ['"]@\/lib\/utils['"]/g, 'from "@/core/shared/utils/utils"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changed;
}

async function main() {
  console.log('🔄 Actualizando imports de utils...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  
  for (const file of files) {
    const changed = await updateUtilsImports(file);
    if (changed) {
      totalFiles++;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n📊 Archivos actualizados: ${totalFiles}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
