import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para actualizar imports de @/lib/security/ a @/core/security/security/
 */

const srcDir = path.join(process.cwd(), 'src');

function updateSecurityImports(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let hasChanges = false;

  // Actualizar imports de @/lib/security/ a @/core/security/security/
  const securityImportRegex = /@\/lib\/security\//g;
  if (securityImportRegex.test(content)) {
    updated = updated.replace(securityImportRegex, '@/core/security/security/');
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`✅ Actualizado: ${filePath}`);
    return true;
  }

  return false;
}

function processDirectory(dir: string): number {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        count += processDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      if (updateSecurityImports(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

console.log('🔧 Actualizando imports de security...\n');
const updatedCount = processDirectory(srcDir);
console.log(`\n✨ Total de archivos actualizados: ${updatedCount}`);
