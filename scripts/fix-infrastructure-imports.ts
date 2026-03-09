#!/usr/bin/env tsx
/**
 * Script para actualizar imports de servicios de infraestructura
 */

import * as fs from 'fs';
import { glob } from 'glob';

async function fixInfrastructureImports(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  const replacements = [
    {
      from: /from ['"]@\/lib\/weatherService['"]/g,
      to: 'from "@/infrastructure/weather/weather.service"'
    },
    {
      from: /from ['"]@\/lib\/bcvService['"]/g,
      to: 'from "@/infrastructure/bcv/bcv.service"'
    },
    {
      from: /from ['"]@\/lib\/pdfUtils['"]/g,
      to: 'from "@/infrastructure/pdf/pdf-utils"'
    },
    {
      from: /from ['"]@\/lib\/exportUtils['"]/g,
      to: 'from "@/infrastructure/export/export-utils"'
    },
    {
      from: /from ['"]@\/lib\/emailService['"]/g,
      to: 'from "@/infrastructure/email/email.service"'
    },
    {
      from: /from ['"]@\/lib\/whatsappService['"]/g,
      to: 'from "@/infrastructure/whatsapp/whatsapp.service"'
    }
  ];
  
  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changes++;
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changes;
}

async function main() {
  console.log('🔧 Actualizando imports de infraestructura...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await fixInfrastructureImports(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`✅ ${file}: ${changes} cambios`);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos actualizados: ${totalFiles}`);
  console.log(`   Total de cambios: ${totalChanges}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
