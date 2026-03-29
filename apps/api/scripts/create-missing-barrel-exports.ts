import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para crear barrel exports faltantes en carpetas vacías
 */

const modulesDir = path.join(process.cwd(), 'src/modules');
const modules = ['sales', 'finance', 'inventory', 'hr', 'purchases', 'accounts-receivable', 'settings'];
const subfolders = ['hooks', 'services', 'types', 'pages'];

let count = 0;

for (const module of modules) {
  for (const subfolder of subfolders) {
    const folderPath = path.join(modulesDir, module, subfolder);
    const indexPath = path.join(folderPath, 'index.ts');
    
    if (fs.existsSync(folderPath) && !fs.existsSync(indexPath)) {
      // Verificar si la carpeta tiene archivos
      const files = fs.readdirSync(folderPath);
      
      if (files.length === 0) {
        // Carpeta vacía, crear index.ts vacío
        fs.writeFileSync(indexPath, '// Empty barrel export\n', 'utf-8');
        console.log(`✅ Creado index vacío: ${module}/${subfolder}/index.ts`);
        count++;
      } else {
        // Carpeta con archivos, crear barrel export
        const exports = files
          .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
          .filter(f => f !== 'index.ts')
          .map(f => {
            const name = f.replace(/\.(ts|tsx)$/, '');
            return `export * from './${name}';`;
          })
          .join('\n');
        
        if (exports) {
          fs.writeFileSync(indexPath, exports + '\n', 'utf-8');
          console.log(`✅ Creado barrel export: ${module}/${subfolder}/index.ts`);
          count++;
        }
      }
    }
  }
}

console.log(`\n✨ Total de index.ts creados: ${count}`);
