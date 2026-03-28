# 🚀 INSTALACIÓN AUTOMÁTICA - Violet ERP
## **100% CMD - Sin PowerShell**

---

## ⚡ Instalación Rápida (1 Comando)

### Opción ÚNICA: CMD (Recomendado)

```cmd
# 1. Abrir CMD como Administrador
# 2. Ejecutar:
INSTALL.bat
```

**¡Eso es todo!** El script hace TODO automáticamente.

---

## 📋 ¿Qué hace el instalador?

El script `INSTALL.bat` realiza **TODO** el trabajo automáticamente:

### ✅ Pasos Automáticos

1. **Verifica permisos** de administrador
2. **Crea directorios** (`C:\VIOLET_ERP\`)
3. **Descarga Firebird SQL 2.5.2** (usa `bitsadmin`)
4. **Instala Firebird** (modo silencioso)
5. **Configura Firewall** (puerto 3050)
6. **Crea la base de datos** VIOLET3.FDB
7. **Configura alias**
8. **Descarga Node.js 18 LTS** (usa `bitsadmin`)
9. **Instala Node.js** (modo silencioso)
10. **Instala dependencias** (`npm install`)
11. **Construye paquetes** compartidos
12. **Verifica instalación**

**Tiempo estimado:** 5-10 minutos

---

## 🎯 Menú del Instalador

Al ejecutar `INSTALL.bat`, verás:

```
============================================================================
   VIOLET ERP - INSTALADOR AUTOMATICO (CMD)
============================================================================

Seleccione el tipo de instalacion:

  1. COMPLETA (Firebird + Node.js + Dependencias) - RECOMENDADO
  2. Solo Firebird SQL (Base de datos)
  3. Solo Node.js y Dependencias
  4. Solo Configuracion (Crear BD + Configurar)
  5. Verificar Instalacion
  6. Salir

Ingrese su opcion (1-6):
```

### Opciones:

| Opción | Descripción | Tiempo |
|--------|-------------|--------|
| **1. COMPLETA** | Instala TODO automáticamente | 10 min |
| **2. Solo Firebird** | Solo base de datos | 5 min |
| **3. Solo Node.js** | Solo Node.js + npm | 5 min |
| **4. Configuración** | Solo crear BD | 1 min |
| **5. Verificar** | Verifica lo instalado | 30 seg |

---

## 📁 Archivos del Instalador

| Archivo | Propósito |
|---------|-----------|
| `INSTALL.bat` | **Instalador principal** (menú interactivo) |
| `install-firebird.bat` | Solo instalar Firebird |
| `install-nodejs.bat` | Solo instalar Node.js |

**NOTA:** El archivo `INSTALL.ps1` (PowerShell) ya NO es necesario.

---

## 🔍 Verificación Automática

Después de instalar, el script verifica:

```
[1/6] Verificando Firebird SQL...
[OK] Servicio Firebird: CORRIENDO

[2/6] Verificando puerto 3050...
[OK] Puerto 3050: ESCUCHANDO

[3/6] Verificando Node.js...
[OK] Node.js: v18.20.0

[4/6] Verificando npm...
[OK] npm: 10.5.0

[5/6] Verificando base de datos...
[OK] Base de datos: EXISTE

[6/6] Verificando dependencias...
[OK] node_modules: EXISTE

================================
RESULTADO: TODAS LAS VERIFICACIONES PASARON

¡El sistema esta listo para usar!
```

---

## 🚨 Solución de Problemas

### Problema: "Este script requiere permisos de administrador"

**Solución:**
1. Click derecho en `INSTALL.bat`
2. "Ejecutar como administrador"

---

### Problema: "No se pudo descargar Firebird"

**Causa:** Problemas de conexión

**Solución:**
1. Descargar manualmente: https://firebirdsql.org/en/firebird-2-5/
2. Guardar como: `C:\Users\TU_USUARIO\AppData\Local\Temp\Firebird-2.5.2.26540_0_Win32.exe`
3. Volver a ejecutar `INSTALL.bat`

---

### Problema: "bitsadmin no se reconoce"

**Causa:** Windows no tiene bitsadmin (raro)

**Solución alternativa:**
1. Descargar manualmente con tu navegador
2. Colocar el archivo en `%TEMP%`
3. Ejecutar `INSTALL.bat` (saltará la descarga)

---

## 📊 Lo que se instala

### Firebird SQL 2.5.2
- **Ubicación:** `C:\Program Files\Firebird\Firebird_2_5\`
- **Servicio:** `FirebirdServerDefaultInstance`
- **Puerto:** 3050
- **Usuario:** SYSDBA
- **Password:** masterkey
- **Base de datos:** `C:\VIOLET_ERP\VIOLET3.FDB`

### Node.js 18 LTS
- **Ubicación:** `C:\Program Files\nodejs\`
- **npm:** Incluido
- **Versión:** 18.20.0

### Dependencias del Proyecto
- **Ubicación:** `node_modules\`
- **Paquetes:** Todos los necesarios

---

## ✅ Después de la Instalación

### 1. Verificar que todo funciona

```cmd
cd C:\Users\ET\Documents\GitHub\Violet - Cauplas\Violetv1.0
INSTALL.bat
# Opción 5: Verificar Instalacion
```

### 2. Iniciar la aplicación

```cmd
npm run dev
```

### 3. Abrir en navegador

```
http://localhost:5173
```

---

## 📝 Comandos Útiles

### Firebird

```cmd
# Conectar a la base de datos
cd "C:\Program Files\Firebird\Firebird_2_5\bin"
isql -user SYSDBA -password masterkey localhost:violet

# Iniciar servicio
net start FirebirdServerDefaultInstance

# Detener servicio
net stop FirebirdServerDefaultInstance

# Hacer backup
gbak -b -user SYSDBA -password masterkey violet backup.fbk
```

### Node.js

```cmd
# Iniciar desarrollo
npm run dev

# Construir
npm run build

# Tests
npm run test

# Lint
npm run lint
```

---

## 🎉 ¡Listo!

**Sin PowerShell. Sin complicaciones. Solo CMD.**

Después de la instalación automática, el sistema está **100% listo para usar**.

Solo ejecuta:
```cmd
npm run dev
```

Y abre:
```
http://localhost:5173
```

---

## 📚 Documentación Adicional

- [`README.md`](README.md) - Documentación principal
- [`docs/INSTALACION_FIREBIRD.md`](docs/INSTALACION_FIREBIRD.md) - Guía detallada
- [`docs/QUICKSTART_FIREBIRD.md`](docs/QUICKSTART_FIREBIRD.md) - Inicio rápido
- [`MIGRACION_COMPLETADA.md`](MIGRACION_COMPLETADA.md) - Resumen de migración

---

**Hecho con ❤️ para Venezuela**
**100% CMD - Sin dependencias de PowerShell**
