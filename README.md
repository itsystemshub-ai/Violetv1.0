# Violet ERP Monorepo

Sistema ERP Violet convertido a arquitectura monorepo con pnpm workspaces.

## Estructura del Monorepo

```
violet-erp-monorepo/
├── apps/
│   ├── api/          # Backend (Express + Socket.IO)
│   └── web/          # Frontend (React + Vite)
├── packages/
│   ├── config/       # Configuraciones compartidas
│   ├── database/     # Módulos de base de datos
│   ├── design-system/ # Sistema de diseño
│   ├── examples/     # Ejemplos de integración
│   ├── services/     # Servicios compartidos
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilidades compartidas
├── docs/             # Documentación del proyecto
├── package.json      # Root del monorepo
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js >= 20.0.0
- pnpm >= 9.15.0

## Instalación

```bash
pnpm install
```

## Comandos Disponibles

### Root (Monorepo)

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Ejecutar todos los apps en modo desarrollo |
| `pnpm dev:web` | Ejecutar solo el frontend |
| `pnpm dev:api` | Ejecutar solo el backend |
| `pnpm build` | Construir todos los apps |
| `pnpm build:web` | Construir solo el frontend |
| `pnpm build:api` | Construir solo el backend |
| `pnpm lint` | Ejecutar linter en todos los apps |
| `pnpm typecheck` | Verificar tipos en todos los apps |
| `pnpm test` | Ejecutar tests en todos los apps |
| `pnpm clean` | Limpiar builds de todos los apps |
| `pnpm clean:all` | Limpiar todo (node_modules, dist, etc.) |

### Apps/Web (Frontend)

```bash
cd apps/web
pnpm dev          # Iniciar servidor de desarrollo
pnpm build        # Construir para producción
pnpm preview      # Vista previa del build
pnpm lint         # Ejecutar linter
pnpm test         # Ejecutar tests
```

### Apps/API (Backend)

```bash
cd apps/api
pnpm dev          # Iniciar servidor en modo desarrollo
pnpm start        # Iniciar servidor en producción
pnpm dev:proxy    # Iniciar proxy en modo desarrollo
```

## Desarrollo

### Ejecutar frontend y backend simultáneamente

Desde la raíz del monorepo:

```bash
pnpm dev
```

### Agregar nuevas dependencias

```bash
# Dependencia de desarrollo en el frontend
pnpm add -D vite -w @violet-erp/web

# Dependencia de producción en el backend
pnpm add express -w @violet-erp/api

# Dependencia compartida en un paquete
pnpm add zod -w @violet-erp/utils
```

## Estructura de Paquetes

| Paquete | Descripción |
|---------|-------------|
| `@violet-erp/web` | Aplicación web React + Vite |
| `@violet-erp/api` | API Express + Socket.IO |
| `@violet-erp/config` | Configuraciones compartidas |
| `@violet-erp/database` | Conexiones y utilidades de BD |
| `@violet-erp/services` | Servicios compartidos |
| `@violet-erp/types` | Tipos TypeScript compartidos |
| `@violet-erp/utils` | Funciones utilitarias |

## Licencia

MIT
