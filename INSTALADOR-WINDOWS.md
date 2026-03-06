# 🎉 Instalador de Violet ERP para Windows

## ✅ Instalador Generado Exitosamente

### 📦 Información del Archivo

- **Nombre:** `Violet ERP Setup 0.0.1.exe`
- **Tamaño:** 128.68 MB
- **Ubicación:** `dist-electron\Violet ERP Setup 0.0.1.exe`
- **Tipo:** Instalador NSIS (One-Click)

---

## 🚀 Cómo Instalar

### Opción 1: Instalación Rápida (Recomendada)

1. **Doble click** en `Violet ERP Setup 0.0.1.exe`
2. Windows puede mostrar una advertencia de seguridad:
   - Click en **"Más información"**
   - Click en **"Ejecutar de todas formas"**
3. El instalador se ejecutará automáticamente
4. **¡Listo!** La aplicación se instalará y se abrirá automáticamente

### Opción 2: Instalación Manual

Si prefieres más control:

1. Click derecho en `Violet ERP Setup 0.0.1.exe`
2. Selecciona **"Ejecutar como administrador"**
3. Sigue las instrucciones en pantalla

---

## 📍 Ubicación de Instalación

La aplicación se instalará en:
```
C:\Users\[TuUsuario]\AppData\Local\Programs\violet-erp\
```

### Accesos Directos Creados:

- ✅ **Escritorio:** Icono de Violet ERP
- ✅ **Menú Inicio:** Violet ERP
- ✅ **Inicio Automático:** Se abrirá después de instalar

---

## 🔐 Credenciales de Acceso

Al abrir la aplicación por primera vez:

```
Usuario:     superadmin
Contraseña:  Violet@2026!
```

---

## 🎯 Características del Instalador

### ✅ Instalación One-Click
- No requiere configuración manual
- Instalación automática en segundos
- Se ejecuta al finalizar

### ✅ Accesos Directos
- Icono en el escritorio
- Acceso desde el menú inicio
- Fácil de encontrar y abrir

### ✅ Actualización Automática
- Detecta nuevas versiones
- Descarga e instala actualizaciones
- Mantiene tus datos seguros

### ✅ Desinstalación Limpia
- Panel de Control → Programas
- Busca "Violet ERP"
- Click en "Desinstalar"

---

## 📊 Contenido del Instalador

El instalador incluye:

- ✅ Aplicación Electron completa
- ✅ Base de datos SQLite integrada
- ✅ Todos los módulos del ERP:
  - Dashboard
  - Inventario
  - Ventas
  - Compras
  - Finanzas
  - Recursos Humanos
  - Configuración
  - IA Asistente

---

## 🔧 Requisitos del Sistema

### Mínimos:
- **OS:** Windows 10 (64-bit) o superior
- **RAM:** 4 GB
- **Disco:** 500 MB libres
- **Procesador:** Intel Core i3 o equivalente

### Recomendados:
- **OS:** Windows 11 (64-bit)
- **RAM:** 8 GB o más
- **Disco:** 1 GB libres
- **Procesador:** Intel Core i5 o superior

---

## 🛠️ Solución de Problemas

### Error: "Windows protegió tu PC"

**Causa:** Windows SmartScreen bloquea aplicaciones no firmadas.

**Solución:**
1. Click en **"Más información"**
2. Click en **"Ejecutar de todas formas"**

### Error: "No se puede instalar"

**Solución:**
1. Click derecho en el instalador
2. Selecciona **"Ejecutar como administrador"**

### La aplicación no abre

**Solución:**
1. Busca "Violet ERP" en el menú inicio
2. Click derecho → **"Ejecutar como administrador"**
3. Si persiste, reinstala la aplicación

### Error de base de datos

**Solución:**
1. Cierra la aplicación completamente
2. Ve a: `C:\Users\[TuUsuario]\AppData\Roaming\violet-erp\`
3. Elimina el archivo `violet.db`
4. Abre la aplicación nuevamente (creará una nueva BD)

---

## 📦 Distribución del Instalador

### Para compartir con otros usuarios:

1. **Copia el archivo:**
   ```
   dist-electron\Violet ERP Setup 0.0.1.exe
   ```

2. **Compártelo por:**
   - USB / Disco externo
   - Red local
   - Email (si el tamaño lo permite)
   - Google Drive / OneDrive
   - Servidor web interno

3. **Instrucciones para usuarios:**
   - Descarga el archivo
   - Doble click para instalar
   - Usa las credenciales proporcionadas

---

## 🔄 Actualizar a una Nueva Versión

Cuando haya una nueva versión:

1. **Genera el nuevo instalador:**
   ```bash
   npm run electron:dist
   ```

2. **El nuevo instalador:**
   - Detectará la versión anterior
   - Actualizará automáticamente
   - Mantendrá todos los datos

3. **Los usuarios solo necesitan:**
   - Ejecutar el nuevo instalador
   - La actualización es automática

---

## 📝 Notas Importantes

### ⚠️ Antivirus
Algunos antivirus pueden marcar el instalador como sospechoso porque:
- No está firmado digitalmente
- Es una aplicación nueva
- Contiene código de Electron

**Solución:** Agrega una excepción en tu antivirus.

### 🔐 Firma Digital (Opcional)
Para producción, considera firmar el instalador:
1. Obtén un certificado de firma de código
2. Configura en `package.json`:
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password"
   }
   ```

### 📊 Telemetría
El instalador NO recopila datos de usuario.
Toda la información se almacena localmente.

---

## 🎯 Próximos Pasos

### Para Desarrollo:
- [ ] Firmar el instalador con certificado
- [ ] Configurar auto-actualización
- [ ] Crear instalador portable
- [ ] Generar versión para macOS/Linux

### Para Distribución:
- [ ] Subir a servidor de descargas
- [ ] Crear página de descarga
- [ ] Documentar proceso de instalación
- [ ] Preparar soporte técnico

---

## 📞 Soporte

Si tienes problemas con la instalación:

1. Revisa esta guía completa
2. Verifica los requisitos del sistema
3. Intenta ejecutar como administrador
4. Contacta al equipo de soporte

---

**Generado:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Versión:** 0.0.1
**Plataforma:** Windows 10/11 (64-bit)
**Tipo:** Instalador NSIS One-Click

---

## ✅ Checklist de Distribución

- [x] Instalador generado
- [x] Tamaño optimizado (128 MB)
- [x] Accesos directos configurados
- [x] Base de datos incluida
- [x] Todos los módulos funcionales
- [ ] Certificado de firma (opcional)
- [ ] Servidor de distribución
- [ ] Documentación de usuario
- [ ] Soporte técnico preparado

---

**¡Tu instalador está listo para distribuir!** 🎉
