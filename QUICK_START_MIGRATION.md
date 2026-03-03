# Guía Rápida: Iniciar Migración

Esta guía te ayudará a iniciar la migración en 5 pasos simples.

---

## 📋 Pre-requisitos

1. ✅ Estructura de carpetas creada
2. ✅ Scripts de migración listos
3. ✅ Configuración de TypeScript actualizada
4. ✅ Backup del proyecto realizado

---

## 🚀 5 Pasos para Iniciar

### Paso 1: Inicializar Git (Opcional pero Recomendado)

```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "chore: initial commit before modular architecture migration"

# Crear tag de backup
git tag pre-migration-backup

# Crear rama de migración
git checkout -b feature/modular-architecture
```

### Paso 2: Revisar Archivos a Migrar

Primero, identifica qué archivos existen en tu proyecto:

```bash
# Listar servicios en src/lib
ls -la src/lib

# Listar componentes
ls -la src/components

# Listar hooks
ls -la src/hooks
```

### Paso 3: Ejecutar Migración Automática

```bash
# Migrar archivos automáticamente
npm run migrate:modules

# Esto moverá archivos de src/lib a sus módulos correspondientes
# y actualizará imports automáticamente
```

### Paso 4: Validar Dependencias

```bash
# Validar que se respeten las reglas de arquitectura
npm run validate:deps

# Generar barrel exports
npm run generate:exports
```

### Paso 5: Verificar y Testear

```bash
# Verificar que no hay errores de TypeScript
npm run typecheck

# Ejecutar tests
npm run test

# Ejecutar linter
npm run lint

# Si todo está bien, hacer build
npm run build
```

---

## 🔧 Migración Manual (Si es necesario)

Si algunos archivos no se migraron automáticamente, hazlo manualmente:

### Ejemplo: Migrar un Servicio

```bash
# 1. Mover archivo
mv src/lib/AccountingService.ts src/modules/finance/services/accounting.service.ts

# 2. Actualizar imports en el archivo
# Cambiar imports relativos a usar alias @core, @shared, etc.

# 3. Exportar en barrel export
# Agregar export en src/modules/finance/services/index.ts
echo "export * from './accounting.service';" >> src/modules/finance/services/index.ts

# 4. Actualizar imports en archivos que lo usan
# Buscar archivos que importan el servicio
grep -r "AccountingService" src/

# 5. Actualizar cada archivo encontrado
# Cambiar: import { AccountingService } from '../lib/AccountingService';
# Por: import { AccountingService } from '@modules/finance';
```

### Ejemplo: Migrar un Componente

```bash
# 1. Mover componente
mv src/components/Finance/FinanceDashboard.tsx src/modules/finance/components/FinanceDashboard.tsx

# 2. Exportar en barrel export
echo "export * from './FinanceDashboard';" >> src/modules/finance/components/index.ts

# 3. Actualizar imports
# Cambiar: import { FinanceDashboard } from '../components/Finance/FinanceDashboard';
# Por: import { FinanceDashboard } from '@modules/finance';
```

---

## 📝 Checklist de Migración por Módulo

### Módulo Finance

- [ ] Migrar servicios de `src/lib`:
  - [ ] AccountingService.ts
  - [ ] IGTFService.ts
  - [ ] WithholdingService.ts
  - [ ] LedgerService.ts
  - [ ] LibroGeneratorService.ts
  - [ ] ReconciliationService.ts
  - [ ] ExchangeDifferenceService.ts

- [ ] Migrar componentes de `src/components/Finance`:
  - [ ] FinanceDashboard.tsx
  - [ ] FinanceHeader.tsx
  - [ ] FinanceKPIs.tsx
  - [ ] LedgerManager.tsx
  - [ ] IGTFManager.tsx
  - [ ] LibroManager.tsx
  - [ ] ReconciliationManager.tsx
  - [ ] CxCManager.tsx

- [ ] Migrar hooks de `src/hooks`:
  - [ ] useFinance.ts
  - [ ] useLedger.ts
  - [ ] useIGTF.ts

- [ ] Migrar páginas de `src/pages`:
  - [ ] Finance.tsx → FinancePage.tsx

### Módulo Inventory

- [ ] Migrar servicios de `src/lib`:
  - [ ] ForecastingService.ts
  - [ ] barcodeService.ts

