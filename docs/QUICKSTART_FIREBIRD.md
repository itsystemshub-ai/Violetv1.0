# 🟣 Guía de Inicio Rápido - Violet ERP + Firebird SQL

## 📋 Checklist de Instalación

### Paso 1: Instalar Firebird SQL 2.5.2 ✅
- [ ] Descargar Firebird 2.5.2
- [ ] Ejecutar instalador
- [ ] Configurar puerto 3050
- [ ] Configurar password SYSDBA
- [ ] Verificar servicio corriendo

**Ver:** [`docs/INSTALACION_FIREBIRD.md`](docs/INSTALACION_FIREBIRD.md)

---

### Paso 2: Crear Base de Datos ✅
- [ ] Crear directorio `C:\VIOLET_ERP\`
- [ ] Ejecutar script `00_crear_base_de_datos.sql`
- [ ] Verificar creación de tablas
- [ ] Configurar alias (opcional)

**Comando:**
```cmd
cd "C:\Program Files\Firebird\Firebird_2_5\bin"
isql -user SYSDBA -password masterkey -i "C:\Violetv1.0\packages\database\firebird\00_crear_base_de_datos.sql"
```

---

### Paso 3: Ejecutar Scripts de Esquema ✅
Los scripts se ejecutan automáticamente con el script principal.

**Orden de ejecución:**
1. `01_schema_basicas.sql` - Configuración, Clientes, Proveedores
2. `02_schema_ventas_compras.sql` - Ventas, Compras, Inventario
3. `03_schema_banco_caja_nomina.sql` - Banco, Caja, Nómina
4. `04_schema_contabilidad.sql` - Contabilidad, Auditoría
5. `05_stored_procedures.sql` - Stored Procedures

---

### Paso 4: Configurar Aplicación ⏳
- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar variables de Firebird
- [ ] Instalar dependencias
- [ ] Conectar aplicación

**Archivo `.env`:**
```env
# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=3050
DATABASE_USER=SYSDBA
DATABASE_PASSWORD=masterkey
DATABASE_PATH=C:\VIOLET_ERP\VIOLET3.FDB

# O usar URL completa
DATABASE_URL=firebird://SYSDBA:masterkey@localhost:3050/C:\VIOLET_ERP\VIOLET3.FDB?charset=UTF8
```

---

### Paso 5: Instalar Dependencias de Firebird en Node.js ⏳

```bash
# Instalar driver de Firebird para Node.js
npm install node-firebird

# O usar driver alternativo
npm install firebird
```

**Configurar en código:**
```typescript
// apps/server/src/config/database.ts
import firebird from 'node-firebird';

const options = {
  host: process.env.FIREBIRD_HOST || 'localhost',
  port: parseInt(process.env.FIREBIRD_PORT || '3050'),
  database: process.env.FIREBIRD_DATABASE || 'C:\\VIOLET_ERP\\VIOLET3.FDB',
  user: process.env.FIREBIRD_USER || 'SYSDBA',
  password: process.env.FIREBIRD_PASSWORD || 'masterkey',
  lowercase_keys: false,
  role: 'SYSDBA',
  charset: 'UTF8'
};

firebird.attach(options, (err, db) => {
  if (err) throw err;
  
  // db = base de datos conectada
  // Usar db.query(), db.execute(), etc.
});
```

---

### Paso 6: Migrar Datos desde ValeryProfesional (Opcional) ⏳

**Si ya tienes datos en ValeryProfesional:**

1. **Hacer backup de ValeryProfesional:**
   ```cmd
   gbak -b -user SYSDBA -password masterkey ^
     C:\ValeryProfesional\datos\valery3.fdb ^
     C:\ValeryProfesional\respaldos\valery3.fbk
   ```

2. **Restaurar en base de datos temporal:**
   ```cmd
   gbak -c -user SYSDBA -password masterkey ^
     C:\ValeryProfesional\respaldos\valery3.fbk ^
     C:\VIOLET_ERP\VALERY_TEMP.FDB
   ```

3. **Ejecutar script de migración:**
   ```cmd
   isql -user SYSDBA -password masterkey ^
     -i "C:\Violetv1.0\packages\database\firebird\06_migrar_desde_valerypro.sql"
   ```

---

## 🔍 Verificación de Instalación

### Test 1: Conectar a la Base de Datos

```cmd
isql -user SYSDBA -password masterkey localhost:3050:C:\VIOLET_ERP\VIOLET3.FDB
```

**Debe mostrar:**
```
SQL>
```

### Test 2: Verificar Tablas Creadas

```sql
SELECT COUNT(*) AS TOTAL_TABLAS
FROM RDB$RELATIONS
WHERE RDB$VIEW_BLR IS NULL
  AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0);
