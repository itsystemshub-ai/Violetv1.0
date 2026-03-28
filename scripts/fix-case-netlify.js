import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const dirsToFix = [
  'src/modules/finance/components',
  'src/modules/dashboard/components',
  'src/modules/inventory/components',
  'src/modules/purchases/components',
  'src/shared/components/layout/Layout',
  'src/modules/settings/components'
];

const folders = ['Atoms', 'Molecules', 'Organisms'];

console.log('--- Case Sensitivity Fix for Netlify ---');

dirsToFix.forEach(baseDir => {
  const fullBaseDir = path.join(root, baseDir);
  if (!fs.existsSync(fullBaseDir)) return;

  folders.forEach(folder => {
    const oldPath = path.join(fullBaseDir, folder);
    const newPath = path.join(fullBaseDir, folder.toLowerCase());

    // On case-sensitive systems (Linux/Netlify), these are different.
    // On Windows, they are the same, so we must be careful.
    if (fs.existsSync(oldPath) && oldPath !== newPath) {
      console.log(`Renaming ${oldPath} -> ${newPath}`);
      try {
        // To handle Windows (where ren Organisms organisms might fail if they are "same")
        // we use a temporary name.
        const tempPath = oldPath + '_temp_' + Date.now();
        fs.renameSync(oldPath, tempPath);
        fs.renameSync(tempPath, newPath);
      } catch (err) {
        console.error(`Failed to rename ${oldPath}:`, err.message);
      }
    }
  });

  // Also fix flat files in finance/components if any duplicates exist
  if (baseDir === 'src/modules/finance/components') {
    const filesToClean = [
      'CxCManager.tsx', 'FinanceDashboard.tsx', 'FinanceHeader.tsx', 
      'FinanceKPIs.tsx', 'FinanceReports.tsx', 'IGTFManager.tsx', 
      'LedgerManager.tsx', 'LibroManager.tsx', 'ReconciliationManager.tsx'
    ];
    filesToClean.forEach(file => {
      const filePath = path.join(fullBaseDir, file);
      const modularPath = path.join(fullBaseDir, 'organisms', file);
      if (fs.existsSync(filePath) && fs.existsSync(modularPath)) {
        console.log(`Deleting duplicate legacy file: ${filePath}`);
        fs.unlinkSync(filePath);
      }
    });
  }
});

console.log('--- Case Fix Completed ---');
