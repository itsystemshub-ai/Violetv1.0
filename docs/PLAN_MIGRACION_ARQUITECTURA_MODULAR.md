# Plan de Migración: Arquitectura de Módulos Verticales
## Violet ERP - Clean Architecture + Local-First

---

## 📋 Resumen Ejecutivo

Este documento define la estrategia de migración de Violet ERP desde una arquitectura horizontal fragmentada hacia una **Arquitectura de Módulos Verticales** basada en **Clean Architecture** y principios **Local-First**.

### Problemas Actuales Identificados:

1. **Fragmentación de Lógica**: Componentes, hooks, servicios y tipos dispersos en carpetas horizontales
2. **Inconsistencia de Lenguaje**: Mezcla de `.js` y `.ts` en backend
3. **Servicios Desacoplados**: Lógica de negocio crítica en `/lib` sin contexto de dominio
4. **Duplicidad**: Componentes en `/components/Finance` y páginas en `/pages/Finance.tsx`
5. **Microservicios Huérfanos**: Servicios en `/services/microservices` sin integración clara

### Objetivos de la Reorganización:

✅ **Cohesión por Dominio**: Todo lo relacionado con un módulo en una sola carpeta  
✅ **Estandarización TypeScript**: Migrar todo el backend a TypeScript  
✅ **Consolidación de Servicios**: Integrar servicios de `/lib` en sus dominios correspondientes  
✅ **Local-First Transversal**: `SyncEngine`, `localDb` y `SyncManager` como servicios core  
✅ **Eliminación de Duplicidad**: Unificar componentes y páginas por módulo

---

## 🏗️ Nueva Estructura Propuesta


