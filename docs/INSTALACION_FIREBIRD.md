# 🟣 Guía de Instalación de Firebird SQL 2.5.2

## 📋 Prerrequisitos

### Sistema Operativo
- Windows 7/8/10/11 (32 o 64 bits)
- Linux (Ubuntu, Debian, CentOS)
- macOS (vía Homebrew)

### Hardware Mínimo
- Procesador: 1 GHz o superior
- RAM: 2 GB mínimo (4 GB recomendado)
- Espacio en disco: 500 MB para Firebird + espacio para datos

---

## 🪟 Instalación en Windows

### Paso 1: Descargar Firebird

1. Ir a: https://firebirdsql.org/en/firebird-2-5/
2. Descargar **Firebird 2.5.2.26540 Win32.exe** (o Win64 para 64 bits)
3. Guardar en: `C:\Downloads\Firebird-2.5.2.26540_0_Win32.exe`

### Paso 2: Ejecutar Instalador

```
1. Doble clic en el instalador
2. Aceptar licencia
3. Seleccionar componentes:
   ✅ Full Installation
   ✅ Register Firebird as application
   ✅ Create desktop icon
4. Directorio de instalación: C:\Program Files\Firebird\Firebird_2_5
5. Puerto: 3050 (default)
6. Server Default Password: masterkey (RECOMENDADO cambiar después)
7. Superuser: SYSDBA
```

### Paso 3: Configurar Firewall

```
Abrir Firewall de Windows → Reglas de entrada → Nueva regla
- Tipo: Puerto
- Protocolo: TCP
- Puerto: 3050
- Acción: Permitir
- Nombre: Firebird SQL Server
```

### Paso 4: Verificar Instalación

```cmd
# Abrir CMD como administrador
cd "C:\Program Files\Firebird\Firebird_2_5\bin"
isql -?
```

Si muestra ayuda de ISQL, la instalación fue exitosa.

---

## 🐧 Instalación en Linux (Ubuntu/Debian)

### Paso 1: Agregar Repositorio

```bash
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:firebirdsql/releases
sudo apt-get update
```

### Paso 2: Instalar Firebird

```bash
# Instalar servidor y cliente
sudo apt-get install firebird3.0-server firebird3.0-utils

# Durante la instalación se pedirá:
# - Password para SYSDBA: masterkey
# - Puerto: 3050
```

### Paso 3: Configurar

```bash
# Editar configuración
sudo nano /etc/firebird/3.0/firebird.conf

# Verificar:
# RemoteServicePort = 3050
# WireCrypt = Enabled
```

### Paso 4: Iniciar Servicio

```bash
sudo systemctl start firebird3.0
sudo systemctl enable firebird3.0
sudo systemctl status firebird3.0
```

---

## 🍎 Instalación en macOS

```bash
# Usando Homebrew
brew install firebird

# Iniciar servicio
brew services start firebird
```

---

## 🔧 Configuración Post-Instalación

### 1. Cambiar Password de SYSDBA

```sql
-- Conectarse como SYSDBA
isql -user SYSDBA -password masterkey

-- Cambiar password
ALTER USER SYSDBA PASSWORD 'NuevoPasswordSeguro!2026';
```

### 2. Crear Usuario para Violet ERP

```sql
-- Conectarse como SYSDBA
isql -user SYSDBA -password masterkey

-- Crear usuario
CREATE USER VIOLET_USER PASSWORD 'Violet@2026!'
  FIRST_NAME 'Violet'
  LAST_NAME 'ERP'
  USING PLUGIN Srp;

-- Otorgar permisos
GRANT CREATE DATABASE TO VIOLET_USER;
```

### 3. Configurar firebird.conf

```bash
# Ubicación: C:\Program Files\Firebird\Firebird_2_5\firebird.conf

# Parámetros recomendados:
RemoteServicePort = 3050
DefaultDbCachePages = 2048
TempBlockSize = 1024MB
MaxUnflushedWrites = 32
WireCrypt = Enabled
AuthServer = Srp, Win_Sspi
AuthClient = Srp
```

---

## 📊 Herramientas Recomendadas

### 1. FlameRobin (GUI Gratuita)

**Descarga:** http://www.flamerobin.org/

**Instalación:**
```
1. Descargar FlameRobin
2. Instalar
3. Configurar conexión:
   - Host: localhost
   - Port: 3050
   - User: SYSDBA
   - Password: masterkey
```

### 2. IBExpert (GUI Comercial)

**Descarga:** https://ibexpert.com/

**Versión:** Personal (gratuita) o Register (comercial)

### 3. DBeaver (Multi-database)

**Descarga:** https://dbeaver.io/

