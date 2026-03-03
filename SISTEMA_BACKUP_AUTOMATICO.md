# 💾 Sistema de Backup Automático - Violet ERP

## Descripción General

Sistema completo de respaldo automático que genera archivos de la base de datos con todas las modificaciones del sistema. Los backups son compatibles con cualquier programa y pueden ser importados en diferentes sistemas.

## 🎯 Características Principales

### 1. **Backup Automático Programado**
- ⏱️ **Cada minuto** (modo desarrollo/testing)
- ⏰ **Cada hora** (alta frecuencia)
- 📅 **Diario** (recomendado para producción)
- 🖐️ **Manual** (solo cuando el usuario lo solicite)

### 2. **Múltiples Formatos de Exportación**

#### JSON (Universal)
- ✅ Compatible con cualquier sistema
- ✅ Incluye metadata completa
- ✅ Checksum para verificar integridad
- ✅ Fácil de parsear programáticamente
- 📦 Estructura:
  ```json
  {
    "metadata": {
      "timestamp": "2026-03-02T10:30:00.000Z",
      "version": "2.0.0",
      "recordCount": { ... },
      "checksum": "abc123"
    },
    "data": {
      "products": [...],
      "invoices": [...],
      "customers": [...],
      "suppliers": [...],
      "transactions": [...]
    }
  }
  ```

#### Excel (XLSX)
- ✅ Visualización inmediata en Excel/LibreOffice
- ✅ Múltiples hojas por tipo de dato
- ✅ Hoja de metadata con información del backup
- ✅ Formato tabular fácil de editar
- 📊 Hojas incluidas:
  - Metadata
  - Productos
  - Facturas
  - Clientes
  - Proveedores
  - Transacciones

#### SQL (MySQL/PostgreSQL)
- ✅ Importación directa en bases de datos
- ✅ Sentencias CREATE TABLE
- ✅ Sentencias INSERT con datos
- ✅ Compatible con MySQL y PostgreSQL
- 🗄️ Listo para ejecutar en cualquier servidor SQL

### 3. **Opciones Configurables**

- **Descarga Automática**: Los archivos se descargan automáticamente
- **Incluir Imágenes**: Opción de incluir/excluir fotos de productos
- **Máximo de Backups**: Mantener historial de últimos N backups
- **Formato**: Elegir uno o todos los formatos

## 📋 Datos Respaldados

El sistema respalda TODAS las tablas de la base de datos:

1. **Productos** (Inventario completo)
   - ID, Nombre, Códigos (CAUPLAS, TORFLEX, INDOMAX, OEM)
   - Stock, Precios, Categorías
   - Imágenes (opcional)
   - Historial de ventas y rankings

2. **Facturas** (Ventas)
   - Todas las facturas emitidas
   - Detalles de items
   - Clientes asociados

3. **Clientes**
   - Información completa de clientes
   - Historial de compras

4. **Proveedores**
   - Datos de proveedores
   - Historial de compras

5. **Transacciones** (Finanzas)
   - Movimientos financieros
   - Ingresos y egresos

## 🚀 Cómo Usar

### Configuración Inicial

1. **Ir a Configuración**
   - Click en el menú lateral
   - Seleccionar "Configuración"
   - Click en la pestaña "Backup"

2. **Activar Backup Automático**
   - Toggle "Backup Automático Activo" a ON
   - Seleccionar frecuencia deseada
   - Elegir formato(s) de exportación

3. **Configurar Opciones**
   - Activar/desactivar descarga automática
   - Decidir si incluir imágenes
   - Ajustar máximo de backups en historial

### Crear Backup Manual

1. **Desde Configuración > Backup**
   - Click en "Crear Backup Ahora"
   - El sistema generará los archivos
   - Se descargarán automáticamente

2. **Resultado**
   - Archivos descargados en carpeta de Descargas
   - Nombres con timestamp: `violet_erp_backup_2026-03-02_10-30-00.json`
   - Registro en historial de backups

### Restaurar Backup

1. **Desde Configuración > Backup**
   - Click en "Restaurar Backup"
   - Seleccionar archivo JSON del backup
   - Confirmar restauración

2. **Proceso**
   - El sistema verifica el checksum
   - Restaura todos los datos
   - Recarga la aplicación automáticamente

## 📁 Estructura de Archivos

### Nombres de Archivo

```
violet_erp_backup_YYYY-MM-DD_HH-MM-SS.json
violet_erp_backup_YYYY-MM-DD_HH-MM-SS.xlsx
violet_erp_backup_YYYY-MM-DD_HH-MM-SS.sql
```

Ejemplo:
```
violet_erp_backup_2026-03-02_10-30-00.json
violet_erp_backup_2026-03-02_10-30-00.xlsx
violet_erp_backup_2026-03-02_10-30-00.sql
```

### Ubicación de Descarga

