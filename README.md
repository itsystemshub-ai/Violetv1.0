# 💜 Violet ERP v2.0

**Sistema Empresarial Híbrido 100% Autocontenido**

Firebird + React + Monorepo + Sincronización Local-Nube

---

## 🚀 Características Principales

### Arquitectura Híbrida

| Modo | Descripción | Caso de Uso |
|------|-------------|-------------|
| **Local** | Todo en una máquina | Negocio sin internet |
| **Cloud** | Todo en servidor central | SaaS multi-tenant |
| **Híbrido** ⭐ | Local + Sync automático | Multi-sucursal |

### Características Técnicas

- ✅ **100% Autocontenido**: Sin dependencias de servicios externos
- ✅ **Offline-First**: Funciona sin internet
- ✅ **Sincronización Nativa**: Sync entre nodos sin Supabase/externos
- ✅ **Firebird**: Base de datos robusta y probada
- ✅ **React 18 + TypeScript**: Frontend moderno
- ✅ **Socket.IO**: Tiempo real integrado
- ✅ **PWA**: Instalable en cualquier dispositivo

---

## 📁 Estructura del Monorepo

```
violet-erp/
├── backend/
│   └── api/
│       ├── src/
│       │   ├── config/          # Configuración híbrida
│       │   ├── database/        # Firebird pool
│       │   ├── middleware/      # Auth, rateLimit, errorHandler
│       │   ├── modules/         # Auth, users, products, sync
│       │   ├── services/        # Hybrid sync service
│       │   ├── socket/          # WebSocket server
│       │   ├── utils/           # Logger, helpers
│       │   └── server.js        # Servidor híbrido
│       ├── scripts/             # init-firebird.js
│       └── package.json
│
├── frontend/
│   └── web/
│       ├── src/
│       │   ├── core/
│       │   │   ├── config/      # App config híbrida
│       │   │   ├── sync/        # SyncEngine nativo
│       │   │   ├── database/    # IndexedDB (localforage)
│       │   │   └── api/         # API client
│       │   ├── modules/         # Módulos UI
│       │   └── components/      # Componentes reutilizables
│       └── package.json
│
├── database/
│   └── firebird/
│       ├── schema.sql           # Esquema + tablas sync
│       └── scripts/             # Migraciones
│
├── .env.example                 # Variables híbridas
├── package.json                 # Root monorepo
└── HYBRID_ARCHITECTURE.md       # Docs completas
```

---

## ⚡ Inicio Rápido

### 1. Prerrequisitos

```bash
# Node.js 20+
node --version

# Firebird 3.0+
# Descargar: https://firebirdsql.org
```

### 2. Instalación

```bash
# Clonar e instalar
pnpm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configurar Modo Híbrido

```env
# Servidor Maestro
HYBRID_MODE=hybrid
HYBRID_NODE_ROLE=master
HYBRID_IS_MASTER=true

# Sucursal (Slave)
HYBRID_MODE=hybrid
HYBRID_NODE_ROLE=slave
HYBRID_CLOUD_API_URL=https://master.violet-erp.com
```

### 4. Inicializar Base de Datos

```bash
pnpm db:init
```

### 5. Iniciar Sistema

```bash
# Desarrollo (backend + frontend)
pnpm dev