**Configuración Firebird:**
```
1. Instalar DBeaver
2. Database → New Database Connection
3. Seleccionar Firebird
4. Agregar driver si es necesario
5. Configurar conexión
```

---

## 🔍 Verificación de Instalación

### Test 1: Conectar con ISQL

```cmd
cd "C:\Program Files\Firebird\Firebird_2_5\bin"
isql -user SYSDBA -password masterkey localhost:3050
```

### Test 2: Crear Base de Datos de Prueba

```sql
CREATE DATABASE 'localhost:C:\test.fdb'
USER 'SYSDBA' PASSWORD 'masterkey'
PAGE_SIZE 16384
DEFAULT CHARACTER SET UTF8;

CREATE TABLE TEST (
    ID INTEGER PRIMARY KEY,
    NOMBRE VARCHAR(50)
);

INSERT INTO TEST VALUES (1, 'Prueba');

SELECT * FROM TEST;

DROP DATABASE;
```

### Test 3: Verificar Puerto

```cmd
netstat -an | find "3050"
```

Debe mostrar: `TCP    0.0.0.0:3050    0.0.0.0:0    LISTENING`

---

## 🚨 Solución de Problemas

### Problema 1: No puedo conectar

**Síntoma:** `Unable to complete network request`

**Solución:**
```
1. Verificar que el servicio esté corriendo:
   services.msc → Firebird Server → Debe estar "Running"

2. Verificar firewall:
   firewall.cpl → Permitir puerto 3050

3. Verificar firebird.conf:
   RemoteServicePort = 3050
```

### Problema 2: Error de autenticación

**Síntoma:** `Your user name and password are not defined`

**Solución:**
```sql
-- Conectarse como SYSDBA y crear usuario
CREATE USER mi_usuario PASSWORD 'mi_password'
  USING PLUGIN Srp;
```

### Problema 3: Base de datos ya existe

**Síntoma:** `Database already exists`

**Solución:**
```sql
-- Eliminar base de datos existente
DROP DATABASE 'localhost:C:\VIOLET_ERP\VIOLET3.FDB';

-- O desde línea de comandos
gfix -kill 0 -user SYSDBA -password masterkey 'C:\VIOLET_ERP\VIOLET3.FDB'
```

---

## 📁 Estructura de Directorios Recomendada

```
C:\VIOLET_ERP\
├── VIOLET3.FDB              # Base de datos principal
├── VIOLET3_BACKUP\          # Respaldos automáticos
│   ├── VIOLET3_20260328.fbk
│   └── ...
├── LOGS\                    # Logs de Firebird
│   ├── firebird.log
│   └── violet_erp.log
└── CONF\                    # Configuraciones
    └── aliases.conf
```

### Configurar aliases.conf

```bash
# Ubicación: C:\Program Files\Firebird\Firebird_2_5\aliases.conf

# Agregar al final:
violet = C:\VIOLET_ERP\VIOLET3.FDB
violet3 = C:\VIOLET_ERP\VIOLET3.FDB
```

**Uso:**
```sql
-- En lugar de ruta completa
CONNECT 'localhost:violet' USER 'SYSDBA' PASSWORD 'masterkey';

-- En lugar de
CONNECT 'localhost:C:\VIOLET_ERP\VIOLET3.FDB' USER 'SYSDBA' PASSWORD 'masterkey';
```

---

## 🔐 Seguridad Recomendada

### 1. Cambiar password de SYSDBA

```sql
ALTER USER SYSDBA PASSWORD 'PasswordMuySeguro!2026#XYZ';
```

### 2. Crear usuario específico para la aplicación

```sql
CREATE USER violet_app PASSWORD 'AppPassword!2026'
  FIRST_NAME 'Violet'
  LAST_NAME 'Application'
  USING PLUGIN Srp;

GRANT CONNECT TO violet_app;
```

### 3. Restringir acceso por IP

```bash
# En firebird.conf
RemoteAddress = 127.0.0.1,192.168.1.*
```

### 4. Habilitar WireCrypt

```bash
# En firebird.conf
WireCrypt = Enabled
```

---

## 📊 Monitoreo

### Ver conexiones activas

```sql
SELECT * FROM MON$ATTACHMENTS;
```

### Ver transacciones activas

```sql
SELECT * FROM MON$TRANSACTIONS;
```

### Ver estadísticas de la base de datos

```bash
gstat -h localhost:violet -user SYSDBA -password masterkey
```

---

## 📞 Soporte

- **Documentación Oficial:** https://firebirdsql.org/en/documentation/
- **Foros:** https://www.firebirdsql.org/en/mailing-lists/
- **Stack Overflow:** https://stackoverflow.com/questions/tagged/firebird

---

**Próximo paso:** Una vez instalado Firebird, proceder a crear la base de datos Violet ERP.
