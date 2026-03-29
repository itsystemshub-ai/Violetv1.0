import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

const CONFIG = {
  junkFiles: [
    'temp-ar.txt', 'temp-dashboard.txt', 'temp-finance.txt', 
    'temp-hr.txt', 'temp-inventory.txt', 'temp-purchases.txt', 
    'temp-sales.txt', 'ValeryProVenBuild7177a.exe'
  ],
  moves: [
    { from: 'backend', to: 'src/infrastructure/server' },
    { from: 'server', to: 'src/infrastructure/proxy' },
  ],
  featureMigration: [
    'ai', 'auth', 'crm', 'currencies', 'dashboard', 'finance', 
    'hr', 'inventory', 'purchases', 'reports', 'sales', 'settings'
  ]
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function moveFolder(from: string, to: string) {
  const sourcePath = path.resolve(ROOT, from);
  const destPath = path.resolve(ROOT, to);

  if (!fs.existsSync(sourcePath)) {
    console.log(`Skipping move: ${from} (not found)`);
    return;
  }

  ensureDir(path.dirname(destPath));

  try {
    // fs.renameSync can fail across partitions, but here it's likely safe.
    // However, if the destination exists, we might need to merge or delete it.
    if (fs.existsSync(destPath)) {
       console.log(`Merging ${from} into ${to}...`);
       mergeRecursive(sourcePath, destPath);
       fs.rmSync(sourcePath, { recursive: true, force: true });
    } else {
       fs.renameSync(sourcePath, destPath);
    }
    console.log(`Successfully moved ${from} to ${to}`);
  } catch (err) {
    console.error(`Error moving ${from}:`, err);
  }
}

function mergeRecursive(src: string, dest: string) {
  ensureDir(dest);
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      mergeRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateImports(rootDir: string) {
    console.log(`\n🔄 Updating imports in ${rootDir}...`);
    const files = findAllFiles(rootDir, /\.(ts|tsx|js|jsx)$/);
    console.log(`Found ${files.length} files to update.`);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let updated = false;

        // Replace @/features/ with @/modules/
        if (content.includes('@/features/')) {
            content = content.replace(/@\/features\//g, '@/modules/');
            updated = true;
        }

        // Replace relative imports to features
        // This is tricky, but we can try to find and replace
        const relativePattern = /from\s+['"]\.\.\/features\//g;
        if (relativePattern.test(content)) {
            content = content.replace(relativePattern, "from '../modules/");
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(file, content);
            // console.log(`Updated imports in: ${path.relative(ROOT, file)}`);
        }
    }
}

function findAllFiles(dir: string, pattern: RegExp): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findAllFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

async function main() {
  console.log('🚀 Starting Master Restructuring...\n');

  // 1. Root Cleanup
  console.log('🧹 Cleaning up root junk...');
  for (const file of CONFIG.junkFiles) {
    const p = path.join(ROOT, file);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { force: true, recursive: true });
      console.log(`Removed: ${file}`);
    }
  }

  // 2. Move Infrastructure
  console.log('\n📦 Relocating infrastructure...');
  for (const item of CONFIG.moves) {
    moveFolder(item.from, item.to);
  }

  // 3. Move Features to Modules
  console.log('\n🧩 Migrating features to modules...');
  for (const feat of CONFIG.featureMigration) {
    moveFolder(`src/features/${feat}`, `src/modules/${feat}`);
  }

  // Delete empty features folder
  const featuresPath = path.join(ROOT, 'src/features');
  if (fs.existsSync(featuresPath) && fs.readdirSync(featuresPath).length === 0) {
    fs.rmSync(featuresPath, { recursive: true });
    console.log('Removed empty src/features directory.');
  }

  // 4. Update Imports
  updateImports(path.join(ROOT, 'src'));

  console.log('\n✨ Master Restructuring Complete!');
  console.log('Please run "npm run typecheck" to verify results.');
}

main().catch(console.error);
