# 📁 Backend - Violet ERP

Estructura organizada y profesional del backend del sistema Violet ERP.

## 📂 Estructura de Carpetas

```
backend/
├── src/
│   ├── config/          # Configuración del proyecto
│   │   ├── database.js  # Configuración de SQLite
│   │   └── server.js    # Configuración del servidor
│   │
│   ├── controllers/     # Manejo de las peticiones
│   │   ├── sql.controller.js
│   │   └── groq.controller.js
│   │
│   ├── middlewares/     # Funciones intermedias
│   │   ├── cors.js
│   │   └── errorHandler.js
│   │
│   ├── models/          # Definición de los modelos
│   │   └── database.model.js
│   │
│   ├── routes/          # Definición de las rutas
│   │   ├── api.routes.js
│   │   └── groq.routes.js
│   │
│   ├── services/        # Lógica del negocio
│   │   └── sync.service.js
│   │
│   ├── utils/           # Funciones reutilizables
│   │   └── crypto.js
│   │
│   ├── app.js           # Aplicación Express
│   ├── server.js        # Servidor principal
│   └── proxy.js         # Servidor proxy de IA
│
├── package.json
└── README.md
```

## 🚀 Uso

### Servidor Principal
```bash
cd backend
npm install
npm start
```

### Servidor Proxy
```bash
npm run proxy
```

### Desarrollo
```bash
npm run dev          # Servidor principal con nodemon
npm run dev:proxy    # Servidor proxy con nodemon
```

## 📝 Descripción de Componentes

### Config
- **database.js**: Configuración y conexión a SQLite
- **server.js**: Configuración de puertos y CORS

### Controllers
- **sql.controller.js**: Manejo de consultas SQL directas
- **groq.controller.js**: Proxy para Groq API (IA)

### Middlewares
- **cors.js**: Configuración de CORS
- **errorHandler.js**: Manejo centralizado de errores

### Models
- **database.model.js**: Modelo base para operaciones de BD

### Routes
- **api.routes.js**: Rutas de la API principal
- **groq.routes.js**: Rutas del proxy de IA

### Services
- **sync.service.js**: Sincronización con la nube (Supabase)

### Utils
- **crypto.js**: Utilidades de criptografía

## 🔌 Endpoints

### API Principal (Puerto 8080)
- `GET /api/ping` - Health check
- `POST /api/sql` - Ejecutar consulta SQL
- `POST /api/mutate` - Mutación de datos

### Proxy IA (Puerto 3001)
- `GET /api/groq/health` - Health check
- `POST /api/groq/chat` - Chat con IA

## 🔒 Seguridad

- CORS configurado
- Manejo de errores centralizado
- Validación de API keys
- Logs de auditoría

## 📦 Dependencias

- **express**: Framework web
- **cors**: Manejo de CORS
- **socket.io**: WebSockets
- **better-sqlite3**: Base de datos SQLite
- **@supabase/supabase-js**: Cliente de Supabase
