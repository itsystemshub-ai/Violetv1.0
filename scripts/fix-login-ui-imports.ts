import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para actualizar imports de UI en componentes de Login
 */

const files = [
  'src/core/auth/components/LoginForm.tsx',
  'src/core/auth/components/BrandingSection.tsx',
  'src/core/auth/components/LegalDialogs.tsx',
];

const replacements = [
  { from: /@\/components\/ui\//g, to: '@/shared/components/ui/' },
];

let totalCount = 0;

for (const filePath of files) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let hasChanges = false;

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Actualizado: ${filePath}`);
    totalCount++;
  }
}

console.log(`\n✨ Total de archivos actualizados: ${totalCount}`);
