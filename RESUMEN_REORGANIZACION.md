# Resumen de Reorganización - Violet ERP

## ✅ Cambios Realizados

### 1. Servidor Unificado (`backend/server.js`)

Se creó un **servidor único** que reemplaza los archivos anteriores:
- ❌ `backend/src/server.js` (antiguo)
- ❌ `backend/src/proxy.js` (antiguo)
- ✅ `backend/server.js` (nuevo - unificado)

**Ventajas:**
- Detección automática de entorno (desarrollo/producción)
- Rutas configuradas automáticamente según el contexto
- Logging completo y detallado
- Manejo de archivos estáticos optimizado
- Servidor principal + proxy de IA en un solo lugar

### 2. Rutas Automáticas

El servidor ahora detecta automáticamente dónde están los archivos:

```javascript
// DESARROLLO
{
  root: '/proyecto',
  dist: '/proyecto/dist',
  backend: '/proyecto/backend'
}

// PRODUCCIÓN (Electron)
{
  root: 'C:/Program Files/Violet ERP/resources',
  dist: 'C:/Program Files/Violet ERP/resources/dist',
  backend: 'C:/Program Files/Violet ERP/resources/app.asar/backend'
}
```

### 3. Electron Main Simplificado

`electron/main.cjs` ahora solo carga el servidor unificado:

```javascript
const serverModule = require('../backend/server.js');
startServer = serverModule.startServer;
startProxyServer = serverModule.startProxyServer;
```

### 4. Configuración de Empaquetado

`package.json` actualizado para estructura clara:

```json
{
  "files": [
    "electron/**/*",
    "backend/**/*"
  ],
  "extraResources": [
    {
      "from": "dist",
      "to": "dist"
    }
  ]
}
```

## 📁 Estructura Final

```
proyecto/
├── electron/
│   ├── main.cjs          ⭐ Proceso principal
│   ├── preload.cjs
│   ├── db.cjs
│   └── splash.html
├── backend/
│   ├── server.js         ⭐ SERVIDOR UNIFICADO (NUEVO)
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── config/
│       └── middleware/
├── src/                  (React)
├── dist/                 (Build de Vite)
└── package.json
```

## 🚀 Empaquetado

```
Violet ERP/
├── Violet ERP.exe
├── resources/
│   ├── app.asar
│   │   ├── electron/
│   │   └── backend/
│   │       └── server.js  ⭐ SERVIDOR UNIFICADO
│   └── dist/              ⭐ ARCHIVOS ESTÁTICOS
│       ├── index.html
│       └── assets/
```

## 🔧 Funcionalidades del Servidor Unificado

### Detección de Entorno
```javascript
const isDev = process.env.NODE_ENV !== 'production' && !process.resourcesPath;
const isElectron = !!process.resourcesPath;
```

### Rutas Inteligentes
```javascript
function getPaths() {
  if (isDev) {
    return { /* rutas de desarrollo */ };
  } else if (isElectron) {
    return { /* rutas de producción Electron */ };
  } else {
    return { /* rutas standalone */ };
  }
}
```

### Logging Completo
- Logs de inicio del servidor
- Logs de cada request
- Logs de errores detallados
- Verificación de existencia de archivos

### Health Check
```
GET /api/health
```
Retorna información del servidor y rutas configuradas.

## 📝 Comandos

```bash
# Desarrollo
npm run dev              # Solo frontend
npm run electron:dev     # Frontend + Electron

# Producción
npm run build            # Build de Vite
npm run electron:dist    # Empaquetado completo
```

## ✅ Verificación

Después de instalar el ejecutable:

1. **Logs del servidor:**
   - `%APPDATA%/violet-erp/violet_erp.log`

2. **Logs del renderer:**
   - `%APPDATA%/violet-erp/renderer_debug.log`

3. **Health check:**
   - Abrir DevTools en la aplicación
   - Ir a Network
   - Verificar que `http://localhost:3000/api/health` responde

## 🎯 Beneficios

1. ✅ **Código más limpio**: Un solo servidor en lugar de múltiples archivos
2. ✅ **Rutas automáticas**: No más problemas de rutas en producción
3. ✅ **Debugging fácil**: Logs completos en cada paso
4. ✅ **Mantenimiento simple**: Toda la lógica del servidor en un lugar
5. ✅ **Funciona en desarrollo y producción**: Sin cambios de código

## 📦 Archivos Generados

- `dist-electron/Violet ERP Setup 0.0.1.exe` (135 MB)
- Instalador NSIS con todo incluido
- Base de datos SQLite integrada
- Servidor Express + Socket.io
- Proxy de IA (Groq)

## 🔍 Próximos Pasos

1. Instalar el ejecutable
2. Verificar que abre correctamente
3. Revisar logs en `%APPDATA%/violet-erp/`
4. Probar funcionalidades del sistema

## 📚 Documentación Adicional

- `ESTRUCTURA_EMPAQUETADO.md` - Estructura detallada
- `BUILD-EXE.md` - Guía técnica de construcción
- `COMO-GENERAR-EXE.md` - Guía visual paso a paso
