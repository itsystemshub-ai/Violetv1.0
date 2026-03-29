# 💜 Violet ERP - Guía de Inicio Rápido

## 🎯 Resumen del Proyecto

Violet ERP es un **Sistema de Planificación de Recursos Empresariales** completo, construido con arquitectura monorepo moderna usando pnpm workspaces.

---

## 📁 Estructura del Monorepo

```
violet-erp-monorepo/
│
├── 📂 apps/                          # Aplicaciones principales
│   ├── api/                          # Backend (Express + Socket.IO)
│   │   ├── src/
│   │   │   ├── config/              # Configuración del servidor
│   │   │   ├── middleware/          # Middleware (auth, logs, errores)
│   │   │   ├── modules/             # Módulos del ERP
│   │   │   │   ├── auth/           # Autenticación y autorización
│   │   │   │   ├── users/          # Gestión de usuarios
│   │   │   │   ├── products/       # Productos y catálogo
│   │   │   │   ├── inventory/      # Control de inventario
│   │   │   │   ├── sales/          # Ventas y facturación
│   │   │   │   ├── customers/      # Gestión de clientes
│   │   │   │   ├── purchases/      # Compras
│   │   │   │   ├── suppliers/      # Proveedores
│   │   │   │   ├── finance/        # Finanzas
│   │   │   │   ├── accounting/     # Contabilidad
│   │   │   │   └── reports/        # Reportes y dashboard
│   │   │   ├── database/           # Inicialización y migraciones
│   │   │   ├── socket/             # Configuración WebSocket
│   │   │   ├── utils/              # Utilidades del backend
│   │   │   └── server.js           # Punto de entrada
│   │   └── package.json
│   │
│   └── web/                          # Frontend (React + Vite)
│       ├── src/
│       │   ├── app/                 # Enrutamiento
│       │   ├── components/          # Componentes UI
│       │   ├── modules/             # Módulos del ERP (frontend)
│       │   ├── stores/              # Estado global (Zustand)
│       │   ├── contexts/            # Contextos de React
│       │   ├── hooks/               # Hooks personalizados
│       │   ├── types/               # Tipos TypeScript
│       │   └── utils/               # Utilidades frontend
│       └── package.json
│
├── 📂 packages/                      # Paquetes compartidos
│   ├── types/                       # Tipos TypeScript compartidos
│   │   └── src/
│   │       └── index.ts            # Todos los tipos del sistema
│   │
│   ├── utils/                       # Utilidades compartidas
│   │   └── src/
│   │       └── index.ts            # Funciones helper
│   │
│   ├── database/                    # Capa de base de datos
│   │   └── src/
│   │       └── index.ts            # SQLite/Postgres/Supabase
│   │
│   ├── services/                    # Servicios compartidos
│   │   └── src/
│   │       └── index.ts            # API client, WebSocket, etc.
│   │
│   ├── config/                      # Configuraciones compartidas
│   ├── design-system/               # Sistema de diseño Violet
│   └── examples/                    # Ejemplos de integración
│
├── 📂 docs/                         # Documentación
├── .env.example                     # Variables de entorno de ejemplo
├── package.json                     # Root del monorepo
├── pnpm-workspace.yaml              # Configuración de workspaces
└── README.md                        # Documentación principal
```

---

## 🚀 Comandos Principales

### Instalación

```bash
# Instalar pnpm (si no lo tienes)
npm install -g pnpm

# Instalar todas las dependencias del monorepo
pnpm install
```

### Desarrollo

```bash
# Iniciar todo (frontend + backend)
pnpm violet:start

# O por separado
pnpm violet:dev:web     # Frontend en http://localhost:5173
pnpm violet:dev:api     # Backend en http://localhost:3000
```

### Build

```bash
# Construir todo
pnpm violet:build

# Construcciones individuales
pnpm build:web
pnpm build:api
```

### Calidad de Código

```bash
pnpm lint           # Ejecutar linter
pnpm lint:fix       # Fixear errores
pnpm typecheck      # Verificar tipos
pnpm test           # Ejecutar tests
pnpm clean          # Limpiar builds
pnpm clean:all      # Limpieza total
```

---

## 🔐 Credenciales por Defecto

Después de inicializar la base de datos:

```
Email: admin@violet-erp.com
Password: admin123
Role: super_admin
```

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción!

---

## 📦 Módulos Disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| 🔐 Auth | ✅ | Login, registro, JWT, RBAC |
| 👥 Usuarios | ✅ | Gestión de usuarios y roles |
| 📦 Productos | 🔄 | Catálogo de productos |
| 📊 Inventario | 🔄 | Control de stock |
| 🛒 Ventas | 🔄 | Facturación y pedidos |
| 👨‍💼 Clientes | 🔄 | CRM básico |
| 📋 Compras | 🔄 | Órdenes de compra |
| 🏭 Proveedores | 🔄 | Gestión de proveedores |
| 💰 Finanzas | 🔄 | Cuentas y pagos |
| 📈 Contabilidad | 🔄 | Libro diario y mayor |
| 📉 Reportes | 🔄 | Dashboard y análisis |

✅ = Completado | 🔄 = En progreso | ⏳ = Pendiente

---

## 🗄️ Base de Datos

### Configuración por Defecto (Desarrollo)

```env
DB_TYPE=sqlite
SQLITE_PATH=./violet.db
```

### Producción (PostgreSQL)

```env
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/violet_erp
```

### Supabase

```env
DB_TYPE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=tu-key
```

---

## 🔌 API Endpoints

### Autenticación

```
POST   /api/auth/login          - Iniciar sesión
POST   /api/auth/register       - Registrar usuario
POST   /api/auth/logout         - Cerrar sesión
POST   /api/auth/refresh        - Refresh token
GET    /api/auth/me             - Usuario actual
PUT    /api/auth/password       - Cambiar contraseña
```

### Usuarios

```
GET    /api/users               - Listar usuarios
GET    /api/users/:id           - Obtener usuario
POST   /api/users               - Crear usuario
PUT    /api/users/:id           - Actualizar usuario
DELETE /api/users/:id           - Eliminar usuario
```

### Productos, Inventario, Ventas, etc.

Ver documentación completa en `docs/API.md`

---

## 🎨 Sistema de Diseño

Violet incluye su propio design system:

```tsx
import { Button, Card, Input } from '@violet-erp/design-system';

function Example() {
  return (
    <Card>
      <Input placeholder="Buscar..." />
      <Button variant="primary">Guardar</Button>
    </Card>
  );
}
```

---

## 🧪 Testing

```bash
# Todos los tests
pnpm test

# Tests con UI
pnpm test:ui

# Coverage
pnpm test:coverage
```

---

## 📖 Documentación Completa

- [Instalación](docs/INSTALACION.md)
- [Configuración](docs/CONFIGURACION.md)
- [Módulos](docs/MODULOS.md)
- [API Reference](docs/API.md)
- [Despliegue](docs/DEPLOY.md)

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS
- Radix UI
- Framer Motion
- Recharts
- Zustand
- TanStack Query

### Backend
- Node.js + Express
- Socket.IO
- SQLite / PostgreSQL
- JWT
- Bcrypt

### Desarrollo
- pnpm (Monorepo)
- TypeScript
- ESLint + Prettier
- Vitest

---

## 💜 Equipo Violet

Desarrollado con ❤️ para revolucionar la gestión empresarial.

**Sitio Web**: violet-erp.com  
**Twitter**: @VioletERP  
**Discord**: discord.gg/violet-erp

---

<p align="center">
  <sub>Hecho con 💜 y mucho ☕ por el equipo de Violet ERP</sub>
</p>
