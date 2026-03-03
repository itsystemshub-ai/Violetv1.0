#!/usr/bin/env tsx
/**
 * Script para actualizar imports después de la migración a arquitectura modular
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportMapping {
  old: RegExp;
  new: string;
  description: string;
}

const importMappings: ImportMapping[] = [
  // Hooks - Core
  {
    old: /from ['"]@\/hooks\/useAI['"]/g,
    new: 'from "@/core/ai/hooks/useAI"',
    description: 'useAI hook'
  },
  {
    old: /from ['"]@\/hooks\/useApi['"]/g,
    new: 'from "@/core/api/hooks/useApi"',
    description: 'useApi hook'
  },
  {
    old: /from ['"]@\/hooks\/useSecurity['"]/g,
    new: 'from "@/core/security/hooks/useSecurity"',
    description: 'useSecurity hook'
  },
  
  // Hooks - Core Shared
  {
    old: /from ['"]@\/hooks\/useDebounce['"]/g,
    new: 'from "@/core/shared/hooks/useDebounce"',
    description: 'useDebounce hook'
  },
  {
    old: /from ['"]@\/hooks\/usePagination['"]/g,
    new: 'from "@/core/shared/hooks/usePagination"',
    description: 'usePagination hook'
  },
  {
    old: /from ['"]@\/hooks\/useNetwork['"]/g,
    new: 'from "@/core/shared/hooks/useNetwork"',
    description: 'useNetwork hook'
  },
  {
    old: /from ['"]@\/hooks\/useZodForm['"]/g,
    new: 'from "@/core/shared/hooks/useZodForm"',
    description: 'useZodForm hook'
  },
  {
    old: /from ['"]@\/hooks\/use-toast['"]/g,
    new: 'from "@/core/shared/hooks/use-toast"',
    description: 'use-toast hook'
  },
  
  // Hooks - Modules
  {
    old: /from ['"]@\/hooks\/useSystemConfig['"]/g,
    new: 'from "@/modules/settings/hooks/useSystemConfig"',
    description: 'useSystemConfig hook'
  },
  {
    old: /from ['"]@\/hooks\/useUserManagement['"]/g,
    new: 'from "@/modules/settings/hooks/useUserManagement"',
    description: 'useUserManagement hook'
  },
  {
    old: /from ['"]@\/hooks\/useAudit['"]/g,
    new: 'from "@/modules/settings/hooks/useAudit"',
    description: 'useAudit hook'
  },
  {
    old: /from ['"]@\/hooks\/useExchangeDifference['"]/g,
    new: 'from "@/modules/finance/hooks/useExchangeDifference"',
    description: 'useExchangeDifference hook'
  },
  
  // Hooks - Shared
  {
    old: /from ['"]@\/hooks\/useTenant['"]/g,
    new: 'from "@/shared/hooks/useTenant"',
    description: 'useTenant hook'
  },
  {
    old: /from ['"]@\/hooks\/useNotificationStore['"]/g,
    new: 'from "@/shared/hooks/useNotificationStore"',
    description: 'useNotificationStore hook'
  },
  {
    old: /from ['"]@\/hooks\/useBroadcastNotifications['"]/g,
    new: 'from "@/shared/hooks/useBroadcastNotifications"',
    description: 'useBroadcastNotifications hook'
  },
  {
    old: /from ['"]@\/hooks\/useAddressSearch['"]/g,
    new: 'from "@/shared/hooks/useAddressSearch"',
    description: 'useAddressSearch hook'
  },
  {
    old: /from ['"]@\/hooks\/useImageConverter['"]/g,
    new: 'from "@/shared/hooks/useImageConverter"',
    description: 'useImageConverter hook'
  },
  {
    old: /from ['"]@\/hooks\/useInstanceStore['"]/g,
    new: 'from "@/shared/hooks/useInstanceStore"',
    description: 'useInstanceStore hook'
  },
  {
    old: /from ['"]@\/hooks\/useOptimizedSearch['"]/g,
    new: 'from "@/shared/hooks/useOptimizedSearch"',
    description: 'useOptimizedSearch hook'
  },
  
  // Components - Core Auth
  {
    old: /from ['"]@\/components\/ProtectedRoute['"]/g,
    new: 'from "@/core/auth/components/ProtectedRoute"',
    description: 'ProtectedRoute component'
  },
  {
    old: /from ['"]@\/components\/auth\/TwoFactorSetup['"]/g,
    new: 'from "@/core/auth/components/TwoFactorSetup"',
    description: 'TwoFactorSetup component'
  },
  {
    old: /from ['"]@\/components\/auth\/TwoFactorVerify['"]/g,
    new: 'from "@/core/auth/components/TwoFactorVerify"',
    description: 'TwoFactorVerify component'
  },
  
  // Components - Core AI
  {
    old: /from ['"]@\/components\/AIChat['"]/g,
    new: 'from "@/core/ai/components/AIChat"',
    description: 'AIChat component'
  },
  {
    old: /from ['"]@\/components\/AIAssistant['"]/g,
    new: 'from "@/core/ai/components"',
    description: 'AIAssistant components'
  },
  
  // Components - Core Sync
  {
    old: /from ['"]@\/components\/ConflictResolutionDialog['"]/g,
    new: 'from "@/core/sync/components/ConflictResolutionDialog"',
    description: 'ConflictResolutionDialog component'
  },
  
  // Components - Core Shared
  {
    old: /from ['"]@\/components\/OnlineStatusProvider['"]/g,
    new: 'from "@/core/shared/components/OnlineStatusProvider"',
    description: 'OnlineStatusProvider component'
  },
  {
    old: /from ['"]@\/components\/RealtimeBootstrap['"]/g,
    new: 'from "@/core/shared/components/RealtimeBootstrap"',
    description: 'RealtimeBootstrap component'
  },
  
  // Components - Shared Feedback
  {
    old: /from ['"]@\/components\/ErrorBoundary['"]/g,
    new: 'from "@/shared/components/feedback/ErrorBoundary"',
    description: 'ErrorBoundary component'
  },
  {
    old: /from ['"]@\/components\/OfflineBanner['"]/g,
    new: 'from "@/shared/components/feedback/OfflineBanner"',
    description: 'OfflineBanner component'
  },
  {
    old: /from ['"]@\/components\/SyncStatusIndicator['"]/g,
    new: 'from "@/shared/components/feedback/SyncStatusIndicator"',
    description: 'SyncStatusIndicator component'
  },
  {
    old: /from ['"]@\/components\/SkeletonLoaders['"]/g,
    new: 'from "@/shared/components/feedback/SkeletonLoaders"',
    description: 'SkeletonLoaders component'
  },
  
  // Components - Shared Common
  {
    old: /from ['"]@\/components\/CommandPalette['"]/g,
    new: 'from "@/shared/components/common/CommandPalette"',
    description: 'CommandPalette component'
  },
  {
    old: /from ['"]@\/components\/ThemeToggle['"]/g,
    new: 'from "@/shared/components/common/ThemeToggle"',
    description: 'ThemeToggle component'
  },
  {
    old: /from ['"]@\/components\/TenantSelector['"]/g,
    new: 'from "@/shared/components/common/TenantSelector"',
    description: 'TenantSelector component'
  },
  {
    old: /from ['"]@\/components\/PaginationControls['"]/g,
    new: 'from "@/shared/components/common/PaginationControls"',
    description: 'PaginationControls component'
  },
  {
    old: /from ['"]@\/components\/TenantBranding['"]/g,
    new: 'from "@/shared/components/common/TenantBranding"',
    description: 'TenantBranding component'
  },
  {
    old: /from ['"]@\/components\/Cards['"]/g,
    new: 'from "@/shared/components/common/Cards"',
    description: 'Cards component'
  },
  {
    old: /from ['"]@\/components\/Charts['"]/g,
    new: 'from "@/shared/components/common/Charts"',
    description: 'Charts component'
  },
  {
    old: /from ['"]@\/components\/Forms['"]/g,
    new: 'from "@/shared/components/common/Forms"',
    description: 'Forms component'
  },
  {
    old: /from ['"]@\/components\/StandardKPICard['"]/g,
    new: 'from "@/shared/components/common/StandardKPICard"',
    description: 'StandardKPICard component'
  },
  {
    old: /from ['"]@\/components\/ProductCards['"]/g,
    new: 'from "@/shared/components/common/ProductCards"',
    description: 'ProductCards component'
  },
  {
    old: /from ['"]@\/components\/VirtualizedProductList['"]/g,
    new: 'from "@/shared/components/common/VirtualizedProductList"',
    description: 'VirtualizedProductList component'
  },
  {
    old: /from ['"]@\/components\/ApiDataTable['"]/g,
    new: 'from "@/shared/components/common/ApiDataTable"',
    description: 'ApiDataTable component'
  },
  {
    old: /from ['"]@\/components\/ApiForm['"]/g,
    new: 'from "@/shared/components/common/ApiForm"',
    description: 'ApiForm component'
  },
  
  // Components - Shared Layout
  {
    old: /from ['"]@\/components\/Layout['"]/g,
    new: 'from "@/shared/components/layout/Layout"',
    description: 'Layout component'
  },
  {
    old: /from ['"]@\/components\/Sidebar['"]/g,
    new: 'from "@/shared/components/layout/Sidebar"',
    description: 'Sidebar component'
  },
  {
    old: /from ['"]@\/components\/Header['"]/g,
    new: 'from "@/shared/components/layout/Header"',
    description: 'Header component'
  },
  
  // Pages
  {
    old: /from ['"]@\/pages\/Settings['"]/g,
    new: 'from "@/modules/settings/pages/SettingsPage"',
    description: 'Settings page'
  },
  {
    old: /from ['"]@\/pages\/AccountsReceivable['"]/g,
    new: 'from "@/modules/accounts-receivable/pages/AccountsReceivablePage"',
    description: 'AccountsReceivable page'
  },
  {
    old: /from ['"]@\/pages\/InvoicePreview['"]/g,
    new: 'from "@/modules/sales/pages/InvoicePreviewPage"',
    description: 'InvoicePreview page'
  },
  {
    old: /from ['"]@\/pages\/ConnectivityError['"]/g,
    new: 'from "@/shared/pages/ConnectivityError"',
    description: 'ConnectivityError page'
  },
  {
    old: /from ['"]@\/pages\/Unauthorized['"]/g,
    new: 'from "@/shared/pages/Unauthorized"',
    description: 'Unauthorized page'
  },
  {
    old: /from ['"]@\/pages\/Todos['"]/g,
    new: 'from "@/shared/pages/Todos"',
    description: 'Todos page'
  },
  {
    old: /from ['"]@\/pages\/not-found\/Index['"]/g,
    new: 'from "@/shared/pages/not-found/Index"',
    description: 'NotFound page'
  },
  
  // Components - Settings (old paths)
  {
    old: /from ['"]@\/components\/Settings\/BackupSettings['"]/g,
    new: 'from "@/modules/settings/components/BackupSettings"',
    description: 'BackupSettings component'
  },
];

async function updateImportsInFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changesCount = 0;
  
  for (const mapping of importMappings) {
    if (mapping.old.test(content)) {
      content = content.replace(mapping.old, mapping.new);
      changesCount++;
    }
  }
  
  if (changesCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return changesCount;
}

async function main() {
  console.log('🔄 Actualizando imports...\n');
  
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
  });
  
  let totalFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    const changes = await updateImportsInFile(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`✅ ${file}: ${changes} imports actualizados`);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos actualizados: ${totalFiles}`);
  console.log(`   Total de imports actualizados: ${totalChanges}`);
  console.log(`\n✅ Actualización completada!`);
}

main().catch(console.error);
