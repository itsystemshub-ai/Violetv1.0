# Estructura de Empaquetado - Violet ERP

## Estructura en Desarrollo

```
proyecto/
├── electron/
│   ├── main.cjs          # Proceso principal de Electron
│   ├── preload.cjs       # Script de preload
│   ├── db.cjs            # Manejo de base de datos SQLite
│   └── splash.html       # Pantalla de carga
├── backend/
│   ├── server.js         # ⭐ SERVIDOR UNIFICADO (nuevo)
│   └── src/
│       ├── routes/       # Rutas de API
│       ├── controllers/  # Controladores
│       ├── services/     # Servicios
│       ├── config/       # Configuración
│       └── middleware/   # Middlewares
├── src/                  # Código fuente React
├── dist/                 # Build de Vite (generado)
└── package.json
```

## Estructura en Producción (Empaquetado)

```
Violet ERP/
├── Violet ERP.exe                    # Ejecutable principal
├── resources/
│   ├── app.asar                      # Código empaquetado
│   │   ├── electron/
│   │   │   ├── main.cjs
│   │   │   ├── preload.cjs
│   │   │   ├── db.cjs
│   │   │   └── splash.html
│   │   └── backend/
│   │       ├── server.js             # ⭐ SERVIDOR UNIFICADO
│   │       └── src/
│   │           ├── routes/
│   │           ├── controllers/
│   │           ├── services/
│   │           ├── config/
│   │           └── middleware/
│   └── dist/                         # ⭐ ARCHIVOS ESTÁTICOS (extraResources)
│       ├── index.html
│       ├── assets/
│       │   ├── index-[hash].js
│       │   ├── index-[hash].css
│       │   └── ...
│       └── favicon.ico
└── locales/
```

## Flujo de Rutas

### 1. Desarrollo (npm run dev)

```
Usuario → http://localhost:8080
         ↓
    Vite Dev Server
         ↓
    React App (src/)
```

### 2. Producción Electron

```
Usuario → Electron (main.cjs)
         ↓
    Inicia backend/server.js
         ↓
    Express en puerto 3000
         ↓
    Sirve archivos desde resources/dist/
         ↓
    BrowserWindow carga http://localhost:3000
         ↓
    React App
```

## Rutas en backend/server.js

```javascript
// Desarrollo
paths = {
  root: '/proyecto',
  dist: '/proyecto/dist',
  backend: '/proyecto/backend'
}

// Producción Electron
paths = {
  root: 'C:/Program Files/Violet ERP/resources',
  dist: 'C:/Program Files/Violet ERP/resources/dist',
  backend: 'C:/Program Files/Violet ERP/resources/app.asar/backend'
}
```

## Ventajas de esta Estructura

1. **Servidor Unificado**: Un solo archivo `backend/server.js` maneja todo
2. **Rutas Automáticas**: Detecta automáticamente desarrollo vs producción
3. **Archivos Estáticos Fuera de ASAR**: `dist/` en `extraResources` para acceso rápido
4. **Logging Completo**: Logs detallados en cada paso
5. **Fácil Debugging**: Estructura clara y predecible

## Archivos Clave

### electron/main.cjs
- Inicia la aplicación Electron
- Carga `backend/server.js`
- Crea la ventana del navegador
- Maneja la base de datos SQLite

### backend/server.js
- Servidor Express unificado
- Detecta entorno automáticamente
- Sirve archivos estáticos desde `dist/`
- Maneja rutas de API
- Socket.io para comunicación en tiempo real

### package.json (build)
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

## Comandos

```bash
# Desarrollo
npm run dev              # Solo frontend (Vite)
npm run electron:dev     # Frontend + Electron

# Producción
npm run build            # Build de Vite → dist/
npm run electron:dist    # Build + Empaquetado → dist-electron/
```

## Verificación

Después de empaquetar, verificar:

1. ✓ `dist-electron/win-unpacked/resources/dist/index.html` existe
2. ✓ `dist-electron/win-unpacked/resources/app.asar` existe
3. ✓ `dist-electron/Violet ERP Setup 0.0.1.exe` existe

## Logs

En producción, los logs se guardan en:
- Windows: `%APPDATA%/violet-erp/violet_erp.log`
- Logs del renderer: `%APPDATA%/violet-erp/renderer_debug.log`