```
violet-erp/
│
├── electron/                          # Proceso principal Electron (sin cambios)
│   ├── main.cjs
│   ├── preload.cjs
│   ├── db.cjs
│   └── splash.html
│
├── backend/                           # Backend Node.js (MIGRAR A TYPESCRIPT)
│   ├── server.ts                      # ⭐ Servidor unificado (migrar de .js a .ts)
│   ├── package.json
│   └── src/
│       ├── core/                      # ⭐ NUEVO: Servicios transversales
│       │   ├── database/
│       │   │   ├── connection.ts
│       │   │   └── migrations/
│       │   ├── auth/
│       │   │   ├── jwt.service.ts
│       │   │   ├── auth.middleware.ts
│       │   │   └── permissions.service.ts
│       │   ├── sync/
│       │   │   ├── sync.service.ts
│       │   │   └── conflict-resolution.ts
│       │   ├── ai/
│       │   │   ├── groq.service.ts
│       │   │   └── ai-error-handler.ts
│       │   └── shared/
│       │       ├── logger.ts
│       │       ├── error-handler.ts
│       │       └── rate-limiter.ts
│       │
│       ├── modules/                   # ⭐ NUEVO: Módulos verticales
│       │   ├── finance/
│       │   │   ├── controllers/
│       │   │   │   ├── ledger.controller.ts
│       │   │   │   ├── igtf.controller.ts
│       │   │   │   └── reconciliation.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── accounting.service.ts
│       │   │   │   ├── igtf.service.ts
│       │   │   │   ├── withholding.service.ts
│       │   │   │   ├── ledger.service.ts
│       │   │   │   ├── libro-generator.service.ts
│       │   │   │   ├── reconciliation.service.ts
│       │   │   │   └── exchange-difference.service.ts
│       │   │   ├── routes/
│       │   │   │   └── finance.routes.ts
│       │   │   ├── models/
│       │   │   │   └── finance.model.ts
│       │   │   └── types/
│       │   │       └── finance.types.ts
│       │   │
│       │   ├── inventory/
│       │   │   ├── controllers/
│       │   │   │   ├── products.controller.ts
│       │   │   │   └── stock.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── inventory.service.ts
│       │   │   │   ├── barcode.service.ts
│       │   │   │   └── forecasting.service.ts
│       │   │   ├── routes/
│       │   │   │   └── inventory.routes.ts
│       │   │   ├── models/
│       │   │   │   └── inventory.model.ts
│       │   │   └── types/
│       │   │       └── inventory.types.ts
│       │   │
│       │   ├── sales/
│       │   │   ├── controllers/
│       │   │   │   ├── invoices.controller.ts
│       │   │   │   └── pos.controller.ts
│       │   │   ├── services/
│       │   │   │   ├── sales.service.ts
│       │   │   │   ├── loyalty.service.ts
│       │   │   │   └── invoice-export.service.ts
│       │   │   ├── routes/
│       │   │   │   └── sales.routes.ts
│       │   │   ├── models/
│       │   │   │   └── sales.model.ts
│       │   │   └── types/
│       │   │       └── sales.types.ts
│       │   │
│       │   ├── hr/
│       │   │   ├── controllers/
│       │   │   │   ├── employees.controller.ts
│       │   │   │   └── payroll.controller.ts
│       │   │   ├── services/
│       │   │   │   └── payroll.service.ts
│       │   │   ├── routes/
│       │   │   │   └── hr.routes.ts
│       │   │   ├── models/
│       │   │   │   └── hr.model.ts
│       │   │   └── types/
│       │   │       └── hr.types.ts
│       │   │
│       │   ├── purchases/
│       │   │   ├── controllers/
│       │   │   ├── services/
│       │   │   ├── routes/
│       │   │   ├── models/
│       │   │   └── types/
│       │   │
│       │   └── accounts-receivable/
│       │       ├── controllers/
│       │       │   └── cxc.controller.ts
│       │       ├── services/
│       │       │   └── cxc.service.ts
│       │       ├── routes/
│       │       │   └── cxc.routes.ts
│       │       ├── models/
│       │       │   └── cxc.model.ts
│       │       └── types/
│       │           └── cxc.types.ts
│       │
│       └── infrastructure/             # ⭐ NUEVO: Servicios de infraestructura
│           ├── bcv/
│           │   └── bcv.service.ts     # Integrar bcv-exchange-rates
│           ├── email/
│           │   └── email.service.ts
│           ├── whatsapp/
│           │   └── whatsapp.service.ts
│           ├── pdf/
│           │   └── pdf-generator.service.ts
│           └── weather/
│               └── weather.service.ts
│
├── src/                               # Frontend React (REORGANIZAR)
│   ├── app/
│   │   ├── main.tsx                   # Punto de entrada
│   │   └── App.tsx                    # Configuración de rutas
│   │
│   ├── core/                          # ⭐ NUEVO: Servicios core del frontend
│   │   ├── auth/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── two-factor.service.ts
│   │   │   ├── components/
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── TwoFactorSetup.tsx
│   │   │   │   └── TwoFactorVerify.tsx
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── database/
│   │   │   ├── localDb.ts             # Dexie (IndexedDB)
│   │   │   ├── schemas/
│   │   │   │   ├── product.schema.ts
│   │   │   │   ├── invoice.schema.ts
│   │   │   │   ├── employee.schema.ts
│   │   │   │   └── user.schema.ts
│   │   │   └── migrations/
│   │   │
│   │   ├── sync/
│   │   │   ├── SyncEngine.ts          # Motor de sincronización
│   │   │   ├── SyncManager.ts
│   │   │   ├── SyncService.ts
│   │   │   ├── conflict-resolution.ts
│   │   │   └── hooks/
│   │   │       └── useSync.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── services/
│   │   │   │   ├── groq.service.ts
│   │   │   │   └── ai-error-handler.ts
│   │   │   ├── hooks/
│   │   │   │   └── useAI.ts
│   │   │   └── components/
│   │   │       ├── AIChat.tsx
│   │   │       └── ModuleAIAssistant.tsx
│   │   │
│   │   ├── security/
│   │   │   ├── encryption.ts
│   │   │   ├── jwt.ts
│   │   │   ├── password-hash.ts
│   │   │   ├── permissions.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── sanitization.ts
│   │   │   └── hooks/
│   │   │       └── useSecurity.ts
│   │   │
│   │   ├── api/
│   │   │   ├── api-gateway.ts         # BFF/Gateway
│   │   │   ├── api.service.ts
│   │   │   └── hooks/
│   │   │       └── useApi.ts
│   │   │
│   │   └── shared/
│   │       ├── utils/
│   │       │   ├── utils.ts
│   │       │   ├── validators.ts
│   │       │   ├── formatters.ts
│   │       │   └── error-handler.ts
│   │       ├── hooks/
│   │       │   ├── useDebounce.ts
│   │       │   ├── usePagination.ts
│   │       │   ├── useNetwork.ts
│   │       │   └── useZodForm.ts
│   │       ├── services/
│   │       │   ├── analytics.ts
│   │       │   ├── logger.ts
│   │       │   └── notification.service.ts
│   │       └── constants/
│   │           ├── constants.ts
│   │           └── feature-flags.ts
│   │
│   ├── modules/                       # ⭐ NUEVO: Módulos verticales del frontend
│   │   ├── finance/
│   │   │   ├── components/
│   │   │   │   ├── FinanceDashboard.tsx
│   │   │   │   ├── FinanceHeader.tsx
│   │   │   │   ├── FinanceKPIs.tsx
│   │   │   │   ├── LedgerManager.tsx
│   │   │   │   ├── IGTFManager.tsx
│   │   │   │   ├── LibroManager.tsx
│   │   │   │   ├── ReconciliationManager.tsx
│   │   │   │   ├── CxCManager.tsx
│   │   │   │   └── atoms/
│   │   │   │       └── [componentes atómicos]
│   │   │   ├── hooks/
│   │   │   │   ├── useFinance.ts
│   │   │   │   ├── useLedger.ts
│   │   │   │   ├── useIGTF.ts
│   │   │   │   └── useExchangeDifference.ts
│   │   │   ├── services/
│   │   │   │   ├── accounting.service.ts
│   │   │   │   ├── igtf.service.ts
│   │   │   │   ├── withholding.service.ts
│   │   │   │   ├── ledger.service.ts
│   │   │   │   ├── libro-generator.service.ts
│   │   │   │   ├── reconciliation.service.ts
│   │   │   │   └── exchange-difference.service.ts
│   │   │   ├── pages/
│   │   │   │   ├── FinancePage.tsx
│   │   │   │   ├── LedgerPage.tsx
│   │   │   │   └── ReportsPage.tsx
│   │   │   ├── types/
│   │   │   │   └── finance.types.ts
│   │   │   └── index.ts               # Barrel export
│   │   │
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   │   ├── InventoryTable.tsx
│   │   │   │   ├── InventoryHeader.tsx
│   │   │   │   ├── InventoryKPIs.tsx
│   │   │   │   ├── InventoryAnalytics.tsx
│   │   │   │   ├── InventoryDialogs.tsx
│   │   │   │   ├── InventoryAIPanel.tsx
│   │   │   │   ├── CatalogTable.tsx
│   │   │   │   ├── StockHistory.tsx
│   │   │   │   └── StockAlerts.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useInventory.ts
│   │   │   │   ├── useProducts.ts
│   │   │   │   └── useStock.ts
│   │   │   ├── services/
│   │   │   │   ├── inventory.service.ts
│   │   │   │   ├── barcode.service.ts
│   │   │   │   └── forecasting.service.ts
│   │   │   ├── pages/
│   │   │   │   ├── InventoryPage.tsx
│   │   │   │   └── CatalogPage.tsx
│   │   │   ├── types/
│   │   │   │   └── inventory.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── sales/
│   │   │   ├── components/
│   │   │   │   ├── SalesPOS.tsx
│   │   │   │   ├── SalesCart.tsx
│   │   │   │   ├── SalesHistory.tsx
│   │   │   │   ├── SalesKPIs.tsx
│   │   │   │   ├── InvoiceRow.tsx
│   │   │   │   ├── EntityDialog.tsx
│   │   │   │   ├── PaymentDialog.tsx
│   │   │   │   └── ReportDialog.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSales.ts
│   │   │   │   ├── useInvoices.ts
│   │   │   │   └── usePOS.ts
│   │   │   ├── services/
│   │   │   │   ├── sales.service.ts
│   │   │   │   ├── loyalty.service.ts
│   │   │   │   └── invoice-export.service.ts
│   │   │   ├── pages/
│   │   │   │   ├── SalesPage.tsx
│   │   │   │   ├── POSPage.tsx
│   │   │   │   └── InvoicePreviewPage.tsx
│   │   │   ├── types/
│   │   │   │   └── sales.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── hr/
│   │   │   ├── components/
│   │   │   │   ├── EmployeeDirectory.tsx
│   │   │   │   ├── EmployeeCard.tsx
│   │   │   │   ├── HRHeader.tsx
│   │   │   │   ├── HRKPIs.tsx
│   │   │   │   ├── PayrollManager.tsx
│   │   │   │   ├── VacacionesManager.tsx
│   │   │   │   └── PrestacionesManager.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useHR.ts
│   │   │   │   ├── useEmployees.ts
│   │   │   │   └── usePayroll.ts
│   │   │   ├── services/
│   │   │   │   └── payroll.service.ts
│   │   │   ├── pages/
│   │   │   │   ├── HRPage.tsx
│   │   │   │   └── EmployeesPage.tsx
│   │   │   ├── types/
│   │   │   │   └── hr.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── purchases/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── accounts-receivable/
│   │   │   ├── components/
│   │   │   │   └── PaymentDialog.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCxC.ts
│   │   │   ├── services/
│   │   │   │   └── cxc.service.ts
│   │   │   ├── pages/
│   │   │   │   └── AccountsReceivablePage.tsx
│   │   │   ├── types/
│   │   │   │   └── cxc.types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── dashboard/
│   │       ├── components/
│   │       │   └── DashboardOverview.tsx
│   │       ├── pages/
│   │       │   └── DashboardPage.tsx
│   │       └── index.ts
│   │
│   ├── infrastructure/                # ⭐ NUEVO: Servicios de infraestructura
│   │   ├── bcv/
│   │   │   └── bcv.service.ts        # Integrar bcv-exchange-rates
│   │   ├── currency/
│   │   │   └── currency.service.ts
│   │   ├── email/
│   │   │   └── email.service.ts
│   │   ├── whatsapp/
│   │   │   └── whatsapp.service.ts
│   │   ├── pdf/
│   │   │   ├── pdf-utils.ts
│   │   │   └── invoice-export.ts
│   │   ├── export/
│   │   │   └── export-utils.ts
│   │   └── weather/
│   │       └── weather.service.ts
│   │
│   ├── shared/                        # Componentes UI genéricos
│   │   ├── components/
│   │   │   ├── ui/                    # Radix UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── [otros componentes UI]
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── OfflineBanner.tsx
│   │   │   │   ├── SyncStatusIndicator.tsx
│   │   │   │   └── SkeletonLoaders.tsx
│   │   │   └── common/
│   │   │       ├── CommandPalette.tsx
│   │   │       ├── ThemeToggle.tsx
│   │   │       ├── TenantSelector.tsx
│   │   │       └── PaginationControls.tsx
│   │   └── contexts/
│   │       └── ThemeContext.tsx
│   │
│   ├── config/
│   │   ├── constants.ts
│   │   ├── feature-flags.ts
│   │   └── sentry.ts
│   │
│   └── types/
│       ├── api.types.ts               # Tipos compartidos de API
│       ├── database.types.ts          # Tipos de base de datos
│       └── sync.types.ts              # Tipos de sincronización
│
├── bcv-exchange-rates/                # Microservicio externo (mantener separado)
│   └── [estructura actual]
│
├── scripts/                           # Scripts de utilidad
│   ├── fix-electron-html.cjs
│   └── migrate-to-modules.ts          # ⭐ NUEVO: Script de migración
│
└── [archivos de configuración]
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── ...
```

