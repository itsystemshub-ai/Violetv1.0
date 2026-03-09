import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para actualizar imports de servicios de finance
 */

const srcDir = path.join(process.cwd(), 'src');

const replacements = [
  { from: /@\/lib\/WithholdingService/g, to: '@/modules/finance/services/withholding.service' },
  { from: /@\/lib\/ExchangeDifferenceService/g, to: '@/modules/finance/services/exchange-difference.service' },
  { from: /@\/lib\/AccountingService/g, to: '@/modules/finance/services/accounting.service' },
  { from: /@\/lib\/IGTFService/g, to: '@/modules/finance/services/igtf.service' },
  { from: /@\/lib\/LibroGeneratorService/g, to: '@/modules/finance/services/libro-generator.service' },
  { from: /@\/lib\/LedgerService/g, to: '@/modules/finance/services/ledger.service' },
  { from: /@\/lib\/ReconciliationService/g, to: '@/modules/finance/services/reconciliation.service' },
  { from: /@\/lib\/PayrollService/g, to: '@/modules/hr/services/payroll.service' },
];

function updateFinanceImports(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let hasChanges = false;

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      updated = updated.replace(from, to);
      hasChanges = true;
    }
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
      if (updateFinanceImports(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

console.log('🔧 Actualizando imports de servicios de finance...\n');
const updatedCount = processDirectory(srcDir);
console.log(`\n✨ Total de archivos actualizados: ${updatedCount}`);
