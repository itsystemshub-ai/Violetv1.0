# 🎯 Cómo Generar el Ejecutable (.exe) - Violet ERP

## 🚀 Método Más Fácil (Recomendado)

### Paso 1: Doble Click
Simplemente haz **doble clic** en el archivo:

```
📄 build-exe.bat
```

### Paso 2: Esperar
El script hará todo automáticamente:
- ✅ Verifica Node.js
- ✅ Compila TypeScript
- ✅ Construye la aplicación
- ✅ Genera el instalador .exe

### Paso 3: Listo
El instalador estará en:
```
📁 dist-electron/
   └── 📦 Violet ERP Setup 0.0.1.exe
```

---

## 📊 Proceso Visual

```
┌─────────────────────────────────────────────────────────┐
│  1. Doble click en build-exe.bat                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. El script verifica Node.js y npm                    │
│     ✓ Node.js v18.x.x                                   │
│     ✓ npm v9.x.x                                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. Pregunta si deseas limpiar caché                    │
│     [s/N]: _                                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. Compila TypeScript                                  │
│     ⏱️ 1-2 minutos                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. Construye aplicación React con Vite                 │
│     ⏱️ 2-3 minutos                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  6. Empaqueta con Electron Builder                      │
│     ⏱️ 5-10 minutos (primera vez)                        │
│     ⏱️ 2-3 minutos (siguientes veces)                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  7. ✅ ¡Instalador generado!                             │
│     📦 Violet ERP Setup 0.0.1.exe (150-200 MB)          │
└─────────────────────────────────────────────────────────┘
```

---

## ⏱️ Tiempos Estimados

| Acción | Primera Vez | Siguientes Veces |
|--------|-------------|------------------|
| Instalación de dependencias | 5-10 min | - |
| Compilación TypeScript | 1-2 min | 1-2 min |
| Build React | 2-3 min | 2-3 min |
| Empaquetado Electron | 5-10 min | 2-3 min |
| **TOTAL** | **15-25 min** | **5-8 min** |

---

## 📦 ¿Qué Incluye el Instalador?

El archivo `.exe` generado es un **instalador completo** que incluye:

- ✅ Aplicación Violet ERP completa
- ✅ Chromium (navegador integrado)
- ✅ Node.js runtime
- ✅ Base de datos SQLite
- ✅ Servidor backend Express
- ✅ Proxy de IA (Groq)
- ✅ Sistema de auto-actualización
- ✅ Todas las dependencias necesarias

**No requiere instalaciones adicionales** - Todo está incluido.

---

## 🎨 Características del Instalador

### Durante la Instalación:
- 🖱️ Instalación con un solo clic
- 📍 Se instala en: `C:\Users\[Usuario]\AppData\Local\Programs\violet-erp`
- 🖥️ Crea acceso directo en escritorio
- 📋 Crea acceso directo en menú inicio
- ⚡ Se ejecuta automáticamente al terminar

### Después de Instalar:
- 🔄 Auto-actualización automática
- 💾 Base de datos local (no requiere servidor)
- 🌐 Funciona sin Internet (excepto IA)
- 🔐 Datos seguros y privados

---

## 🔧 Métodos Alternativos

### Método 2: PowerShell
```powershell
# Click derecho en build-exe.ps1 → "Ejecutar con PowerShell"
```

### Método 3: Línea de Comandos
```bash
# Abrir CMD o PowerShell en la carpeta del proyecto
npm run release
```

### Método 4: Paso a Paso
```bash
# 1. Instalar dependencias
npm install

# 2. Compilar TypeScript
npm run build

# 3. Generar ejecutable
npm run electron:dist
```

---

## 🐛 Solución de Problemas

### ❌ Error: "node no se reconoce como comando"

**Causa:** Node.js no está instalado

**Solución:**
1. Descarga Node.js desde: https://nodejs.org/
2. Instala la versión LTS (recomendada)
3. Reinicia la terminal
4. Verifica: `node --version`

---

### ❌ Error: "Cannot find module 'electron'"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
npm install
```

---

### ❌ Error de TypeScript

**Causa:** Errores en el código TypeScript

**Solución:**
```bash
# Ver errores
npm run typecheck

# Corregir errores mostrados
# Luego volver a ejecutar build-exe.bat
```

---

### ❌ El .exe no se genera

**Causa:** Caché corrupto o dependencias desactualizadas

**Solución:**
```bash
# Limpiar todo
rmdir /s /q node_modules
rmdir /s /q dist
rmdir /s /q dist-electron

# Reinstalar
npm install

# Generar de nuevo
npm run release
```

---

### ❌ Error: "Cannot read property 'build' of undefined"

**Causa:** Configuración de electron-builder faltante

**Solución:**
Ya está configurado en `package.json`. Si persiste:
```bash
npm install electron-builder --save-dev
```

---

## 📝 Notas Importantes

### Tamaño del Instalador
- **Tamaño:** 150-200 MB
- **Razón:** Incluye Chromium completo + Node.js + todas las dependencias
- **Beneficio:** No requiere instalaciones adicionales

### Primera Ejecución
- La primera vez que ejecutes el instalador, Windows puede mostrar una advertencia
- Esto es normal para aplicaciones sin firma digital
- Click en "Más información" → "Ejecutar de todas formas"

### Firma Digital (Opcional)
Para evitar advertencias de Windows:
1. Obtén un certificado de firma de código (~$100-300/año)
2. Configura en `package.json`:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

---

## 🎉 ¡Listo para Distribuir!

Una vez generado el instalador:

1. ✅ Puedes distribuirlo a otros usuarios
2. ✅ Funciona en cualquier Windows 10/11
3. ✅ No requiere instalaciones adicionales
4. ✅ Se actualiza automáticamente

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Lee `BUILD-EXE.md` para más detalles
2. Revisa `GENERAR-EXE.txt` para instrucciones rápidas
3. Verifica que Node.js esté instalado: `node --version`
4. Verifica que npm esté actualizado: `npm --version`

---

## 🚀 Comandos Útiles

```bash
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Actualizar npm
npm install -g npm@latest

# Limpiar caché de npm
npm cache clean --force

# Ver errores de TypeScript
npm run typecheck

# Ejecutar en modo desarrollo
npm run electron:dev

# Generar instalador
npm run release
```

---

**¡Éxito generando tu ejecutable!** 🎊
