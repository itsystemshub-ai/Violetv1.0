# Backend Modules

Módulos verticales del backend siguiendo Clean Architecture.

## Estructura de un Módulo

```
module-name/
├── controllers/    # Capa de presentación (API endpoints)
├── services/       # Capa de lógica de negocio
├── routes/         # Definición de rutas
├── models/         # Modelos de base de datos
└── types/          # Tipos e interfaces TypeScript
```

## Módulos Disponibles

- **finance**: Gestión financiera y contable
- **inventory**: Gestión de inventario y productos
- **sales**: Ventas y facturación
- **hr**: Recursos humanos y nómina
- **purchases**: Compras y proveedores
- **accounts-receivable**: Cuentas por cobrar

## Reglas de Dependencias

- Los módulos NO pueden importar de otros módulos
- Los módulos pueden importar de `core/*`
- Los módulos pueden importar de `infrastructure/*`

## Ejemplo de Uso

```typescript
// routes/finance.routes.ts
import { Router } from 'express';
import * as ledgerController from '../controllers/ledger.controller';

const router = Router();
router.get('/ledger', ledgerController.getLedger);

export default router;
```
