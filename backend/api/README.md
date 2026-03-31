# 💜 Violet ERP - Backend API

**Backend API con Express + Firebird**

---

## 🚀 Inicio Rápido

### Instalar

```bash
cd backend/api
npm install
```

### Iniciar

```bash
# Desarrollo
npm run dev

# Producción
npm run start
```

### Inicializar Base de Datos

```bash
npm run db:init
```

---

## 📂 Estructura

```
backend/api/
├── src/
│   ├── config/        # Configuración (env.js)
│   ├── controllers/   # Controladores
│   ├── database/      # Firebird pool
│   ├── middleware/    # Auth, rateLimit, errorHandler
│   ├── models/        # Modelos de datos
│   ├── modules/       # Módulos (auth, users, products)
│   ├── services/      # Servicios de negocio
│   ├── socket/        # WebSockets (Socket.IO)
│   ├── utils/         # Utilidades (logger, helpers)
│   └── server.js      # Entry point
├── scripts/           # init-firebird.js
├── tests/
└── package.json
```

---

## 📚 Comandos

```bash
npm run dev          # Desarrollo con nodemon
npm run start        # Producción
npm run db:init      # Inicializar Firebird
npm run test         # Tests
npm run lint         # Linter
npm run clean        # Limpiar dist/logs
```

---

## 🔌 Endpoints API

### Autenticación
```
POST   /api/auth/login       - Iniciar sesión
POST   /api/auth/register    - Registrar usuario
POST   /api/auth/refresh     - Refresh token
POST   /api/auth/logout      - Cerrar sesión
GET    /api/auth/me          - Usuario actual
```

### Usuarios
```
GET    /api/users            - Listar usuarios
GET    /api/users/:id        - Obtener usuario
POST   /api/users            - Crear usuario
PUT    /api/users/:id        - Actualizar usuario
DELETE /api/users/:id        - Eliminar usuario
```

### Productos
```
GET    /api/products         - Listar productos
GET    /api/products/:id     - Obtener producto
POST   /api/products         - Crear producto
PUT    /api/products/:id     - Actualizar producto
DELETE /api/products/:id     - Eliminar producto
```

---

## 🔧 Configuración

### Variables de Entorno (.env)

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Firebird
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:/VioletERP/database/valery3.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# JWT
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=change-this-too
JWT_REFRESH_EXPIRES_IN=7d

# Logs
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

---

## 🏗️ Arquitectura

### Middleware
- **cors**: CORS habilitado
- **helmet**: Security headers
- **compression**: Gzip compression
- **express-rate-limit**: Rate limiting
- **morgan**: HTTP logging

### Base de Datos
- **Firebird 3.0+**: Base de datos principal
- **Connection Pool**: 2-10 conexiones
- **Transacciones**: Soporte completo

### Auth
- **JWT**: Access tokens (1h)
- **Refresh Tokens**: (7d)
- **Bcrypt**: Hash de contraseñas (12 rounds)

### WebSockets
- **Socket.IO**: Tiempo real
- **Eventos**: nodos, config, sync

---

## 🧪 Tests

```bash
npm run test           # Tests unitarios
npm run test:coverage  # Coverage report
```

---

## 📦 Dependencias Principales

- express ^5.2.1
- node-firebird ^1.0.10
- jsonwebtoken ^9.0.3
- bcrypt ^6.0.0
- socket.io ^4.8.3
- winston ^3.11.0
- zod ^3.25.76

---

<p align="center">
  <sub>Hecho con 💜 por Violet ERP Team</sub>
</p>
