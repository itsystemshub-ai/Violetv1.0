import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationRule {
  source: string;
  destination: string;
  updateImports?: boolean;
}

const migrationRules: MigrationRule[] = [
  // Backend - Finance Services
  {
    source: 'src/lib/AccountingService.ts',
    destination: 'backend/src/modules/finance/services/accounting.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/IGTFService.ts',
    destination: 'backend/src/modules/finance/services/igtf.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/WithholdingService.ts',
    destination: 'backend/src/modules/finance/services/withholding.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/LedgerService.ts',
    destination: 'backend/src/modules/finance/services/ledger.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/LibroGeneratorService.ts',
    destination: 'backend/src/modules/finance/services/libro-generator.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/ReconciliationService.ts',
    destination: 'backend/src/modules/finance/services/reconciliation.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/ExchangeDifferenceService.ts',
    destination: 'backend/src/modules/finance/services/exchange-difference.service.ts',
    updateImports: true
  },
  // Backend - HR Services
  {
    source: 'src/lib/PayrollService.ts',
    destination: 'backend/src/modules/hr/services/payroll.service.ts',
    updateImports: true
  },
  // Backend - Inventory Services
  {
    source: 'src/lib/ForecastingService.ts',
    destination: 'backend/src/modules/inventory/services/forecasting.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/barcodeService.ts',
    destination: 'backend/src/modules/inventory/services/barcode.service.ts',
    updateImports: true
  },
  // Backend - Sales Services
  {
    source: 'src/lib/LoyaltyService.ts',
    destination: 'backend/src/modules/sales/services/loyalty.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/invoiceExport.ts',
    destination: 'backend/src/modules/sales/services/invoice-export.service.ts',
    updateImports: true
  },
  // Backend - Core Services
  {
    source: 'src/lib/SyncEngine.ts',
    destination: 'backend/src/core/sync/sync-engine.ts',
    updateImports: true
  },
  {
    source: 'src/lib/SyncManager.ts',
    destination: 'backend/src/core/sync/sync-manager.ts',
    updateImports: true
  },
  {
    source: 'src/lib/SyncService.ts',
    destination: 'backend/src/core/sync/sync.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/groqService.ts',
    destination: 'backend/src/core/ai/groq.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/aiErrorHandler.ts',
    destination: 'backend/src/core/ai/ai-error-handler.ts',
    updateImports: true
  },
  // Backend - Infrastructure
  {
    source: 'src/lib/bcvService.ts',
    destination: 'backend/src/infrastructure/bcv/bcv.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/emailService.ts',
    destination: 'backend/src/infrastructure/email/email.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/whatsappService.ts',
    destination: 'backend/src/infrastructure/whatsapp/whatsapp.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/pdfUtils.ts',
    destination: 'backend/src/infrastructure/pdf/pdf-generator.service.ts',
    updateImports: true
  },
  {
    source: 'src/lib/weatherService.ts',
    destination: 'backend/src/infrastructure/weather/weather.service.ts',
    updateImports: true
  }
];

function moveFileWithGitHistory(source: string, destination: string): boolean {
  const destDir = path.dirname(destination);
  
  // Verificar si el archivo fuente existe
  if (!fs.existsSync(source)) {
    console.log(`⚠️  Skipped (not found): ${source}`);
    return false;
  }
  
  // Crear directorio destino si no existe
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Intentar mover con git primero, si falla usar fs
  try {
    execSync(`git mv "${source}" "${destination}"`, { stdio: 'pipe' });
    console.log(`✅ Moved (git): ${source} → ${destination}`);
    return true;
  } catch (error) {
    // Si git falla, usar fs.rename
    try {
      fs.renameSync(source, destination);
      console.log(`✅ Moved (fs): ${source} → ${destination}`);
      return true;
    } catch (fsError) {
      console.error(`❌ Error moving ${source}:`, fsError);
      return false;
    }
  }
}

function updateImportsInFile(filePath: string, oldPath: string, newPath: string) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const oldImport = oldPath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '');
  const newImport = newPath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '');
  
  // Actualizar imports relativos y absolutos
  const patterns = [
    new RegExp(`from ['"].*${path.basename(oldImport)}['"]`, 'g'),
    new RegExp(`from ['"]${oldImport}['"]`, 'g'),
    new RegExp(`import\\(['"].*${path.basename(oldImport)}['"]\\)`, 'g')
  ];
  
  let updated = false;
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match) => {
        updated = true;
        return match.replace(oldImport, newImport);
      });
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

function findAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

async function migrate() {
  console.log('🚀 Starting migration to modular architecture...\n');
  
  // Fase 1: Mover archivos
  console.log('📦 Phase 1: Moving files...\n');
  const movedFiles: MigrationRule[] = [];
  
  for (const rule of migrationRules) {
    if (moveFileWithGitHistory(rule.source, rule.destination)) {
      movedFiles.push(rule);
    }
  }
  
  console.log(`\n✅ Moved ${movedFiles.length} files successfully\n`);
  
  // Fase 2: Actualizar imports
  console.log('🔄 Phase 2: Updating imports...\n');
  const allFiles = [
    ...findAllTypeScriptFiles('src'),
    ...findAllTypeScriptFiles('backend/src')
  ];
  
  console.log(`Found ${allFiles.length} files to check for imports\n`);
  
  for (const rule of movedFiles) {
    if (rule.updateImports) {
      console.log(`Updating imports for: ${path.basename(rule.source)}`);
      let updatedCount = 0;
      
      for (const file of allFiles) {
        const beforeContent = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
        updateImportsInFile(file, rule.source, rule.destination);
        const afterContent = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
        
        if (beforeContent !== afterContent) {
          updatedCount++;
        }
      }
      
      console.log(`  Updated ${updatedCount} files`);
    }
  }
  
  console.log('\n✅ Migration completed!\n');
  console.log('⚠️  Next steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Run tests: npm test');
  console.log('3. Fix any remaining import issues');
  console.log('4. Commit changes: git commit -m "refactor: migrate to modular architecture"');
}

migrate().catch(console.error);