# O por separado
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173
```

### 6. Acceder

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000/api
- **Health**: http://localhost:3000/health

**Credenciales por defecto:**
```
Email: admin@violet-erp.com
Password: admin123
```

---

## 📚 Comandos Disponibles

### Root (Monorepo)

```bash
pnpm dev                 # Iniciar todo
pnpm dev:backend         # Solo backend
pnpm dev:frontend        # Solo frontend
pnpm build               # Build completo
pnpm db:init             # Inicializar Firebird
```

### Backend

```bash
cd backend/api
npm run dev              # Desarrollo
npm run start            # Producción
npm run db:init          # Inicializar BD
npm run lint             # Linter
```

### Frontend

```bash
cd frontend/web
npm run dev              # Vite dev
npm run build            # Build producción
npm run preview          # Preview
npm run lint             # Linter
```

---

## 🔌 Endpoints de API

### Autenticación

```
POST   /api/auth/login          - Iniciar sesión
POST   /api/auth/register       - Registrar usuario
POST   /api/auth/refresh        - Refresh token
POST   /api/auth/logout         - Cerrar sesión
GET    /api/auth/me             - Usuario actual
```

### Módulos Empresariales

```
GET/POST/PUT/DELETE  /api/users       - Usuarios
GET/POST/PUT/DELETE  /api/products    - Productos
GET/POST/PUT/DELETE  /api/sales       - Ventas
GET/POST/PUT/DELETE  /api/inventory   - Inventario
```

### Sincronización Híbrida

```
POST   /api/sync/receive      - Recibir sync desde slave
POST   /api/sync/register     - Registrar nodo
POST   /api/sync/enqueue      - Encolar registro
GET    /api/sync/stats        - Estadísticas sync
GET    /api/sync/nodes        - Nodos registrados
POST   /api/sync/cleanup      - Limpiar logs antiguos
```

---

## 🗄️ Base de Datos Firebird

### Tablas Principales

- USUARIOS, ROLES, PERMISOS
- PRODUCTOS, CATEGORIAS, UNIDADES
- CLIENTES, PROVEEDORES
- VENTAS, COMPRAS
- INVENTARIO, ALMACENES
- CUENTAS POR COBRAR/PAGAR
- AUDITORIA

### Tablas de Sincronización

- SYNC_NODES - Nodos registrados
- SYNC_LOGS - Log de cambios
- SYNC_QUEUE - Cola de prioridad
- SYNC_CONFIG - Configuración

---

## 🔧 Configuración Híbrida

### Variables Principales (.env)

```env
# Modo híbrido
HYBRID_MODE=hybrid
HYBRID_NODE_ROLE=master
HYBRID_IS_MASTER=true

# Firebird
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:/VioletERP/database/valery3.fdb

# Sync
HYBRID_SYNC_INTERVAL=15000
HYBRID_SYNC_BATCH_SIZE=20
HYBRID_SYNC_MAX_RETRIES=5

# API Key entre nodos
HYBRID_API_KEY=tu-api-key-secreta
```

---

## 📊 Flujo de Sincronización

```
┌─────────────────┐
│  Sucursal A     │  ──┐
│  (Slave)        │    │
└─────────────────┘    │   ┌──────────────┐
                       ├──▶│   Maestro    │
┌─────────────────┐    │   │   (Cloud)    │
│  Sucursal B     │  ──┘   └──────────────┘
│  (Slave)        │              │
└─────────────────┘              │
                          Broadcast
                            ▼
                    ┌──────────────┐
                    │  Sucursal C  │
                    │  (Sync)      │
                    └──────────────┘
```

### Pasos

1. Usuario crea registro en Sucursal A
2. Se guarda en Firebird local + IndexedDB
3. Sync Engine encola para sincronización
4. Cada 15s envía pendientes al Maestro
5. Maestro aplica cambios y broadcast a otras sucursales

---

## 🔐 Seguridad

- JWT con refresh tokens
- Bcrypt 12 rounds
- API Key entre nodos
- HTTPS obligatorio en producción
- Rate limiting por IP
- Auditoría de todos los cambios

---

## 📈 Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

### Estadísticas de Sync

```bash
curl http://localhost:3000/api/sync/stats
```

### Logs SQL

```sql
-- Ver sync pendientes
SELECT * FROM SYNC_LOGS 
WHERE SYNC_STATUS = 'PENDING';

-- Ver nodos activos
SELECT * FROM SYNC_NODES 
WHERE ACTIVE = 'S';
```

---

## 🎯 Casos de Uso

### 1. Farmacia Multi-Sucursal

```
5 sucursales → 1 servidor maestro
Inventario sincronizado en tiempo real
```

### 2. Clínica Sin Internet

```
Modo local standalone
Todo funciona offline
```

### 3. Retail Nacional

```
20 tiendas → Cloud central
Reportes consolidados
```

---

## 📖 Documentación

- [Arquitectura Híbrida](./HYBRID_ARCHITECTURE.md) - Docs completas del modo híbrido
- [Backend API](./backend/api/README.md) - Endpoints y configuración
- [Database Schema](./database/firebird/schema.sql) - Estructura completa

---

## 🤝 Contribuir

1. Fork del repositorio
2. Rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'Add nueva funcionalidad'`)
4. Push y Pull Request

---

## 📄 Licencia

MIT License

---

<p align="center">
  <sub>Hecho con 💜 por Violet ERP Team - 100% Autocontenido</sub>
</p>