---


## 📊 Mapa de Migración de Archivos

### 1. Backend: Migración de Servicios de `/lib` a Módulos

| Archivo Actual | Módulo Destino | Ruta Nueva |
|----------------|----------------|------------|
| `lib/AccountingService.ts` | Finance | `backend/src/modules/finance/services/accounting.service.ts` |
| `lib/IGTFService.ts` | Finance | `backend/src/modules/finance/services/igtf.service.ts` |
| `lib/WithholdingService.ts` | Finance | `backend/src/modules/finance/services/withholding.service.ts` |
| `lib/LedgerService.ts` | Finance | `backend/src/modules/finance/services/ledger.service.ts` |
| `lib/LibroGeneratorService.ts` | Finance | `backend/src/modules/finance/services/libro-generator.service.ts` |
| `lib/ReconciliationService.ts` | Finance | `backend/src/modules/finance/services/reconciliation.service.ts` |
| `lib/ExchangeDifferenceService.ts` | Finance | `backend/src/modules/finance/services/exchange-difference.service.ts` |
| `lib/PayrollService.ts` | HR | `backend/src/modules/hr/services/payroll.service.ts` |
| `lib/ForecastingService.ts` | Inventory | `backend/src/modules/inventory/services/forecasting.service.ts` |
| `lib/barcodeService.ts` | Inventory | `backend/src/modules/inventory/services/barcode.service.ts` |
| `lib/LoyaltyService.ts` | Sales | `backend/src/modules/sales/services/loyalty.service.ts` |
| `lib/invoiceExport.ts` | Sales | `backend/src/modules/sales/services/invoice-export.service.ts` |

### 2. Backend: Servicios Core (Transversales)

| Archivo Actual | Destino | Ruta Nueva |
|----------------|---------|------------|
| `lib/SyncEngine.ts` | Core Sync | `backend/src/core/sync/sync-engine.ts` |
| `lib/SyncManager.ts` | Core Sync | `backend/src/core/sync/sync-manager.ts` |
| `lib/SyncService.ts` | Core Sync | `backend/src/core/sync/sync.service.ts` |
| `lib/localDb.ts` | Core Database | `backend/src/core/database/local-db.ts` |
| `lib/groqService.ts` | Core AI | `backend/src/core/ai/groq.service.ts` |
| `lib/aiErrorHandler.ts` | Core AI | `backend/src/core/ai/ai-error-handler.ts` |
| `lib/security/*` | Core Auth | `backend/src/core/auth/` |
| `backend/src/utils/logger.ts` | Core Shared | `backend/src/core/shared/logger.ts` |
| `backend/src/middleware/errorHandler.ts` | Core Shared | `backend/src/core/shared/error-handler.ts` |
| `backend/src/middleware/rateLimit.ts` | Core Shared | `backend/src/core/shared/rate-limiter.ts` |

### 3. Backend: Servicios de Infraestructura

| Archivo Actual | Destino | Ruta Nueva |
|----------------|---------|------------|
| `lib/bcvService.ts` | Infrastructure | `backend/src/infrastructure/bcv/bcv.service.ts` |
| `bcv-exchange-rates/` | Infrastructure | Integrar como dependencia o mantener separado |
| `lib/emailService.ts` | Infrastructure | `backend/src/infrastructure/email/email.service.ts` |
| `lib/whatsappService.ts` | Infrastructure | `backend/src/infrastructure/whatsapp/whatsapp.service.ts` |
| `lib/pdfUtils.ts` | Infrastructure | `backend/src/infrastructure/pdf/pdf-generator.service.ts` |
| `lib/weatherService.ts` | Infrastructure | `backend/src/infrastructure/weather/weather.service.ts` |

### 4. Frontend: Migración de Componentes a Módulos

#### Módulo Finance

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `components/Finance/FinanceDashboard.tsx` | `src/modules/finance/components/FinanceDashboard.tsx` |
| `components/Finance/FinanceHeader.tsx` | `src/modules/finance/components/FinanceHeader.tsx` |
| `components/Finance/FinanceKPIs.tsx` | `src/modules/finance/components/FinanceKPIs.tsx` |
| `components/Finance/LedgerManager.tsx` | `src/modules/finance/components/LedgerManager.tsx` |
| `components/Finance/IGTFManager.tsx` | `src/modules/finance/components/IGTFManager.tsx` |
| `components/Finance/LibroManager.tsx` | `src/modules/finance/components/LibroManager.tsx` |
| `components/Finance/ReconciliationManager.tsx` | `src/modules/finance/components/ReconciliationManager.tsx` |
| `components/Finance/CxCManager.tsx` | `src/modules/finance/components/CxCManager.tsx` |
| `components/Finance/Atoms/*` | `src/modules/finance/components/atoms/` |
| `components/Finance/Molecules/*` | `src/modules/finance/components/molecules/` |
| `components/Finance/Organisms/*` | `src/modules/finance/components/organisms/` |
| `pages/Finance.tsx` | `src/modules/finance/pages/FinancePage.tsx` |
| `features/finance/hooks/*` | `src/modules/finance/hooks/` |
| `features/finance/pages/*` | `src/modules/finance/pages/` |