- [ ] Migrar componentes de `src/components/Inventory`:
  - [ ] InventoryTable.tsx
  - [ ] InventoryHeader.tsx
  - [ ] InventoryKPIs.tsx
  - [ ] InventoryAnalytics.tsx
  - [ ] InventoryDialogs.tsx
  - [ ] InventoryAIPanel.tsx
  - [ ] CatalogTable.tsx
  - [ ] StockHistory.tsx

- [ ] Migrar hooks de `src/hooks`:
  - [ ] useInventory.ts
  - [ ] useProducts.ts
  - [ ] useStock.ts

- [ ] Migrar páginas de `src/pages`:
  - [ ] Inventory.tsx → InventoryPage.tsx

### Módulo Sales

- [ ] Migrar servicios de `src/lib`:
  - [ ] LoyaltyService.ts
  - [ ] invoiceExport.ts

- [ ] Migrar componentes de `src/components/Sales`:
  - [ ] SalesPOS.tsx
  - [ ] SalesCart.tsx
  - [ ] SalesHistory.tsx
  - [ ] SalesKPIs.tsx
  - [ ] InvoiceRow.tsx
  - [ ] EntityDialog.tsx
  - [ ] PaymentDialog.tsx
  - [ ] ReportDialog.tsx

- [ ] Migrar hooks de `src/hooks`:
  - [ ] useSales.ts
  - [ ] useInvoices.ts
  - [ ] usePOS.ts

- [ ] Migrar páginas de `src/pages`:
  - [ ] Sales.tsx → SalesPage.tsx
  - [ ] InvoicePreview.tsx → InvoicePreviewPage.tsx

### Módulo HR

- [ ] Migrar servicios de `src/lib`:
  - [ ] PayrollService.ts

- [ ] Migrar componentes de `src/components/HR`:
  - [ ] EmployeeDirectory.tsx
  - [ ] EmployeeCard.tsx
  - [ ] HRHeader.tsx
  - [ ] HRKPIs.tsx
  - [ ] PayrollManager.tsx
  - [ ] VacacionesManager.tsx
  - [ ] PrestacionesManager.tsx

- [ ] Migrar hooks de `src/hooks`:
  - [ ] useHR.ts
  - [ ] useEmployees.ts
  - [ ] usePayroll.ts

- [ ] Migrar páginas de `src/pages`:
  - [ ] HR.tsx → HRPage.tsx

---

## 🐛 Solución de Problemas

### Error: "Cannot find module '@modules/finance'"

**Solución**: Asegúrate de que:
1. El alias está configurado en `tsconfig.json`
2. El alias está configurado en `vite.config.ts`
3. Has reiniciado el servidor de desarrollo

```bash
# Reiniciar servidor
npm run dev
```

### Error: "Circular dependency detected"

**Solución**: Revisa las dependencias con:

```bash
npm run validate:deps
```

Luego refactoriza para eliminar la dependencia circular.

### Error: "Module not found"

**Solución**: Verifica que el archivo existe y está exportado en el barrel export:

```bash
# Verificar que el archivo existe
ls -la src/modules/finance/services/accounting.service.ts

# Verificar que está exportado
cat src/modules/finance/services/index.ts
```

---

## ✅ Validación Final

Antes de considerar la migración completa, verifica:

```bash
# 1. TypeScript compila sin errores
npm run typecheck

# 2. Tests pasan
npm run test

# 3. Linter no reporta errores
npm run lint

# 4. Build funciona
npm run build

# 5. Aplicación funciona en desarrollo
npm run dev

# 6. Aplicación funciona en Electron
npm run electron:dev
```

---

## 📞 Ayuda

Si encuentras problemas:

1. Revisa `ARCHITECTURE_RULES.md` para reglas de arquitectura
2. Revisa `PLAN_MIGRACION_ARQUITECTURA_MODULAR.md` para el plan completo
3. Ejecuta `npm run validate:deps` para validar dependencias
4. Revisa los logs de error en la consola

---

## 🎉 ¡Éxito!

Una vez completada la migración:

1. Actualiza `MIGRATION_PROGRESS.md` con el progreso
2. Documenta cualquier cambio en los README de los módulos
3. Celebra con el equipo 🎊

---

**Última actualización**: 2026-03-03
