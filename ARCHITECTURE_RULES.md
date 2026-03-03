# Reglas de Arquitectura Modular

Este documento define las reglas estrictas de la arquitectura modular de Violet ERP.

---

## 🏗️ Estructura de Capas

```
┌─────────────────────────────────────┐
│         Modules (Dominio)           │  ← Lógica de negocio específica
│  (Finance, Inventory, Sales, HR)   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│              Core                   │  ← Servicios transversales
│  (Auth, Sync, DB, AI, Security)    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Infrastructure              │  ← Servicios externos
│  (BCV, Email, WhatsApp, PDF)       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│            Shared                   │  ← Componentes UI y utilidades
│  (UI Components, Utils)             │
└─────────────────────────────────────┘
```

---

## ✅ Reglas de Dependencias

### 1. Módulos de Dominio (`@modules/*`)

**PUEDEN importar de:**
- ✅ `@core/*` - Servicios core (auth, sync, database, AI)
- ✅ `@shared/*` - Componentes UI compartidos
- ✅ `@infrastructure/*` - Servicios de infraestructura

**NO PUEDEN importar de:**
- ❌ Otros módulos (`@modules/otro-modulo`)
- ❌ Imports profundos de otros módulos

**Ejemplo correcto:**
```typescript
// ✅ CORRECTO
import { useAuth } from '@core/auth';
import { Button } from '@shared/components/ui';
import { bcvService } from '@infrastructure/bcv';
```

**Ejemplo incorrecto:**
```typescript
// ❌ INCORRECTO
import { useSales } from '@modules/sales';
import { InventoryTable } from '@modules/inventory/components/InventoryTable';
```

### 2. Core (`@core/*`)

**PUEDEN importar de:**
- ✅ `@shared/*` - Utilidades compartidas

**NO PUEDEN importar de:**
- ❌ `@modules/*` - Módulos de dominio
- ❌ `@infrastructure/*` - Servicios de infraestructura

**Ejemplo correcto:**
```typescript
// ✅ CORRECTO
import { logger } from '@shared/utils/logger';
import { formatDate } from '@shared/utils/formatters';
```

**Ejemplo incorrecto:**
```typescript
// ❌ INCORRECTO
import { FinanceService } from '@modules/finance';
import { bcvService } from '@infrastructure/bcv';
```

### 3. Infrastructure (`@infrastructure/*`)

**PUEDEN importar de:**
- ✅ `@shared/*` - Utilidades compartidas

**NO PUEDEN importar de:**
- ❌ `@modules/*` - Módulos de dominio
- ❌ `@core/*` - Servicios core

### 4. Shared (`@shared/*`)

**PUEDEN importar de:**
- ✅ Librerías externas (npm packages)

**NO PUEDEN importar de:**
- ❌ `@modules/*` - Módulos de dominio
- ❌ `@core/*` - Servicios core
- ❌ `@infrastructure/*` - Servicios de infraestructura

---

## 📦 Barrel Exports

Todos los módulos deben exportar sus APIs públicas a través de un archivo `index.ts`:

```typescript
// src/modules/finance/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
export * from './pages';
```

**Uso:**
```typescript
// ✅ CORRECTO - Usar barrel export
import { FinanceDashboard, useLedger } from '@modules/finance';

// ❌ INCORRECTO - Import profundo
import { FinanceDashboard } from '@modules/finance/components/FinanceDashboard';
```

---

## 🔒 Encapsulación

### Archivos Privados

Los archivos que no deben ser exportados deben tener el prefijo `_`:

```
finance/
├── components/
│   ├── FinanceDashboard.tsx      # Público
│   └── _InternalHelper.tsx       # Privado (no exportar)
```

### Tipos Internos

Los tipos que solo se usan dentro del módulo no deben exportarse:

```typescript
// finance/types/finance.types.ts

// ✅ Exportar - Usado por otros módulos
export interface Invoice {
  id: string;
  amount: number;
}

// ❌ No exportar - Solo interno
interface InternalCalculation {
  // ...
}
```

---

## 🧪 Testing

### Tests Unitarios

Los tests deben estar junto al archivo que prueban:

```
finance/
├── services/
│   ├── accounting.service.ts
│   └── accounting.service.test.ts
```

### Tests de Integración

Los tests de integración van en una carpeta `__tests__`:

```
finance/
├── __tests__/
│   └── finance-integration.test.ts
```

---

## 📝 Convenciones de Nombres

### Archivos

- **Componentes**: `PascalCase.tsx` (ej: `FinanceDashboard.tsx`)
- **Hooks**: `camelCase.ts` (ej: `useFinance.ts`)
- **Servicios**: `camelCase.service.ts` (ej: `accounting.service.ts`)
- **Tipos**: `camelCase.types.ts` (ej: `finance.types.ts`)
- **Tests**: `*.test.ts` o `*.spec.ts`

### Exports

- **Componentes**: Named export (ej: `export function FinanceDashboard()`)
- **Hooks**: Named export (ej: `export function useFinance()`)
- **Servicios**: Named export o default (ej: `export class AccountingService`)
- **Tipos**: Named export (ej: `export interface Invoice`)

---

## 🚫 Anti-Patrones

### 1. Dependencias Circulares

```typescript
// ❌ INCORRECTO
// finance/services/a.ts
import { b } from './b';

// finance/services/b.ts
import { a } from './a';
```

**Solución**: Extraer la lógica compartida a un tercer archivo.

### 2. God Objects

```typescript
// ❌ INCORRECTO - Servicio que hace demasiado
class FinanceService {
  calculateIGTF() {}
  generateLedger() {}
  reconcileBank() {}
  calculatePayroll() {}  // ← Esto debería estar en HR
  manageInventory() {}   // ← Esto debería estar en Inventory
}
```

**Solución**: Dividir en servicios más pequeños y específicos.

### 3. Imports Profundos entre Módulos

```typescript
// ❌ INCORRECTO
import { InvoiceCalculator } from '@modules/sales/services/internal/calculator';
```

**Solución**: Usar barrel exports y APIs públicas.

---

## 🔍 Validación

### ESLint

El proyecto tiene reglas de ESLint configuradas para validar estas reglas:

```json
{
  "no-restricted-imports": [
    "error",
    {
      "patterns": [
        {
          "group": ["@modules/*/components/*"],
          "message": "Use barrel exports instead"
        },
        {
          "group": ["../modules/*"],
          "message": "Modules cannot import from other modules"
        }
      ]
    }
  ]
}
```

### Script de Validación

Ejecutar para validar dependencias:

```bash
npm run validate:deps
```

---

## 📚 Recursos

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

## 🤝 Contribuir

Al agregar nuevas funcionalidades:

1. ✅ Identificar el módulo correcto
2. ✅ Seguir la estructura de carpetas
3. ✅ Respetar las reglas de dependencias
4. ✅ Agregar tests
5. ✅ Actualizar barrel exports
6. ✅ Documentar en README del módulo

---

**Última actualización**: 2026-03-03
