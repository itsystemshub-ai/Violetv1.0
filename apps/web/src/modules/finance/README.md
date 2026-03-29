# Módulo Finance

Módulo de gestión financiera y contable de Violet ERP.

## Estructura

```
finance/
├── components/     # Componentes React del módulo
├── hooks/          # Custom hooks específicos de finanzas
├── services/       # Servicios de lógica de negocio
├── pages/          # Páginas del módulo
├── types/          # Tipos TypeScript
└── index.ts        # Barrel export
```

## Funcionalidades

- Gestión de libro mayor (Ledger)
- Cálculo y gestión de IGTF
- Generación de libros contables
- Reconciliación bancaria
- Gestión de cuentas por cobrar (CxC)
- Diferencias cambiarias
- Retenciones fiscales

## Dependencias Permitidas

- `@core/*` - Servicios core (auth, sync, database, AI)
- `@shared/*` - Componentes UI compartidos
- `@infrastructure/*` - Servicios de infraestructura

## Uso

```typescript
import { FinanceDashboard, useLedger, useIGTF } from '@modules/finance';
```
