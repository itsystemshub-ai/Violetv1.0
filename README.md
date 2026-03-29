# 💜 Violet ERP

**Sistema de Planificación de Recursos Empresariales - Arquitectura Híbrida Local + Nube**

Violet ERP es un sistema empresarial completo con **sincronización bidireccional automática**, diseñado para operar offline y online simultáneamente.

![Versión](https://img.shields.io/badge/versión-1.0.0-purple)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-yellow)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)

---

## 🚀 Características Principales

### 🏗️ Arquitectura Híbrida

| Característica | Descripción |
|----------------|-------------|
| **Offline-First** | Opera sin conexión a internet |
| **Sync Automático** | Sincronización bidireccional cada 30s |
| **Multi-sucursal** | Cada sucursal opera independiente |
| **Cloud Central** | Datos centralizados en la nube |
| **Resolución Conflictos** | Configurable (cloud-wins, local-wins) |
| **Backup Automático** | Backups locales y en la nube |

### 📦 Módulos Empresariales

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 🔐 **Auth & RBAC** | Autenticación JWT, autorización basada en roles y permisos | ✅ |
| 👥 **Usuarios** | Gestión de usuarios, roles, permisos y departamentos | ✅ |
| 📦 **Inventario** | Control de stock, almacenes, movimientos de productos | ✅ |
| 🛒 **Ventas** | Facturación, cotizaciones, pedidos, clientes | ✅ |
| 📊 **Compras** | Órdenes de compra, proveedores, recepción | ✅ |
| 💰 **Finanzas** | Cuentas por cobrar/pagar, flujo de caja | ✅ |
| 📈 **Contabilidad** | Libro diario, mayor, balances, estados financieros | ✅ |
| 📉 **Reportes** | Dashboard personalizado, reportes analíticos | ✅ |
| ⚙️ **Configuración** | Parámetros del sistema, auditoría, notificaciones | ✅ |

### Funcionalidades Avanzadas

- ✨ **Arquitectura Monorepo** con pnpm workspaces
- 🔌 **Multi-base de datos**: SQLite (dev), PostgreSQL (prod), Supabase
- 🔄 **Sincronización en tiempo real** con WebSockets
- 🔔 **Sistema de notificaciones** push y en-app
- 📝 **Auditoría completa** de todas las operaciones
- 🎨 **Sistema de diseño** propio (Violet Design System)
- 🌐 **API RESTful** completa con documentación
- 📱 **Responsive design** para todos los dispositivos
- 🌙 **Modo oscuro/claro** automático
- 🌍 **Multi-idioma** preparado (i18n)
- 📊 **Gráficos y dashboards** con Recharts
- 📄 **Exportación** a PDF, Excel, CSV

---

## 📁 Estructura del Monorepo

```
violet-erp-monorepo/
│
├── apps/
│   ├── web/                    # Aplicación Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── app/           # Enrutamiento y páginas
│   │   │   ├── components/    # Componentes UI
│   │   │   ├── modules/       # Módulos del ERP
│   │   │   ├── stores/        # Estado global (Zustand)
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── api/                    # Backend (Express + Socket.IO)
│       ├── src/
│       │   ├── modules/       # Módulos del servidor
│       │   ├── middleware/    # Middleware (auth, validation)
│       │   ├── services/      # Lógica de negocio
│       │   └── database/      # Scripts y migraciones
│       └── package.json
│
├── packages/
│   ├── types/                 # Tipos TypeScript compartidos
│   │   ├── src/
│   │   │   └── index.ts      # Todos los tipos del sistema
│   │   └── package.json
│   │
│   ├── utils/                 # Utilidades compartidas
│   │   ├── src/
│   │   │   └── index.ts      # Funciones helper
│   │   └── package.json
│   │
│   ├── database/              # Capa de base de datos
│   │   ├── src/
│   │   │   └── index.ts      # Conexiones SQLite/Postgres/Supabase
│   │   └── package.json
│   │
│   ├── services/              # Servicios compartidos
│   │   ├── src/
│   │   │   └── index.ts      # API client, WebSocket, notificaciones
│   │   └── package.json
│   │
│   ├── config/                # Configuraciones compartidas
│   ├── design-system/         # Sistema de diseño Violet
│   └── examples/              # Ejemplos de integración
│
├── docs/                      # Documentación
└── package.json               # Root del monorepo
```

---

## 🛠️ Tecnologías

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos
- **Radix UI** - Componentes accesibles
- **Framer Motion** - Animaciones
- **Recharts** - Gráficos
- **Zustand** - Estado global
- **TanStack Query** - Data fetching
- **React Hook Form** + **Zod** - Formularios

### Backend
- **Node.js** + **Express**
- **Socket.IO** - Tiempo real
- **Better-SQLite3** / **PostgreSQL**
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas

### Desarrollo
- **pnpm** - Package manager
- **TypeScript** - Type safety
- **ESLint** + **Prettier** - Code quality
- **Vitest** - Testing
- **Husky** + **lint-staged** - Git hooks

---

## 📋 Requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Git** (para clonar el repositorio)

---

## ⚡ Inicio Rápido

### 1. Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
```

### 2. Clonar e instalar

```bash
# Clonar el repositorio
git clone <tu-repositorio-violet>
cd violet-erp-monorepo

# Instalar todas las dependencias
pnpm install
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

### 4. Iniciar desarrollo

```bash
# Iniciar frontend y backend simultáneamente
pnpm violet:start

# O por separado:
pnpm violet:dev:web    # Solo frontend
pnpm violet:dev:api    # Solo backend
```

### 5. Abrir en el navegador

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Docs API**: http://localhost:3000/api/docs

---

## 📚 Comandos Disponibles

### Root (Monorepo)

```bash
# Desarrollo
pnpm violet:start          # Iniciar todo (web + api)
pnpm violet:dev:web        # Solo frontend
pnpm violet:dev:api        # Solo backend

# Build
pnpm violet:build          # Construir todo
pnpm build:web             # Solo frontend
pnpm build:api             # Solo backend

# Calidad de código
pnpm lint                  # Ejecutar linter
pnpm lint:fix              # Fixear errores
pnpm typecheck             # Verificar tipos
pnpm test                  # Ejecutar tests

# Limpieza
pnpm clean                 # Limpiar builds
pnpm clean:all             # Limpieza total

# Dependencias
pnpm deps:update           # Actualizar deps
pnpm deps:outdated         # Ver deps desactualizadas
pnpm audit                 # Auditoría de seguridad
```

### Workspaces Individuales

```bash
# Frontend
cd apps/web
pnpm dev
pnpm build
pnpm preview

# Backend
cd apps/api
pnpm dev
pnpm start

# Paquetes
cd packages/types
pnpm build
```

---

## 🔐 Autenticación y Roles

Violet ERP incluye un sistema RBAC (Role-Based Access Control) completo:

### Roles por Defecto

| Rol | Permisos |
|-----|----------|
| **Super Admin** | Acceso total al sistema |
| **Admin** | Gestión completa excepto configuración global |
| **Manager** | Aprobación de operaciones, reportes |
| **User** | Operaciones básicas del día a día |
| **Viewer** | Solo lectura, reportes |

### Permisos por Módulo

Cada módulo tiene permisos granulares:
- `create` - Crear registros
- `read` - Ver registros
- `update` - Editar registros
- `delete` - Eliminar registros
- `export` - Exportar datos
- `import` - Importar datos
- `approve` - Aprobar operaciones

---

## 📦 Módulos del Sistema

### 1. Autenticación (Auth)
- Login/Logout
- Registro de usuarios
- Recuperación de contraseña
- Verificación de email
- JWT tokens
- Refresh tokens
- Sesiones múltiples

### 2. Usuarios y Permisos
- Gestión de usuarios
- Roles y permisos
- Departamentos
- Audit logs de actividad

### 3. Inventario y Productos
- Catálogo de productos
- Categorías y marcas
- Control de stock
- Múltiples almacenes
- Movimientos de inventario
- Alertas de stock bajo
- Código de barras

### 4. Ventas y Facturación
- Cotizaciones
- Pedidos de venta
- Facturación electrónica
- Notas de crédito
- Gestión de clientes
- Historial de ventas
- Comisiones de vendedores

### 5. Compras y Proveedores
- Órdenes de compra
- Recepción de mercancía
- Gestión de proveedores
- Evaluación de proveedores
- Historial de compras

### 6. Finanzas y Contabilidad
- Plan de cuentas
- Libro diario
- Libro mayor
- Balances
- Estados financieros
- Flujo de caja
- Cuentas por cobrar
- Cuentas por pagar

### 7. Reportes y Dashboard
- Dashboard personalizable
- Reportes de ventas
- Reportes de inventario
- Reportes financieros
- Análisis de tendencias
- Exportación a PDF/Excel

---

## 🔌 API REST

La API de Violet ERP sigue estándares RESTful:

### Endpoints Principales

```
/auth          - Autenticación
/users         - Usuarios
/roles         - Roles y permisos
/products      - Productos
/categories    - Categorías
/inventory     - Inventario
/sales         - Ventas
/customers     - Clientes
/purchases     - Compras
/suppliers     - Proveedores
/finance       - Finanzas
/accounting    - Contabilidad
/reports       - Reportes
/settings      - Configuración
/audit         - Auditoría
```

### Ejemplo de Uso

```typescript
import { ApiService } from '@violet-erp/services';

const api = new ApiService({
  baseURL: 'http://localhost:3000/api',
  accessToken: 'tu-token',
});

// Obtener productos
const products = await api.get('/products');

// Crear venta
const sale = await api.post('/sales', {
  customerId: '123',
  items: [...],
  paymentMethod: 'card',
});
```

---

## 🗄️ Base de Datos

### Configuración Multi-DB

```env
# Desarrollo (SQLite)
DB_TYPE=sqlite
SQLITE_PATH=./violet.db

# Producción (PostgreSQL)
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/violet_erp

# Supabase
DB_TYPE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=tu-key
```

### Migraciones

```bash
cd apps/api
pnpm migrate         # Ejecutar migraciones
pnpm migrate:rollback  # Revertir migración
pnpm seed            # Poblar datos de prueba
```

---

## 🎨 Sistema de Diseño

Violet incluye su propio design system basado en Radix UI:

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
# Ejecutar todos los tests
pnpm test

# Tests con UI
pnpm test:ui

# Coverage
pnpm test:coverage

# Tests por workspace
cd apps/web && pnpm test
```

---

## 📖 Documentación

- [Guía de Instalación](docs/INSTALACION.md)
- [Configuración](docs/CONFIGURACION.md)
- [Módulos](docs/MODULOS.md)
- [API Reference](docs/API.md)
- [Despliegue](docs/DEPLOY.md)

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## 💜 Equipo Violet

Desarrollado con ❤️ para revolucionar la gestión empresarial.

**Sitio Web**: [violet-erp.com](https://violet-erp.com)  
**Twitter**: [@VioletERP](https://twitter.com/VioletERP)  
**Discord**: [Comunidad Violet](https://discord.gg/violet-erp)

---

<p align="center">
  <sub>Hecho con 💜 y mucho ☕ por el equipo de Violet ERP</sub>
</p>
