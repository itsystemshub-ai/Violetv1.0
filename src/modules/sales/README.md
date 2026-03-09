# Módulo Sales

Módulo de gestión de ventas y facturación de Violet ERP.

## Estructura

```
sales/
├── components/     # Componentes React del módulo
├── hooks/          # Custom hooks específicos de ventas
├── services/       # Servicios de lógica de negocio
├── pages/          # Páginas del módulo
├── types/          # Tipos TypeScript
└── index.ts        # Barrel export
```

## Funcionalidades

- Punto de venta (POS)
- Gestión de facturas
- Historial de ventas
- Reportes de ventas
- Programa de lealtad
- Exportación de facturas
- Gestión de pagos

## Dependencias Permitidas

- `@core/*` - Servicios core (auth, sync, database, AI)
- `@shared/*` - Componentes UI compartidos
- `@infrastructure/*` - Servicios de infraestructura

## Uso

```typescript
import { SalesPOS, useSales, useInvoices } from '@modules/sales';
```
