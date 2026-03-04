#!/usr/bin/env tsx
/**
 * Script para corregir lazy imports con rutas antiguas
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function fixLazyImports(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  const replacements = [
    { from: '@/components/Finance/', to: '@/modules/finance/components/' },
    { from: '@/components/Inventory/', to: '@/modules/inventory/components/' },
    { from: '@/components/Sales/', to: '@/modules/sales/components/' },
    { from: '@/components/HR/', to: '@/modules/hr/components/' },
    { from: '@/components/Dashboard/', to: '@/modules/dashboard/components/' },
    { from: '@/components/Purchases/', to: '@/modules/purchases/components/' },
    { from: '@/components/Settings/', to: '@/modules/settings/components/' },
    { from: '@/components/AccountsReceivable/', to: '@/modules/accounts-receivable/components/' }
  ];
  
  for (const { from, to } of replacements) {
    const regex = new RegExp(from.replace(/\//g, '\\/'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, to);
      changes++;
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changes;
}

async function main() {
  console.log('🔧 Corrigiendo lazy imports...\n');
  
  const files = await glob('src/features/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await fixLazyImports(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`✅ ${file}: ${changes} cambios`);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos corregidos: ${totalFiles}`);
  console.log(`   Total de cambios: ${totalChanges}`);
  console.log(`\n✅ Corrección completada!`);
}

main().catch(console.error);
