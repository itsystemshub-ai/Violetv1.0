# 🚀 Guía para Generar el Ejecutable (.exe)

## 📋 Requisitos Previos

1. **Node.js** instalado (versión 18 o superior)
2. **npm** actualizado
3. **Conexión a Internet** (para descargar dependencias)

## 🔧 Pasos para Generar el .exe

### Opción 1: Comando Rápido (Recomendado)

```bash
npm run release
```

Este comando:
- Compila el proyecto TypeScript
- Construye la aplicación React con Vite
- Empaqueta todo en un instalador .exe para Windows
- Genera el archivo en la carpeta `dist-electron`

### Opción 2: Paso a Paso

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install

# 2. Compilar TypeScript
npm run build

# 3. Generar el ejecutable
npm run electron:dist
```

## 📦 Resultado

El instalador se generará en:
```
dist-electron/
  └── Violet ERP Setup X.X.X.exe
```

## 🎯 Características del Instalador

- ✅ Instalador NSIS (one-click)
- ✅ Crea acceso directo en escritorio
- ✅ Crea acceso directo en menú inicio
- ✅ Se ejecuta automáticamente después de instalar
- ✅ Incluye auto-actualización
- ✅ Base de datos SQLite local
- ✅ Servidor backend integrado
- ✅ Proxy de IA integrado

## 🔍 Verificación

Después de generar el .exe:

1. Ve a la carpeta `dist-electron`
2. Busca el archivo `Violet ERP Setup X.X.X.exe`
3. Ejecuta el instalador
4. La aplicación se instalará en `C:\Users\[Usuario]\AppData\Local\Programs\violet-erp`

## ⚙️ Configuración Avanzada

### Cambiar Icono

Reemplaza el archivo `public/favicon.ico` con tu icono personalizado (formato .ico, 256x256px)

### Cambiar Nombre de la Aplicación

Edita `package.json`:
```json
{
  "build": {
    "productName": "Tu Nombre Aquí"
  }
}
```

### Incluir Archivos Adicionales

Edita `package.json` → `build.files`:
```json
{
  "build": {
    "files": [
      "dist",
      "electron/**/*",
      "backend/**/*",
      "tu-carpeta/**/*"
    ]
  }
}
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'electron'"
```bash
npm install electron --save-dev
```

### Error: "Cannot find module 'electron-builder'"
```bash
npm install electron-builder --save-dev
```

### Error de compilación TypeScript
```bash
npm run typecheck
# Corrige los errores mostrados
npm run build
```

### El .exe no se genera
```bash
# Limpiar caché y reinstalar
rm -rf node_modules dist dist-electron
npm install
npm run release
```

## 📊 Tamaño del Instalador

- Tamaño aproximado: 150-200 MB
- Incluye: Chromium, Node.js, SQLite, y todas las dependencias

## 🔐 Firma Digital (Opcional)

Para firmar el ejecutable (evitar advertencias de Windows):

1. Obtén un certificado de firma de código
2. Configura en `package.json`:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "tu-password"
    }
  }
}
```

## 📝 Notas Importantes

- El primer build puede tardar 5-10 minutos
- Builds subsecuentes son más rápidos (2-3 minutos)
- El instalador incluye todo lo necesario (no requiere instalaciones adicionales)
- La aplicación se actualiza automáticamente cuando hay nuevas versiones

## 🎉 ¡Listo!

Tu aplicación Violet ERP ahora está empaquetada como un ejecutable profesional de Windows.