Por defecto, los archivos se descargan en:
- **Windows**: `C:\Users\[Usuario]\Downloads\`
- **Mac**: `/Users/[Usuario]/Downloads/`
- **Linux**: `/home/[usuario]/Downloads/`

## 🔒 Seguridad e Integridad

### Checksum de Verificación

Cada backup incluye un checksum SHA-256 que permite:
- ✅ Verificar que el archivo no fue modificado
- ✅ Detectar corrupción de datos
- ✅ Garantizar integridad al restaurar

### Metadata Completa

Cada backup incluye:
- Timestamp exacto de creación
- Versión del sistema
- Cantidad de registros por tabla
- Checksum de verificación

### Recomendaciones de Seguridad

1. **Almacenamiento Externo**
   - Guarda backups en disco externo
   - Usa servicios de nube (Google Drive, Dropbox)
   - Mantén copias en múltiples ubicaciones

2. **Frecuencia Adecuada**
   - Producción: Backup diario
   - Desarrollo: Backup cada hora o manual
   - Testing: Cada minuto (solo para pruebas)

3. **Rotación de Backups**
   - Mantén al menos 30 días de historial
   - Archiva backups mensuales por separado
   - Elimina backups muy antiguos

## 💡 Casos de Uso

### Caso 1: Migración a Otro Sistema

1. Crear backup en formato SQL
2. Importar en MySQL/PostgreSQL:
   ```sql
   mysql -u usuario -p nombre_bd < violet_erp_backup_2026-03-02.sql
   ```
3. Los datos están listos en el nuevo sistema

### Caso 2: Análisis en Excel

1. Crear backup en formato XLSX
2. Abrir en Excel/LibreOffice
3. Analizar datos con tablas dinámicas
4. Crear reportes personalizados

### Caso 3: Integración con Otro Software

1. Crear backup en formato JSON
2. Leer el archivo en cualquier lenguaje:
   ```javascript
   const backup = JSON.parse(fs.readFileSync('backup.json'));
   const products = backup.data.products;
   ```
3. Procesar datos según necesidad

### Caso 4: Recuperación de Desastre

1. Sistema falla o datos se corrompen
2. Ir a Configuración > Backup
3. Click en "Restaurar Backup"
4. Seleccionar backup más reciente
5. Sistema restaurado en segundos

## 🔧 Configuración Avanzada

### Modificar Frecuencia Programáticamente

```typescript
import { backupService } from "@/services/backup/BackupService";

// Cambiar a backup cada hora
backupService.updateConfig({
  frequency: "hourly",
  enabled: true
});
```

### Crear Backup Programáticamente

```typescript
// Crear backup manual
await backupService.createBackup(true);
```

### Obtener Historial

```typescript
const history = backupService.getBackupHistory();
console.log(`Últimos ${history.length} backups:`, history);
```

## 📊 Monitoreo y Logs

### Logs en Consola

El sistema registra todas las operaciones:

```
🔄 Inicializando servicio de backup automático...
✅ Backup automático iniciado: daily
🔄 Iniciando backup...
✅ Backup JSON creado: violet_erp_backup_2026-03-02_10-30-00.json
✅ Backup XLSX creado: violet_erp_backup_2026-03-02_10-30-00.xlsx
✅ Backup SQL creado: violet_erp_backup_2026-03-02_10-30-00.sql
✅ Backup completado: 2282 registros
```

### Historial en UI

La interfaz muestra:
- Nombre del archivo
- Fecha y hora de creación
- Tamaño del archivo
- Cantidad de registros

## ⚠️ Limitaciones y Consideraciones

### Tamaño de Archivos

- **Sin imágenes**: ~500KB - 2MB
- **Con imágenes**: 10MB - 100MB+
- **Recomendación**: Desactivar imágenes para backups frecuentes

### Rendimiento

- Backup de 2,282 productos: ~2-5 segundos
- No afecta el rendimiento del sistema
- Se ejecuta en segundo plano

### Compatibilidad

- ✅ JSON: Universal (Node.js, Python, PHP, etc.)
- ✅ Excel: Excel 2007+, LibreOffice, Google Sheets
- ✅ SQL: MySQL 5.7+, PostgreSQL 9.6+, MariaDB 10.2+

## 🆘 Solución de Problemas

### Problema: "Backup no se descarga automáticamente"

**Solución:**
1. Verificar que "Descarga Automática" esté activada
2. Revisar permisos del navegador para descargas
3. Verificar que no haya bloqueador de pop-ups

### Problema: "Error al restaurar backup"

**Solución:**
1. Verificar que el archivo sea un backup válido (JSON)
2. Revisar que el checksum coincida
3. Intentar con un backup más reciente

### Problema: "Backup muy grande"

**Solución:**
1. Desactivar "Incluir Imágenes"
2. Usar formato JSON en lugar de XLSX
3. Comprimir archivos con ZIP antes de almacenar

### Problema: "No aparece en historial"

**Solución:**
1. Refrescar la página
2. Verificar localStorage del navegador
3. Crear un nuevo backup manual

## 📞 Soporte

Para problemas o sugerencias:
1. Revisar logs en consola (F12)
2. Verificar configuración en Settings > Backup
3. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: 2 de marzo de 2026  
**Sistema**: Violet ERP - Backup Automático Universal
