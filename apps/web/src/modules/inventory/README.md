# Módulo Inventory

Módulo de gestión de inventario y productos de Violet ERP.

## Estructura

```
inventory/
├── components/     # Componentes React del módulo
├── hooks/          # Custom hooks específicos de inventario
├── services/       # Servicios de lógica de negocio
├── pages/          # Páginas del módulo
├── types/          # Tipos TypeScript
└── index.ts        # Barrel export
```

## Funcionalidades

- Gestión de productos y catálogo
- Control de stock y movimientos
- Alertas de stock bajo
- Historial de movimientos
- Análisis y forecasting con IA
- Gestión de códigos de barras
- Reportes de inventario

## Dependencias Permitidas

- `@core/*` - Servicios core (auth, sync, database, AI)
- `@shared/*` - Componentes UI compartidos
- `@infrastructure/*` - Servicios de infraestructura

## Uso

```typescript
import { InventoryTable, useInventory, useProducts } from '@modules/inventory';
```
