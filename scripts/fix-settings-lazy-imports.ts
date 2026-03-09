import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para actualizar lazy imports de Settings
 */

const filePath = path.join(process.cwd(), 'src/modules/settings/pages/SettingsPage.tsx');

const replacements = [
  { from: '@/components/Settings/Organisms/CompanyFiscalPanel', to: '@/modules/settings/components/organisms/CompanyFiscalPanel' },
  { from: '@/components/Settings/Organisms/UserManagementPanel', to: '@/modules/settings/components/organisms/UserManagementPanel' },
  { from: '@/components/Settings/Organisms/AIChatPanel', to: '@/modules/settings/components/organisms/AIChatPanel' },
  { from: '@/components/Settings/Organisms/SecurityAuditPanel', to: '@/modules/settings/components/organisms/SecurityAuditPanel' },
  { from: '@/components/Settings/Organisms/SystemMonitorPanel', to: '@/modules/settings/components/organisms/SystemMonitorPanel' },
  { from: '@/components/Settings/Organisms/ActivityLogPanel', to: '@/modules/settings/components/organisms/ActivityLogPanel' },
];

let content = fs.readFileSync(filePath, 'utf-8');
let count = 0;

for (const { from, to } of replacements) {
  if (content.includes(from)) {
    content = content.replace(new RegExp(from, 'g'), to);
    count++;
    console.log(`✅ Actualizado: ${from} → ${to}`);
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`\n✨ Total de imports actualizados: ${count}`);
