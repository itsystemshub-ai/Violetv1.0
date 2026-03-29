# 💜 Violet ERP v2.0

**Sistema Empresarial Avanzado con Firebird + React + pnpm Monorepo**

![Versión](https://img.shields.io/badge/versión-2.0.0-purple)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-yellow)
![Firebird](https://img.shields.io/badge/firebird-3.0+-red)
![Tests](https://img.shields.io/badge/tests-vitest-blue)

---

## 🚀 Características Principales

### Arquitectura Avanzada

| Característica | Tecnología |
|----------------|------------|
| **Monorepo** | pnpm workspaces |
| **Backend** | Express + Firebird Pool |
| **Frontend** | React 18 + Vite + TypeScript |
| **Base de Datos** | Firebird 3.0+ |
| **Cache** | Redis (opcional) |
| **WebSockets** | Socket.IO |
| **Tests** | Vitest + Testing Library |
| **CI/CD** | GitHub Actions |

### Módulos Empresariales

- ✅ **Auth** - JWT, RBAC, refresh tokens
- ✅ **Usuarios** - CRUD completo con permisos
- ✅ **Productos** - Gestión con stock en tiempo real
- ✅ **Inventario** - Múltiples almacenes, movimientos
- 🔄 **Ventas** - Facturación, cotizaciones
- 🔄 **Compras** - Órdenes, proveedores
- 🔄 **Finanzas** - Cuentas por cobrar/pagar
- 🔄 **Contabilidad** - Asientos, libros
- 🔄 **Reportes** - Dashboard, analytics

---

## 📁 Estructura del Monorepo

```
violet-erp/
├── .github/workflows/       # CI/CD pipelines
├── backend/
│   └── api/
│       ├── src/
│       │   ├── config/      # Configuración
│       │   ├── database/    # Firebird pool
│       │   ├── middleware/  # Auth, rate limit, logs
│       │   ├── modules/     # Rutas API
│       │   ├── services/    # Lógica de negocio
│       │   ├── socket/      # WebSockets
│       │   └── utils/       # Logger, helpers
│       ├── tests/
│       │   ├── services/    # Tests unitarios
│       │   └── integration/ # Tests de integración
│       ├── ecosystem.config.cjs  # PM2
│       └── package.json
│
├── frontend/
│   └── web/
│       ├── src/
│       │   ├── core/        # Providers, router, initializer
│       │   ├── modules/     # Módulos UI
│       │   ├── stores/      # Zustand stores
│       │   ├── components/  # Componentes reutilizables
│       │   └── test/        # Setup de tests
│       ├── tests/           # Tests de componentes
│       └── package.json
│
├── database/
│   └── firebird/
│       ├── schema.sql       # Esquema de BD
│       └── scripts/         # Migraciones
│
├── package.json             # Root monorepo
└── pnpm-workspace.yaml      # Workspaces config
```

---

## ⚡ Inicio Rápido

### 1. Prerrequisitos

```bash
# Node.js 20+
node --version  # v20.x o superior

# pnpm 9+
pnpm --version  # 9.15.0 o superior

# Firebird 3.0+
# Descargar: https://firebirdsql.org
```

### 2. Instalación

```bash
# Clonar repositorio
git clone <repo-url> violet-erp
cd violet-erp

# Instalar dependencias (automático con pnpm)
pnpm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configurar Firebird

```bash
# Editar .env
FIREBIRD_DATABASE=C:/ruta/a/tu/base.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Crear base de datos
# 1. Abre IBExpert o FlameRobin
# 2. Conéctate a Firebird
# 3. Crea nueva base de datos
# 4. Ejecuta database/firebird/schema.sql
```

### 4. Iniciar Desarrollo

```bash
# Iniciar todo (backend + frontend)
pnpm dev

# O por separado
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173
```

### 5. Acceder

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api
- **Health**: http://localhost:3000/health

**Credenciales por defecto:**
```
Email: admin@violet-erp.com
Password: admin123
```

---

## 📚 Comandos Disponidos

### Root (Monorepo)

```bash
pnpm dev                 # Iniciar todo
pnpm build               # Construir todo
pnpm test                # Ejecutar tests
pnpm lint                # Linter
pnpm typecheck           # TypeScript check

pnpm clean               # Limpiar builds
pnpm clean:all           # Limpieza total
```

### Backend

```bash
cd backend/api
pnpm dev                 # Desarrollo con nodemon
pnpm start               # Producción
pnpm start:prod          # PM2 production mode
pnpm test                # Tests unitarios
pnpm test:integration    # Tests de integración
pnpm test:coverage       # Coverage report
pnpm db:migrate          # Migraciones
pnpm db:backup           # Backup BD
```

### Frontend

```bash
cd frontend/web
pnpm dev                 # Vite dev server
pnpm build               # Build producción
pnpm preview             # Preview build
pnpm test                # Tests con Vitest
pnpm test:ui             # Tests con UI
pnpm test:coverage       # Coverage report
pnpm analyze             # Bundle analyzer
```

---

## 🧪 Testing

### Tests Unitarios

```bash
# Backend
pnpm run test:backend

# Frontend  
pnpm run test:frontend

# Coverage completo
pnpm run test:coverage
```

### Tests de Integración

```bash
# Requiere Firebird corriendo
pnpm run test:integration
```

### Ejemplos de Tests

```typescript
// Backend
describe('AuthService', () => {
  it('should generate valid JWT token', () => {
    const token = authService.generateAccessToken(user, permissions);
    expect(token.split('.')).toHaveLength(3);
  });
});

// Frontend
describe('Login Page', () => {
  it('should render login form', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();
  });
});
```

---

## 🔧 Configuración Avanzada

### Firebird Connection Pool

```javascript
// backend/api/src/database/firebird-pool.js
{
  maxSize: 10,
  minSize: 2,
  acquireTimeout: 5000,
  idleTimeout: 30000,
}
```

### Redis Cache (Opcional)

```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0
```

### Rate Limiting

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Logs Avanzados

```env
LOG_LEVEL=debug
LOG_MAX_SIZE=10m
LOG_MAX_FILES=30d
LOG_HTTP_ENABLED=true
```

---

## 📊 API Endpoints

### Autenticación

```
POST   /api/auth/login          - Iniciar sesión
POST   /api/auth/register       - Registrar usuario
POST   /api/auth/refresh        - Refresh token
POST   /api/auth/logout         - Cerrar sesión
GET    /api/auth/me             - Usuario actual
PUT    /api/auth/password       - Cambiar contraseña
```

### Productos

```
GET    /api/products            - Listar productos
GET    /api/products/:id        - Obtener producto
POST   /api/products            - Crear producto
PUT    /api/products/:id        - Actualizar producto
DELETE /api/products/:id        - Eliminar producto
POST   /api/products/stock      - Actualizar stock
```

### Usuarios

```
GET    /api/users               - Listar usuarios
GET    /api/users/:id           - Obtener usuario
POST   /api/users               - Crear usuario
PUT    /api/users/:id           - Actualizar usuario
DELETE /api/users/:id           - Eliminar usuario
```

---

## 🏗️ CI/CD con GitHub Actions

### Pipelines Disponibles

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Tests en Node 20.x y 22.x
   - Build backend y frontend
   - Upload de artifacts

2. **Code Quality** (`.github/workflows/code-quality.yml`)
   - ESLint
   - Security audit
   - Snyk scan

### Variables de Entorno para CI/CD

```yaml
# Secrets requeridos
CODECOV_TOKEN: tu-token
SNYK_TOKEN: tu-token
```

---

## 🔐 Seguridad

### Best Practices Implementadas

- ✅ JWT con refresh tokens
- ✅ Bcrypt con 12 rounds
- ✅ Rate limiting por IP
- ✅ Helmet.js security headers
- ✅ CORS configurado
- ✅ Input validation con Zod
- ✅ SQL injection prevention (Firebird params)
- ✅ XSS protection

### Headers de Seguridad

```javascript
// Helmet.js configurado automáticamente
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
```

---

## 📈 Monitoreo

### Logs

```bash
# Ver logs en tiempo real
tail -f backend/api/logs/combined-*.log
tail -f backend/api/logs/error-*.log
tail -f backend/api/logs/http-*.log
```

### Métricas PM2

```bash
pm2 monit
pm2 show violet-erp-api
pm2 logs violet-erp-api
```

### Sentry (Opcional)

```env
SENTRY_ENABLED=true
SENTRY_DSN=https://tu-dsn@sentry.io/proyecto
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, sin cambios de código
refactor: refactorización
test: agregar tests
chore: cambios en build/config
```

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

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