#### Módulo Inventory

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `components/Inventory/InventoryTable.tsx` | `src/modules/inventory/components/InventoryTable.tsx` |
| `components/Inventory/InventoryHeader.tsx` | `src/modules/inventory/components/InventoryHeader.tsx` |
| `components/Inventory/InventoryKPIs.tsx` | `src/modules/inventory/components/InventoryKPIs.tsx` |
| `components/Inventory/InventoryAnalytics.tsx` | `src/modules/inventory/components/InventoryAnalytics.tsx` |
| `components/Inventory/InventoryDialogs.tsx` | `src/modules/inventory/components/InventoryDialogs.tsx` |
| `components/Inventory/InventoryAIPanel.tsx` | `src/modules/inventory/components/InventoryAIPanel.tsx` |
| `components/Inventory/CatalogTable.tsx` | `src/modules/inventory/components/CatalogTable.tsx` |
| `components/Inventory/StockHistory.tsx` | `src/modules/inventory/components/StockHistory.tsx` |
| `components/Dashboard/StockAlerts.tsx` | `src/modules/inventory/components/StockAlerts.tsx` |
| `pages/Inventory.tsx` | `src/modules/inventory/pages/InventoryPage.tsx` |
| `features/inventory/hooks/*` | `src/modules/inventory/hooks/` |
| `features/inventory/services/*` | `src/modules/inventory/services/` |

#### Módulo Sales

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `components/Sales/SalesPOS.tsx` | `src/modules/sales/components/SalesPOS.tsx` |
| `components/Sales/SalesCart.tsx` | `src/modules/sales/components/SalesCart.tsx` |
| `components/Sales/SalesHistory.tsx` | `src/modules/sales/components/SalesHistory.tsx` |
| `components/Sales/SalesKPIs.tsx` | `src/modules/sales/components/SalesKPIs.tsx` |
| `components/Sales/InvoiceRow.tsx` | `src/modules/sales/components/InvoiceRow.tsx` |
| `components/Sales/EntityDialog.tsx` | `src/modules/sales/components/EntityDialog.tsx` |
| `components/Sales/PaymentDialog.tsx` | `src/modules/sales/components/PaymentDialog.tsx` |
| `components/Sales/ReportDialog.tsx` | `src/modules/sales/components/ReportDialog.tsx` |
| `pages/Sales.tsx` | `src/modules/sales/pages/SalesPage.tsx` |
| `pages/InvoicePreview.tsx` | `src/modules/sales/pages/InvoicePreviewPage.tsx` |
| `features/sales/hooks/*` | `src/modules/sales/hooks/` |

#### Módulo HR

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `components/HR/EmployeeDirectory.tsx` | `src/modules/hr/components/EmployeeDirectory.tsx` |
| `components/HR/EmployeeCard.tsx` | `src/modules/hr/components/EmployeeCard.tsx` |
| `components/HR/HRHeader.tsx` | `src/modules/hr/components/HRHeader.tsx` |
| `components/HR/HRKPIs.tsx` | `src/modules/hr/components/HRKPIs.tsx` |
| `components/HR/PayrollManager.tsx` | `src/modules/hr/components/PayrollManager.tsx` |
| `components/HR/VacacionesManager.tsx` | `src/modules/hr/components/VacacionesManager.tsx` |
| `components/HR/PrestacionesManager.tsx` | `src/modules/hr/components/PrestacionesManager.tsx` |
| `pages/HR.tsx` | `src/modules/hr/pages/HRPage.tsx` |
| `features/hr/hooks/*` | `src/modules/hr/hooks/` |

### 5. Frontend: Servicios Core

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `lib/SyncEngine.ts` | `src/core/sync/SyncEngine.ts` |
| `lib/SyncManager.ts` | `src/core/sync/SyncManager.ts` |
| `lib/SyncService.ts` | `src/core/sync/SyncService.ts` |
| `lib/localDb.ts` | `src/core/database/localDb.ts` |
| `lib/schemas/*` | `src/core/database/schemas/` |
| `lib/groqService.ts` | `src/core/ai/services/groq.service.ts` |
| `lib/aiErrorHandler.ts` | `src/core/ai/services/ai-error-handler.ts` |
| `hooks/useAI.ts` | `src/core/ai/hooks/useAI.ts` |
| `components/AIChat.tsx` | `src/core/ai/components/AIChat.tsx` |
| `components/AIAssistant/*` | `src/core/ai/components/` |
| `lib/security/*` | `src/core/security/` |
| `hooks/useSecurity.ts` | `src/core/security/hooks/useSecurity.ts` |
| `components/auth/*` | `src/core/auth/components/` |
| `components/ProtectedRoute.tsx` | `src/core/auth/components/ProtectedRoute.tsx` |

### 6. Frontend: Componentes Compartidos

| Archivo Actual | Ruta Nueva |
|----------------|------------|
| `components/ui/*` | `src/shared/components/ui/` |
| `components/Layout.tsx` | `src/shared/components/layout/Layout.tsx` |
| `components/Layout/*` | `src/shared/components/layout/` |
| `components/ErrorBoundary.tsx` | `src/shared/components/feedback/ErrorBoundary.tsx` |
| `components/OfflineBanner.tsx` | `src/shared/components/feedback/OfflineBanner.tsx` |
| `components/SyncStatusIndicator.tsx` | `src/shared/components/feedback/SyncStatusIndicator.tsx` |
| `components/SkeletonLoaders.tsx` | `src/shared/components/feedback/SkeletonLoaders.tsx` |
| `components/CommandPalette.tsx` | `src/shared/components/common/CommandPalette.tsx` |
| `components/ThemeToggle.tsx` | `src/shared/components/common/ThemeToggle.tsx` |
| `components/TenantSelector.tsx` | `src/shared/components/common/TenantSelector.tsx` |
| `components/PaginationControls.tsx` | `src/shared/components/common/PaginationControls.tsx` |

---


## 🔄 Estrategia de Migración por Fases

### Fase 0: Preparación (1-2 días)

**Objetivo**: Preparar el entorno y crear herramientas de migración

1. **Crear rama de migración**
   ```bash
   git checkout -b feature/modular-architecture
   ```

2. **Backup completo**
   ```bash
   git tag pre-migration-backup
   ```

3. **Crear script de migración automatizada**
   - Script para mover archivos manteniendo historial git
   - Script para actualizar imports automáticamente
   - Script de validación de dependencias

4. **Documentar dependencias críticas**
   - Mapear todas las importaciones entre módulos
   - Identificar dependencias circulares
   - Documentar APIs públicas de cada módulo

