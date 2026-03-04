#!/usr/bin/env tsx
/**
 * Script para corregir comillas mal cerradas en imports
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function fixQuotesInFile(filePath: string): Promise<boolean> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Corregir imports con comillas mal cerradas
  const badQuotePattern = /from ["']@\/shared\/components\/ui\/([^"']+)'/g;
  if (badQuotePattern.test(content)) {
    content = content.replace(badQuotePattern, 'from "@/shared/components/ui/$1"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changed;
}

async function main() {
  console.log('🔧 Corrigiendo comillas en imports...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  
  for (const file of files) {
    const changed = await fixQuotesInFile(file);
    if (changed) {
      totalFiles++;
      console.log(`✅ ${file}`);
    }
  }
  
  console.log(`\n📊 Archivos corregidos: ${totalFiles}`);
  console.log(`\n✅ Corrección completada!`);
}

main().catch(console.error);
