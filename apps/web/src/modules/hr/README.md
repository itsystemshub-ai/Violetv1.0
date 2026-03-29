# Módulo HR

Módulo de gestión de recursos humanos de Violet ERP.

## Estructura

```
hr/
├── components/     # Componentes React del módulo
├── hooks/          # Custom hooks específicos de RRHH
├── services/       # Servicios de lógica de negocio
├── pages/          # Páginas del módulo
├── types/          # Tipos TypeScript
└── index.ts        # Barrel export
```

## Funcionalidades

- Directorio de empleados
- Gestión de nómina
- Cálculo de prestaciones sociales
- Gestión de vacaciones
- Reportes de RRHH

## Dependencias Permitidas

- `@core/*` - Servicios core (auth, sync, database, AI)
- `@shared/*` - Componentes UI compartidos
- `@infrastructure/*` - Servicios de infraestructura

## Uso

```typescript
import { EmployeeDirectory, useHR, usePayroll } from '@modules/hr';
```
