# ANÁLISIS DE ESTRUCTURA DE EMPAQUETADO - VIOLET ERP

## 🔍 ESTRUCTURA ACTUAL

### 1. CARPETAS PRINCIPALES

```
proyecto/
├── electron/          # Archivos de Electron
│   ├── main.cjs      # Proceso principal
│   ├── preload.cjs   # Preload script
│   ├── splash.html   # Splash screen
│   ├── installer.nsh # Script NSIS
│   └── db.cjs        # Base de datos (EXCLUIDO del build)
├── dist/             # Build de Vite (frontend)
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   └── index.html
├── public/           # Assets estáticos
│   ├── favicon.ico
│   └── placeholder.svg
├── backend/          # Servidor Express (EXCLUIDO del build)
└── src/              # Código fuente React
```

### 2. ESTRUCTURA DEL .EXE GENERADO

```
dist-electron/
└── win-unpacked/
    ├── Violet ERP.exe
    ├── resources/
    │   ├── app.asar              # Código de Electron empaquetado
    │   ├── app.asar.unpacked/    # Módulos nativos (better-sqlite3)
    │   └── dist/                 # Frontend (HTML, CSS, JS)
    │       ├── assets/
    │       │   ├── css/
    │       │   └── js/
    │       └── index.html
    └── [otros archivos de Electron]
```

### 3. CONFIGURACIÓN ACTUAL (package.json)

```json
{
  "main": "electron/main.cjs",
  "build": {
    "files": [
      "electron/**/*",
      "!electron/db.cjs",
      "!backend/**/*"
    ],
    "extraResources": [
      {
        "from": "dist",
        "to": "dist",
        "filter": ["**/*"]
      }
    ]
  }
}
```

## ❌ PROBLEMAS IDENTIFICADOS

### 1. DETECCIÓN DE MODO INCORRECTA
- **Problema**: `electron-is-dev` detecta incorrectamente el modo
- **Síntoma**: Intenta cargar desde `localhost:8080` en producción
- **Solución**: Usar `!app.isPackaged` ✅ (YA CORREGIDO)

### 2. RUTA DE CARGA DEL FRONTEND
- **Problema**: La ruta de `dist` puede no encontrarse correctamente
- **Ubicación esperada**: `process.resourcesPath/dist/index.html`
- **Ubicación real**: Verificar con logs

### 3. ASSETS ESTÁTICOS
- **Problema**: Imágenes y assets pueden no cargarse
- **Causa**: Rutas absolutas en lugar de relativas
- **Solución**: Script `fix-electron-html.cjs` convierte rutas ✅

### 4. BACKEND NO INCLUIDO
- **Estado**: Excluido del build (correcto para app standalone)
- **Impacto**: La app debe funcionar sin servidor backend
- **Nota**: Usa localStorage y SQLite local

## ✅ SOLUCIONES IMPLEMENTADAS

1. **Detección de modo**: `!app.isPackaged`
2. **Búsqueda de rutas múltiples**: Intenta varias ubicaciones
3. **Logging completo**: Registra todas las rutas intentadas
4. **Splash screen**: Muestra mientras carga
5. **Base de datos local**: SQLite en userData

## 🎯 RUTAS DE CARGA EN PRODUCCIÓN

```javascript
// Orden de búsqueda para index.html:
1. process.resourcesPath/dist/index.html  ← PRINCIPAL
2. __dirname/../dist/index.html
3. process.resourcesPath/app.asar/dist/index.html
4. process.resourcesPath/app/dist/index.html
```

## 📝 LOGS PARA DIAGNÓSTICO

Ubicación: `%APPDATA%/Violet ERP/violet_erp.log`

Información registrada:
- Versión de la app
- Modo (desarrollo/producción)
- Rutas intentadas
- Errores de carga
- Estado de la base de datos

## 🔧 PRÓXIMOS PASOS

1. ✅ Corregir detección de modo
2. ⏳ Verificar carga correcta del frontend
3. ⏳ Probar assets estáticos (imágenes, iconos)
4. ⏳ Verificar funcionamiento de la base de datos
5. ⏳ Probar todas las funcionalidades principales
