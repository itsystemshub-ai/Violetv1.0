#!/usr/bin/env tsx
/**
 * Script para actualizar imports de componentes UI a shared
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function updateUIImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changesCount = 0;
  
  // Actualizar imports de @/components/ui/* a @/shared/components/ui/*
  const uiImportRegex = /from ['"]@\/components\/ui\//g;
  if (uiImportRegex.test(content)) {
    content = content.replace(uiImportRegex, 'from "@/shared/components/ui/');
    changesCount++;
  }
  
  if (changesCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changesCount;
}

async function main() {
  console.log('🔄 Actualizando imports de UI components...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await updateUIImportsInFile(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos actualizados: ${totalFiles}`);
  console.log(`   Total de imports actualizados: ${totalChanges}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
