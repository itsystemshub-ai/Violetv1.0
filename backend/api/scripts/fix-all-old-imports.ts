#!/usr/bin/env tsx
/**
 * Script para corregir TODOS los imports de rutas antiguas
 */

import * as fs from 'fs';
import { glob } from 'glob';

interface ImportFix {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const importFixes: ImportFix[] = [
  // Components antiguos
  {
    pattern: /from ['"]@\/components\/AccountsReceivable\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/accounts-receivable/components/$1"',
    description: 'AccountsReceivable components'
  },
  {
    pattern: /from ['"]@\/components\/Finance\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/finance/components/$1"',
    description: 'Finance components'
  },
  {
    pattern: /from ['"]@\/components\/Inventory\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/inventory/components/$1"',
    description: 'Inventory components'
  },
  {
    pattern: /from ['"]@\/components\/Sales\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/sales/components/$1"',
    description: 'Sales components'
  },
  {
    pattern: /from ['"]@\/components\/HR\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/hr/components/$1"',
    description: 'HR components'
  },
  {
    pattern: /from ['"]@\/components\/Dashboard\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/dashboard/components/$1"',
    description: 'Dashboard components'
  },
  {
    pattern: /from ['"]@\/components\/Purchases\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/purchases/components/$1"',
    description: 'Purchases components'
  },
  {
    pattern: /from ['"]@\/components\/Settings\/([^'"]+)['"]/g,
    replacement: 'from "@/modules/settings/components/$1"',
    description: 'Settings components'
  },
  // Lib imports
  {
    pattern: /from ['"]@\/lib\/([^'"]+)['"]/g,
    replacement: (match: string, p1: string) => {
      // Mapear archivos específicos de lib a sus nuevas ubicaciones
      const libMappings: Record<string, string> = {
        'localDb': '@/core/database/localDb',
        'SyncEngine': '@/core/sync/SyncEngine',
        'SyncManager': '@/core/sync/SyncManager',
        'SyncService': '@/core/sync/SyncService',
        'utils': '@/core/shared/utils/utils',
        'groqService': '@/core/ai/groq.service',
        'aiErrorHandler': '@/core/ai/ai-error-handler'
      };
      
      return libMappings[p1] ? `from "${libMappings[p1]}"` : match;
    },
    description: 'Lib imports'
  }
];

async function fixImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  for (const fix of importFixes) {
    const before = content;
    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement as any);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    if (content !== before) {
      changes++;
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changes;
}

async function main() {
  console.log('🔧 Corrigiendo todos los imports antiguos...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await fixImportsInFile(file);
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