```

**Debe mostrar:** `80+`

### Test 3: Verificar Stored Procedures

```sql
SELECT COUNT(*) AS TOTAL_PROCEDURES
FROM RDB$PROCEDURES
WHERE (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0);
```

**Debe mostrar:** `16+`

### Test 4: Probar Stored Procedure

```sql
EXECUTE PROCEDURE CALCULAR_IVA(1000, 16);
```

**Debe mostrar:**
```
MONTO_IVA         TOTAL_OPERACION
===============   ===============
160.00            1160.00
```

### Test 5: Conectar desde Node.js

```bash
node -e "
const firebird = require('node-firebird');
const options = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\VIOLET_ERP\\VIOLET3.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  charset: 'UTF8'
};

firebird.attach(options, (err, db) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa a Firebird!');
  db.detach();
});
"
```

---

## 🚨 Solución de Problemas Comunes

### Problema: "Unable to complete network request"

**Causa:** Servicio de Firebird no está corriendo

**Solución:**
```cmd
# Windows
services.msc → Firebird Server → Start

# O desde CMD
net start FirebirdServerDefaultInstance
```

---

### Problema: "Database does not exist"

**Causa:** Ruta de base de datos incorrecta

**Solución:**
1. Verificar que el archivo existe: `C:\VIOLET_ERP\VIOLET3.FDB`
2. Verificar permisos de lectura/escritura
3. Usar ruta completa en lugar de alias

---

### Problema: "Your user name and password are not defined"

**Causa:** Credenciales incorrectas

**Solución:**
```sql
-- Conectarse como SYSDBA y verificar usuario
SELECT * FROM MON$ATTACHMENTS;

-- O crear usuario
CREATE USER VIOLET_USER PASSWORD 'Violet@2026!'
  USING PLUGIN Srp;
```

---

### Problema: "No permission for INSERT/UPDATE/DELETE"

**Causa:** Usuario no tiene permisos

**Solución:**
```sql
-- Grant de permisos
GRANT ALL ON CLIENTES TO VIOLET_USER;
GRANT ALL ON PROVEEDORES TO VIOLET_USER;
GRANT ALL ON PRODUCTOS TO VIOLET_USER;
GRANT ALL ON VENTAS TO VIOLET_USER;
GRANT ALL ON COMPRAS TO VIOLET_USER;
-- ... repetir para todas las tablas
```

---

## 📊 Comandos Útiles de Firebird

### Ver Conexiones Activas
```sql
SELECT * FROM MON$ATTACHMENTS;
```

### Matar Conexión
```sql
-- Reemplazar 123 con el ID de conexión
ALTER DATABASE KILL BACKUP 123;
```

### Ver Estadísticas de Base de Datos
```cmd
gstat -h localhost:violet -user SYSDBA -password masterkey
```

### Hacer Backup
```cmd
gbak -b -user SYSDBA -password masterkey ^
  C:\VIOLET_ERP\VIOLET3.FDB ^
  C:\VIOLET_ERP\BACKUPS\VIOLET3_20260328.fbk
```

### Restaurar Backup
```cmd
gbak -c -user SYSDBA -password masterkey ^
  C:\VIOLET_ERP\BACKUPS\VIOLET3_20260328.fbk ^
  C:\VIOLET_ERP\VIOLET3.FDB
```

---

## 📁 Estructura de Directorios Final

```
C:\VIOLET_ERP\
├── VIOLET3.FDB              # Base de datos principal
├── BACKUPS\                 # Respaldos
│   ├── VIOLET3_20260328.fbk
│   └── ...
├── LOGS\                    # Logs
│   ├── firebird.log
│   └── violet_erp.log
└── TEMP\                    # Temporales
```

---

## 🔗 Recursos Adicionales

- **Documentación Firebird:** https://firebirdsql.org/en/documentation/
- **Firebird SQL en Node.js:** https://www.npmjs.com/package/node-firebird
- **FlameRobin (GUI):** http://www.flamerobin.org/
- **DBeaver (Multi-DB):** https://dbeaver.io/

---

## ✅ Checklist Final

- [ ] Firebird 2.5.2 instalado y corriendo
- [ ] Base de datos VIOLET3.FDB creada
- [ ] 80+ tablas creadas
- [ ] 16 stored procedures creados
- [ ] Usuario de aplicación creado
- [ ] Archivo `.env` configurado
- [ ] Driver de Firebird instalado en Node.js
- [ ] Conexión desde aplicación probada
- [ ] Backup inicial realizado

---

**¡Sistema listo para desarrollo!**

Próximo paso: Iniciar aplicación con `npm run dev`
