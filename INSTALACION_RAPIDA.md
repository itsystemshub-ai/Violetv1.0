# ⚡ INSTALACIÓN RÁPIDA - Violet ERP

## 🚀 Instalación en 1 Comando

### Paso 1: Abrir CMD como Administrador

1. Presiona `Win + X`
2. Selecciona "Símbolo del sistema (Administrador)" o "PowerShell (Administrador)"
3. Navega a la carpeta del proyecto:
   ```cmd
   cd C:\Users\ET\Documents\GitHub\Violet - Cauplas\Violetv1.0
   ```

### Paso 2: Ejecutar Instalador

```cmd
INSTALL.bat
```

### Paso 3: Seleccionar Opción 1

```
Seleccione el tipo de instalacion:
  1. COMPLETA (Firebird + Node.js + Dependencias) - RECOMENDADO
```

### Paso 4: Esperar (5-10 minutos)

El instalador hace todo automáticamente:
- ✅ Descarga e instala Firebird SQL 2.5.2
- ✅ Crea la base de datos
- ✅ Descarga e instala Node.js 18 LTS
- ✅ Instala todas las dependencias
- ✅ Configura todo automáticamente

### Paso 5: ¡Listo!

Cuando veas:
```
RESULTADO: TODAS LAS VERIFICACIONES PASARON
¡El sistema esta listo para usar!
```

### Paso 6: Iniciar Aplicación

```cmd
npm run dev
```

### Paso 7: Abrir Navegador

```
http://localhost:5173
```

---

## 🎯 ¡Eso es todo!

**No necesitas hacer nada más.** El instalador automático hace TODO el trabajo.

---

## 📁 Archivos de Instalación

| Archivo | Para qué sirve |
|---------|----------------|
| `INSTALL.bat` | **Instalador principal** - Úsalo este |
| `install-firebird.bat` | Solo Firebird (si ya tienes Node.js) |
| `install-nodejs.bat` | Solo Node.js (si ya tienes Firebird) |

---

## ❓ Problemas Comunes

### "Este script requiere permisos de administrador"

**Solución:** Click derecho en `INSTALL.bat` → "Ejecutar como administrador"

### "No se pudo descargar Firebird"

**Solución:**
1. Descarga manual: https://firebirdsql.org/en/firebird-2-5/
2. Ejecuta `INSTALL.bat` de nuevo (saltará la descarga)

### "Node.js ya está instalado"

**Solución:** El instalador lo detectará y preguntará si quieres reinstalar.

---

## 📚 Más Información

- [`INSTALACION_AUTOMATICA.md`](INSTALACION_AUTOMATICA.md) - Guía completa
- [`README.md`](README.md) - Documentación principal

---

**100% CMD - Sin PowerShell**