5. **Configurar alias de TypeScript**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@core/*": ["src/core/*"],
         "@modules/*": ["src/modules/*"],
         "@shared/*": ["src/shared/*"],
         "@infrastructure/*": ["src/infrastructure/*"]
       }
     }
   }
   ```

---

### Fase 1: Backend - Crear Estructura Core (2-3 días)

**Objetivo**: Establecer servicios transversales del backend

1. **Crear estructura de carpetas core**
   ```bash
   mkdir -p backend/src/core/{database,auth,sync,ai,shared}
   ```

2. **Migrar servicios de sincronización**
   - Mover `SyncEngine.ts`, `SyncManager.ts`, `SyncService.ts`
   - Actualizar imports
   - Validar funcionamiento

3. **Migrar servicios de autenticación**
   - Consolidar `lib/security/*` en `core/auth/`
   - Migrar middlewares de autenticación
   - Actualizar rutas

4. **Migrar servicios de IA**
   - Mover `groqService.ts` y `aiErrorHandler.ts`
   - Actualizar controladores

5. **Migrar utilidades compartidas**
   - Logger, error handler, rate limiter
   - Validadores y formateadores

**Validación**: Ejecutar tests y verificar que el backend sigue funcionando

---

### Fase 2: Backend - Crear Módulo Finance (3-4 días)

**Objetivo**: Migrar el primer módulo completo como piloto

1. **Crear estructura del módulo**
   ```bash
   mkdir -p backend/src/modules/finance/{controllers,services,routes,models,types}
   ```

2. **Migrar servicios de Finance**
   - `AccountingService.ts`
   - `IGTFService.ts`
   - `WithholdingService.ts`
   - `LedgerService.ts`
   - `LibroGeneratorService.ts`
   - `ReconciliationService.ts`
   - `ExchangeDifferenceService.ts`

3. **Crear controladores del módulo**
   - Consolidar lógica de controladores existentes
   - Crear nuevos controladores si es necesario

4. **Crear rutas del módulo**
   ```typescript
   // backend/src/modules/finance/routes/finance.routes.ts
   import { Router } from 'express';
   import * as ledgerController from '../controllers/ledger.controller';
   import * as igtfController from '../controllers/igtf.controller';
   
   const router = Router();
   
   router.get('/ledger', ledgerController.getLedger);
   router.post('/igtf/calculate', igtfController.calculate);
   // ... más rutas
   
   export default router;
   ```

5. **Integrar en servidor principal**
   ```typescript
   // backend/server.ts
   import financeRoutes from './src/modules/finance/routes/finance.routes';
   
   app.use('/api/finance', financeRoutes);
   ```

6. **Migrar tipos y modelos**
   - Consolidar tipos de Finance
   - Crear modelos de base de datos

**Validación**: 
- Tests unitarios de servicios
- Tests de integración de rutas
- Verificar que el frontend sigue funcionando

---

### Fase 3: Backend - Migrar Resto de Módulos (5-7 días)

**Objetivo**: Replicar el patrón de Finance en otros módulos

1. **Módulo Inventory** (1-2 días)
   - Servicios: `InventarioService`, `barcodeService`, `ForecastingService`
   - Controladores y rutas
   - Tipos y modelos

2. **Módulo Sales** (1-2 días)
   - Servicios: `VentasService`, `LoyaltyService`, `invoiceExport`
   - Controladores y rutas
   - Tipos y modelos

3. **Módulo HR** (1 día)
   - Servicios: `PayrollService`
   - Controladores y rutas
   - Tipos y modelos

4. **Módulo Accounts Receivable** (1 día)
   - Servicios: `CuentasPorCobrarService`
   - Controladores y rutas
   - Tipos y modelos

5. **Módulo Purchases** (1 día)
   - Crear estructura básica
   - Preparar para futuras funcionalidades

**Validación**: Tests completos del backend

---

### Fase 4: Backend - Infraestructura (2 días)

**Objetivo**: Consolidar servicios de infraestructura

1. **Crear estructura de infraestructura**
   ```bash
   mkdir -p backend/src/infrastructure/{bcv,email,whatsapp,pdf,weather}
   ```

2. **Migrar servicios**
   - `bcvService.ts` → `infrastructure/bcv/`
   - `emailService.ts` → `infrastructure/email/`
   - `whatsappService.ts` → `infrastructure/whatsapp/`
   - `pdfUtils.ts` → `infrastructure/pdf/`
   - `weatherService.ts` → `infrastructure/weather/`

3. **Integrar bcv-exchange-rates**
   - Opción A: Mantener como microservicio separado
   - Opción B: Integrar como dependencia npm
   - Recomendación: Mantener separado pero con interfaz clara

**Validación**: Verificar que todos los servicios externos funcionan

---

### Fase 5: Backend - Migración a TypeScript (3-4 días)

**Objetivo**: Convertir todos los archivos .js a .ts

1. **Migrar archivos principales**
   - `server.js` → `server.ts`
   - `app.js` → `app.ts`

2. **Migrar controladores**
   - Todos los `.controller.js` → `.controller.ts`

3. **Migrar rutas**
   - Todos los `.routes.js` → `.routes.ts`

4. **Migrar middlewares**
   - Consolidar `middleware/` y `middlewares/`
   - Convertir a TypeScript

5. **Actualizar configuración**
   - Actualizar `tsconfig.json`
   - Configurar build de TypeScript
   - Actualizar scripts de package.json

**Validación**: 
- Compilación sin errores
- Tests pasando
- Aplicación funcionando

---

### Fase 6: Frontend - Crear Estructura Core (2-3 días)

**Objetivo**: Establecer servicios transversales del frontend

1. **Crear estructura core**
   ```bash
   mkdir -p src/core/{auth,database,sync,ai,security,api,shared}
   ```

2. **Migrar servicios de sincronización**
   - `SyncEngine.ts`, `SyncManager.ts`, `SyncService.ts`
   - Hooks relacionados

3. **Migrar base de datos local**
   - `localDb.ts` y schemas
   - Configuración de Dexie

4. **Migrar servicios de IA**
   - `groqService.ts`, `aiErrorHandler.ts`
   - `useAI.ts` hook
   - Componentes de IA

5. **Migrar autenticación y seguridad**
   - Servicios de seguridad
   - Componentes de auth
   - Hooks de auth

6. **Migrar API Gateway**
   - `ApiGateway.ts`, `BffWeb.ts`
   - `api.service.ts`
   - Hooks de API

**Validación**: Verificar que servicios core funcionan

---

### Fase 7: Frontend - Migrar Módulo Finance (3-4 días)

**Objetivo**: Migrar el primer módulo completo del frontend

1. **Crear estructura del módulo**
   ```bash
   mkdir -p src/modules/finance/{components,hooks,services,pages,types}
   ```

2. **Migrar componentes**
   - Todos los componentes de `components/Finance/`
   - Mantener estructura Atomic Design si existe

3. **Migrar hooks**
   - Hooks específicos de Finance
   - Crear nuevos hooks si es necesario

4. **Migrar servicios**
   - Servicios del frontend de Finance
   - Integrar con servicios del backend

5. **Migrar páginas**
   - Consolidar `pages/Finance.tsx` con componentes
   - Crear estructura de páginas del módulo

6. **Crear barrel exports**
   ```typescript
   // src/modules/finance/index.ts
   export * from './components';
   export * from './hooks';
   export * from './services';
   export * from './types';
   ```

7. **Actualizar rutas**
   ```typescript
   // src/app/App.tsx
   import { FinancePage } from '@modules/finance';
   
   <Route path="/finance" element={<FinancePage />} />
   ```

**Validación**: 
- Módulo Finance funciona completamente
- No hay errores de importación
- Tests pasando

---

### Fase 8: Frontend - Migrar Resto de Módulos (6-8 días)

**Objetivo**: Replicar el patrón en todos los módulos

1. **Módulo Inventory** (2 días)
   - Componentes, hooks, servicios, páginas
   - Integración con IA

2. **Módulo Sales** (2 días)
   - Componentes, hooks, servicios, páginas
   - POS y facturación

3. **Módulo HR** (1-2 días)
   - Componentes, hooks, servicios, páginas
   - Nómina y empleados

4. **Módulo Accounts Receivable** (1 día)
   - Componentes, hooks, servicios, páginas

5. **Módulo Purchases** (1 día)
   - Estructura básica

6. **Módulo Dashboard** (1 día)
   - Consolidar dashboard general

**Validación**: Todos los módulos funcionando

---

### Fase 9: Frontend - Componentes Compartidos (2 días)

**Objetivo**: Organizar componentes UI genéricos

1. **Crear estructura shared**
   ```bash
   mkdir -p src/shared/components/{ui,layout,feedback,common}
   ```

2. **Migrar componentes UI**
   - Todos los componentes de `components/ui/`
   - Mantener estructura de Radix UI

3. **Migrar componentes de layout**
   - Layout, Sidebar, Header

4. **Migrar componentes de feedback**
   - ErrorBoundary, OfflineBanner, SyncStatusIndicator

5. **Migrar componentes comunes**
   - CommandPalette, ThemeToggle, TenantSelector

**Validación**: Todos los componentes compartidos funcionan

---

### Fase 10: Infraestructura Frontend (1-2 días)

**Objetivo**: Consolidar servicios de infraestructura del frontend

1. **Crear estructura**
   ```bash
   mkdir -p src/infrastructure/{bcv,currency,email,whatsapp,pdf,export,weather}
   ```

2. **Migrar servicios**
   - Servicios de infraestructura del frontend
   - Integrar con servicios del backend

**Validación**: Servicios de infraestructura funcionan

---

### Fase 11: Limpieza y Optimización (2-3 días)

**Objetivo**: Eliminar código antiguo y optimizar

1. **Eliminar carpetas antiguas**
   ```bash
   # Después de verificar que todo funciona
   rm -rf src/components/Finance
   rm -rf src/components/Inventory
   rm -rf src/components/Sales
   rm -rf src/components/HR
   rm -rf src/pages/Finance.tsx
   rm -rf src/lib/AccountingService.ts
   # ... etc
   ```

2. **Optimizar imports**
   - Usar barrel exports
   - Eliminar imports no utilizados
   - Verificar tree-shaking

3. **Actualizar documentación**
   - Actualizar README
   - Documentar nueva estructura
   - Crear guías de desarrollo

4. **Optimizar bundle**
   - Code splitting por módulo
   - Lazy loading de módulos
   - Optimizar dependencias

**Validación**: 
- No hay código duplicado
- Bundle optimizado
- Documentación actualizada

---

### Fase 12: Testing y Validación Final (2-3 días)

**Objetivo**: Asegurar que todo funciona correctamente

1. **Tests unitarios**
   - Verificar cobertura de tests
   - Agregar tests faltantes
   - Todos los tests pasando

2. **Tests de integración**
   - Verificar flujos completos
   - Tests end-to-end

3. **Tests de rendimiento**
   - Comparar con versión anterior
   - Optimizar si es necesario

4. **Tests de usuario**
   - Verificar todas las funcionalidades
   - Probar en diferentes escenarios

5. **Validación de build**
   - Build de desarrollo
   - Build de producción
   - Build de Electron

**Validación**: Todo funciona perfectamente

---


## 🛠️ Scripts de Migración Automatizada

### Script 1: Mover Archivos con Historial Git

```typescript
// scripts/migrate-to-modules.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationRule {
  source: string;
  destination: string;
  updateImports?: boolean;
}

const migrationRules: MigrationRule[] = [
  // Backend - Finance
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
  // ... más reglas
];

function moveFileWithGitHistory(source: string, destination: string) {
  const destDir = path.dirname(destination);
  
  // Crear directorio destino si no existe
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Mover archivo manteniendo historial git
  try {
    execSync(`git mv ${source} ${destination}`, { stdio: 'inherit' });
    console.log(`✅ Moved: ${source} → ${destination}`);
  } catch (error) {
    console.error(`❌ Error moving ${source}:`, error);
  }
}

function updateImportsInFile(filePath: string, oldPath: string, newPath: string) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const oldImport = oldPath.replace(/\\/g, '/').replace('.ts', '');
  const newImport = newPath.replace(/\\/g, '/').replace('.ts', '');
  
  // Actualizar imports relativos
  content = content.replace(
    new RegExp(`from ['"].*${oldImport}['"]`, 'g'),
    `from '${newImport}'`
  );
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function findAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

async function migrate() {
  console.log('🚀 Starting migration...\n');
  
  // Fase 1: Mover archivos
  console.log('📦 Phase 1: Moving files...');
  for (const rule of migrationRules) {
    moveFileWithGitHistory(rule.source, rule.destination);
  }
  
  // Fase 2: Actualizar imports
  console.log('\n🔄 Phase 2: Updating imports...');
  const allFiles = [
    ...findAllTypeScriptFiles('src'),
    ...findAllTypeScriptFiles('backend/src')
  ];
  
  for (const rule of migrationRules) {
    if (rule.updateImports) {
      console.log(`Updating imports for: ${rule.source}`);
      for (const file of allFiles) {
        updateImportsInFile(file, rule.source, rule.destination);
      }
    }
  }
  
  console.log('\n✅ Migration completed!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Run tests: npm test');
  console.log('3. Fix any remaining import issues');
  console.log('4. Commit changes: git commit -m "refactor: migrate to modular architecture"');
}

migrate().catch(console.error);
```

### Script 2: Validar Dependencias

```typescript
// scripts/validate-dependencies.ts
import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

interface Dependency {
  file: string;
  imports: string[];
}

function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];
  
  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    traverse(ast, {
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      }
    });
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }
  
  return imports;
}

function validateModuleBoundaries() {
  console.log('🔍 Validating module boundaries...\n');
  
  const violations: string[] = [];
  
  // Reglas de dependencias permitidas
  const rules = {
    'modules/finance': ['core', 'shared', 'infrastructure'],
    'modules/inventory': ['core', 'shared', 'infrastructure'],
    'modules/sales': ['core', 'shared', 'infrastructure'],
    'modules/hr': ['core', 'shared', 'infrastructure'],
    'core': ['shared'],
    'shared': []
  };
  
  // Validar que los módulos no se importen entre sí
  for (const [module, allowedDeps] of Object.entries(rules)) {
    const modulePath = path.join('src', module);
    if (!fs.existsSync(modulePath)) continue;
    
    const files = findAllTypeScriptFiles(modulePath);
    
    for (const file of files) {
      const imports = extractImports(file);
      
      for (const imp of imports) {
        if (imp.startsWith('@modules/')) {
          const importedModule = imp.split('/')[1];
          
          if (importedModule !== module.split('/')[1]) {
            violations.push(
              `❌ ${file}: Module ${module} should not import from @modules/${importedModule}`
            );
          }
        }
      }
    }
  }
  
  if (violations.length > 0) {
    console.log('⚠️  Dependency violations found:\n');
    violations.forEach(v => console.log(v));
    process.exit(1);
  } else {
    console.log('✅ All module boundaries are respected!');
  }
}

function findAllTypeScriptFiles(dir: string): string[] {
  // ... (misma implementación que en migrate-to-modules.ts)
}

validateModuleBoundaries();
```

### Script 3: Generar Barrel Exports

```typescript
// scripts/generate-barrel-exports.ts
import * as fs from 'fs';
import * as path from 'path';

function generateBarrelExport(modulePath: string) {
  const indexPath = path.join(modulePath, 'index.ts');
  const subdirs = ['components', 'hooks', 'services', 'types', 'pages'];
  
  let content = '// Auto-generated barrel export\n\n';
  
  for (const subdir of subdirs) {
    const subdirPath = path.join(modulePath, subdir);
    if (fs.existsSync(subdirPath)) {
      content += `export * from './${subdir}';\n`;
    }
  }
  
  fs.writeFileSync(indexPath, content, 'utf-8');
  console.log(`✅ Generated barrel export: ${indexPath}`);
}

function generateAllBarrelExports() {
  const modulesPath = 'src/modules';
  const modules = fs.readdirSync(modulesPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  
  for (const module of modules) {
    generateBarrelExport(path.join(modulesPath, module));
  }
}

generateAllBarrelExports();
```

---

## 📝 Checklist de Migración

### Pre-Migración
- [ ] Crear rama de migración
- [ ] Hacer backup completo
- [ ] Documentar dependencias críticas
- [ ] Configurar alias de TypeScript
- [ ] Crear scripts de migración

### Backend
- [ ] Crear estructura core
- [ ] Migrar servicios de sincronización
- [ ] Migrar servicios de autenticación
- [ ] Migrar servicios de IA
- [ ] Migrar utilidades compartidas
- [ ] Crear módulo Finance
- [ ] Crear módulo Inventory
- [ ] Crear módulo Sales
- [ ] Crear módulo HR
- [ ] Crear módulo Accounts Receivable
- [ ] Crear módulo Purchases
- [ ] Migrar servicios de infraestructura
- [ ] Migrar todo a TypeScript
- [ ] Actualizar configuración
- [ ] Tests pasando

### Frontend
- [ ] Crear estructura core
- [ ] Migrar servicios de sincronización
- [ ] Migrar base de datos local
- [ ] Migrar servicios de IA
- [ ] Migrar autenticación y seguridad
- [ ] Migrar API Gateway
- [ ] Crear módulo Finance
- [ ] Crear módulo Inventory
- [ ] Crear módulo Sales
- [ ] Crear módulo HR
- [ ] Crear módulo Accounts Receivable
- [ ] Crear módulo Purchases
- [ ] Crear módulo Dashboard
- [ ] Migrar componentes compartidos
- [ ] Migrar servicios de infraestructura
- [ ] Tests pasando

### Limpieza
- [ ] Eliminar carpetas antiguas
- [ ] Optimizar imports
- [ ] Actualizar documentación
- [ ] Optimizar bundle
- [ ] Code splitting
- [ ] Lazy loading

### Validación Final
- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] Tests de rendimiento OK
- [ ] Tests de usuario OK
- [ ] Build de desarrollo OK
- [ ] Build de producción OK
- [ ] Build de Electron OK

---


## 🎯 Principios de Clean Architecture Aplicados

### 1. Separación de Responsabilidades

Cada módulo tiene capas claramente definidas:

```
modules/[module-name]/
├── controllers/     # Capa de presentación (API)
├── services/        # Capa de lógica de negocio
├── models/          # Capa de datos
└── types/           # Contratos e interfaces
```

### 2. Dependencias Unidireccionales

```
┌─────────────────────────────────────┐
│         Modules (Finance, etc)      │
│  ┌─────────────────────────────┐   │
│  │      Components/Pages       │   │
│  └──────────┬──────────────────┘   │
│             ↓                       │
│  ┌─────────────────────────────┐   │
│  │      Hooks & Services       │   │
│  └──────────┬──────────────────┘   │
└─────────────┼───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│              Core                   │
│  (Auth, Sync, DB, AI, Security)    │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Infrastructure              │
│  (BCV, Email, WhatsApp, PDF)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│            Shared                   │
│  (UI Components, Utils)             │
└─────────────────────────────────────┘
```

**Reglas**:
- Los módulos NO pueden importar de otros módulos
- Los módulos pueden importar de Core, Infrastructure y Shared
- Core puede importar de Shared
- Shared no importa de nadie (excepto librerías externas)

### 3. Inversión de Dependencias

Los servicios dependen de interfaces, no de implementaciones concretas:

```typescript
// modules/finance/types/finance.types.ts
export interface IAccountingService {
  calculateBalance(accountId: string): Promise<number>;
  generateReport(params: ReportParams): Promise<Report>;
}

// modules/finance/services/accounting.service.ts
export class AccountingService implements IAccountingService {
  constructor(
    private db: IDatabase,
    private sync: ISyncService
  ) {}
  
  async calculateBalance(accountId: string): Promise<number> {
    // Implementación
  }
}
```

### 4. Local-First Architecture

```typescript
// core/sync/SyncEngine.ts
export class SyncEngine {
  // 1. Todas las operaciones se hacen primero en local
  async createInvoice(invoice: Invoice): Promise<Invoice> {
    // Guardar en IndexedDB
    await this.localDb.invoices.add(invoice);
    
    // Marcar para sincronización
    await this.syncQueue.enqueue({
      operation: 'CREATE',
      entity: 'invoice',
      data: invoice
    });
    
    // Sincronizar en background
    this.syncInBackground();
    
    return invoice;
  }
  
  // 2. Sincronización en background
  private async syncInBackground() {
    if (!navigator.onLine) return;
    
    const pendingOperations = await this.syncQueue.getAll();
    
    for (const op of pendingOperations) {
      try {
        await this.api.sync(op);
        await this.syncQueue.remove(op.id);
      } catch (error) {
        // Manejar conflictos
        await this.conflictResolver.resolve(op, error);
      }
    }
  }
}
```

### 5. Manejo de Conflictos

```typescript
// core/sync/conflict-resolution.ts
export class ConflictResolver {
  async resolve(localData: any, remoteData: any): Promise<any> {
    // Estrategia: Last Write Wins con timestamp
    if (localData.updatedAt > remoteData.updatedAt) {
      return localData;
    }
    
    // Si hay conflicto real, mostrar al usuario
    if (this.hasRealConflict(localData, remoteData)) {
      return await this.showConflictDialog(localData, remoteData);
    }
    
    return remoteData;
  }
}
```

---

## 🔐 Seguridad y Mejores Prácticas

### 1. Validación de Datos

```typescript
// modules/finance/services/accounting.service.ts
import { z } from 'zod';

const InvoiceSchema = z.object({
  amount: z.number().positive(),
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  }))
});

export class AccountingService {
  async createInvoice(data: unknown) {
    // Validar datos de entrada
    const validatedData = InvoiceSchema.parse(data);
    
    // Procesar...
  }
}
```

### 2. Manejo de Errores

```typescript
// core/shared/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

export class ErrorHandler {
  handle(error: Error) {
    if (error instanceof AppError && error.isOperational) {
      // Error esperado, mostrar al usuario
      this.notifyUser(error);
    } else {
      // Error inesperado, reportar a Sentry
      this.reportToSentry(error);
    }
  }
}
```

### 3. Rate Limiting

```typescript
// core/shared/rate-limiter.ts
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  async checkLimit(userId: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Filtrar requests dentro de la ventana
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      throw new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    
    return true;
  }
}
```

---

## 📊 Métricas de Éxito

### Antes de la Migración

| Métrica | Valor Actual |
|---------|--------------|
| Tiempo de build | ~45s |
| Tamaño del bundle | ~2.5MB |
| Tiempo de carga inicial | ~3s |
| Cobertura de tests | ~60% |
| Archivos duplicados | ~15 |
| Dependencias circulares | ~8 |

### Después de la Migración (Objetivos)

| Métrica | Valor Objetivo |
|---------|----------------|
| Tiempo de build | <30s |
| Tamaño del bundle | <2MB |
| Tiempo de carga inicial | <2s |
| Cobertura de tests | >80% |
| Archivos duplicados | 0 |
| Dependencias circulares | 0 |

### KPIs de Mantenibilidad

- **Cohesión de Módulos**: >80% (archivos relacionados en el mismo módulo)
- **Acoplamiento entre Módulos**: <20% (dependencias entre módulos)
- **Complejidad Ciclomática**: <10 por función
- **Duplicación de Código**: <3%

---

## 🚀 Beneficios Esperados

### 1. Desarrollo

- ✅ **Onboarding más rápido**: Nuevos desarrolladores entienden la estructura fácilmente
- ✅ **Desarrollo paralelo**: Equipos pueden trabajar en módulos independientes
- ✅ **Menos conflictos git**: Cambios aislados por módulo
- ✅ **Testing más fácil**: Tests unitarios por módulo

### 2. Mantenimiento

- ✅ **Código más limpio**: Separación clara de responsabilidades
- ✅ **Menos bugs**: Dependencias claras y validadas
- ✅ **Refactoring seguro**: Cambios aislados por módulo
- ✅ **Documentación implícita**: Estructura autodocumentada

### 3. Escalabilidad

- ✅ **Nuevos módulos fáciles**: Patrón claro para agregar funcionalidades
- ✅ **Code splitting**: Carga bajo demanda por módulo
- ✅ **Microservicios ready**: Fácil extraer módulos a servicios separados
- ✅ **Team scaling**: Equipos por módulo

### 4. Performance

- ✅ **Bundle más pequeño**: Tree-shaking efectivo
- ✅ **Lazy loading**: Módulos cargados bajo demanda
- ✅ **Mejor caching**: Módulos independientes
- ✅ **Faster builds**: Compilación incremental por módulo

---

## 📚 Recursos y Referencias

### Documentación Interna

- `ESTRUCTURA_PROYECTO_LIMPIA.txt` - Estructura actual
- `ESTRUCTURA_EMPAQUETADO.md` - Empaquetado de Electron
- `BUILD-EXE.md` - Guía de construcción
- `COMO-GENERAR-EXE.md` - Guía visual

### Patrones de Arquitectura

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Local-First Software](https://www.inkandswitch.com/local-first/)
- [Feature-Sliced Design](https://feature-sliced.design/)

### Herramientas

- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [Zod](https://zod.dev/) - Schema validation
- [Vitest](https://vitest.dev/) - Testing framework

---

## 🤝 Equipo y Roles

### Roles Sugeridos

1. **Arquitecto de Software** (1 persona)
   - Supervisar la migración completa
   - Resolver problemas de arquitectura
   - Revisar PRs críticos

2. **Backend Lead** (1 persona)
   - Liderar migración del backend
   - Migración a TypeScript
   - Configuración de módulos

3. **Frontend Lead** (1 persona)
   - Liderar migración del frontend
   - Configuración de módulos
   - Optimización de bundle

4. **Desarrolladores** (2-3 personas)
   - Migrar módulos específicos
   - Escribir tests
   - Actualizar documentación

5. **QA** (1 persona)
   - Validar funcionalidades
   - Tests de regresión
   - Documentar bugs

### Estimación de Tiempo

- **Tiempo total estimado**: 6-8 semanas
- **Esfuerzo**: 3-4 personas full-time
- **Horas totales**: ~480-640 horas

### Cronograma Sugerido

| Semana | Fases | Responsable |
|--------|-------|-------------|
| 1 | Fase 0-1: Preparación + Backend Core | Backend Lead |
| 2 | Fase 2-3: Módulo Finance + Otros módulos backend | Backend Lead + Dev |
| 3 | Fase 4-5: Infraestructura + TypeScript | Backend Lead + Dev |
| 4 | Fase 6-7: Frontend Core + Módulo Finance | Frontend Lead + Dev |
| 5-6 | Fase 8-9: Resto de módulos frontend + Shared | Frontend Lead + Devs |
| 7 | Fase 10-11: Infraestructura + Limpieza | Todos |
| 8 | Fase 12: Testing y validación final | QA + Todos |

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Romper funcionalidades existentes

**Probabilidad**: Alta  
**Impacto**: Alto

**Mitigación**:
- Migrar por fases, validando cada una
- Mantener tests pasando en todo momento
- Hacer rollback si algo falla
- Tener ambiente de staging para validar

### Riesgo 2: Dependencias circulares no detectadas

**Probabilidad**: Media  
**Impacto**: Alto

**Mitigación**:
- Usar script de validación de dependencias
- Configurar ESLint para detectar imports incorrectos
- Revisar arquitectura antes de migrar

### Riesgo 3: Pérdida de historial git

**Probabilidad**: Baja  
**Impacto**: Medio

**Mitigación**:
- Usar `git mv` para mover archivos
- Hacer commits pequeños y frecuentes
- Mantener backup antes de migrar

### Riesgo 4: Tiempo de migración mayor al estimado

**Probabilidad**: Media  
**Impacto**: Medio

**Mitigación**:
- Buffer de 20% en estimaciones
- Priorizar módulos críticos primero
- Migración incremental, no big bang

### Riesgo 5: Resistencia del equipo

**Probabilidad**: Baja  
**Impacto**: Alto

**Mitigación**:
- Comunicar beneficios claramente
- Involucrar al equipo en decisiones
- Capacitar en nueva arquitectura
- Documentar todo el proceso

---

## 📞 Contacto y Soporte

Para preguntas sobre este plan de migración:

1. Revisar documentación en `/docs`
2. Consultar con el Arquitecto de Software
3. Crear issue en el repositorio con tag `migration`

---

## 📝 Notas Finales

Este plan de migración es una guía detallada pero flexible. Ajusta según las necesidades específicas de tu equipo y proyecto.

**Recuerda**:
- La migración es un proceso iterativo
- Valida constantemente que todo funciona
- Documenta los cambios y decisiones
- Comunica el progreso al equipo
- No tengas miedo de hacer ajustes al plan

**¡Éxito en la migración! 🚀**

---

**Última actualización**: 2026-03-03  
**Versión**: 1.0  
**Autor**: Arquitecto de Software Senior
