import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para actualizar imports en archivos de sync
 */

const files = [
  'src/core/sync/SyncService.ts',
  'src/core/sync/SyncEngine.ts',
  'src/core/sync/SyncManager.ts',
];

const replacements = [
  { from: /from ['"]\.\/localDb['"]/g, to: "from '@/core/database/localDb'" },
  { from: /from ['"]@\/hooks\/useNotificationStore['"]/g, to: "from '@/shared/hooks/useNotificationStore'" },
  { from: /from ['"]\.\/SyncEngine['"]/g, to: "from './SyncEngine'" },
  { from: /from ['"]\.\/SyncManager['"]/g, to: "from './SyncManager'" },
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
