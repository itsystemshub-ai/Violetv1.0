import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

let replaceCount = 0;
let removeCount = 0;

function walkAndReplace(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walkAndReplace(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('@/features/')) {
          content = content.replace(/@\/features\//g, '@/modules/');
          fs.writeFileSync(fullPath, content, 'utf8');
          replaceCount++;
        }
      }
    }
  } catch(e) { /* ignore */ }
}

function removeLegacyFeatures() {
  const legacyDir = path.join(srcDir, 'features');
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
    removeCount++;
  }
}

walkAndReplace(srcDir);
removeLegacyFeatures();
console.log(`Replaced imports in ${replaceCount} files`);
console.log(`Removed legacy features dir: ${removeCount > 0}`);
