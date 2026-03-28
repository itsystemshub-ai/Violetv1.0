@echo off
REM ============================================================================
REM VIOLET ERP - INSTALADOR DE FIREBIRD SQL (CMD PURO)
REM Sin dependencias de PowerShell
REM ============================================================================

SETLOCAL EnableDelayedExpansion

echo.
echo ============================================================================
echo   VIOLET ERP - Instalador Automatico de Firebird SQL 2.5.2
echo ============================================================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este script requiere permisos de administrador.
    echo Haga clic derecho y seleccione "Ejecutar como administrador".
    pause
    exit /b 1
)

echo [OK] Permisos de administrador verificados.
echo.

REM Configuración
set FIREBIRD_VERSION=2.5.2.26540
set FIREBIRD_URL=https://sourceforge.net/projects/firebird/projects/firebird-win32/2.5.2-Release/Firebird-2.5.2.26540_0_Win32.exe/download
set INSTALL_DIR=C:\Program Files\Firebird\Firebird_2_5
set DATA_DIR=C:\VIOLET_ERP
set SCRIPT_DIR=%~dp0

echo [INFO] Version: %FIREBIRD_VERSION%
echo [INFO] Directorio Instalacion: %INSTALL_DIR%
echo [INFO] Directorio Datos: %DATA_DIR%
echo.

REM Crear directorios
echo [PASO 1/6] Creando directorios...

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DATA_DIR%\BACKUPS" mkdir "%DATA_DIR%\BACKUPS"
if not exist "%DATA_DIR%\LOGS" mkdir "%DATA_DIR%\LOGS"
if not exist "%DATA_DIR%\TEMP" mkdir "%DATA_DIR%\TEMP"

echo [OK] Directorios creados.
echo.

REM Descargar Firebird
echo [PASO 2/6] Descargando Firebird SQL 2.5.2...

set DOWNLOAD_FILE=%TEMP%\Firebird-2.5.2.26540_0_Win32.exe

if exist "%DOWNLOAD_FILE%" (
    echo [INFO] Archivo ya existe, saltando descarga...
) else (
    echo [DESCARGANDO] Por favor espere...
    
    REM Usar bitsadmin para descargar
    bitsadmin /transfer FirebirdDownload /download /priority normal "%FIREBIRD_URL%" "%DOWNLOAD_FILE%"
    
    if exist "%DOWNLOAD_FILE%" (
        echo [OK] Descarga completada
    ) else (
        echo [ERROR] No se pudo descargar Firebird.
        echo [INFO] Descargue manualmente desde: %FIREBIRD_URL%
        pause
        exit /b 1
    )
)

echo.

REM Instalar Firebird
echo [PASO 3/6] Instalando Firebird SQL 2.5.2...

"%DOWNLOAD_FILE%" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-

if %errorLevel% equ 0 (
    echo [OK] Firebird instalado exitosamente.
) else (
    echo [ADVERTENCIA] El instalador pudo haber encontrado errores no criticos.
)

echo.
echo [INFO] Esperando a que el servicio se inicie...
timeout /t 10 /nobreak >nul

REM Verificar servicio
echo [PASO 4/6] Verificando instalacion...

sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Servicio Firebird corriendo.
) else (
    echo [ERROR] Servicio Firebird no encontrado.
    pause
    exit /b 1
)

echo.

REM Configurar firewall
echo [PASO 5/6] Configurando Firewall de Windows...

netsh advfirewall firewall add rule name="Firebird SQL" dir=in action=allow protocol=TCP localport=3050 >nul 2>&1
echo [OK] Regla de firewall agregada (puerto 3050).

netsh advfirewall firewall add rule name="Firebird Server" dir=in action=allow program="%INSTALL_DIR%\bin\fbserver.exe" >nul 2>&1
echo [OK] Regla de firewall para fbserver.exe.

echo.

REM Crear base de datos
echo [PASO 6/6] Creando base de datos VIOLET3.FDB...

set ISQL_PATH="%INSTALL_DIR%\bin\isql.exe"
set CREATE_SCRIPT="%SCRIPT_DIR%packages\database\firebird\00_crear_base_de_datos.sql"

if not exist "%CREATE_SCRIPT%" (
    echo [ERROR] No se encontro el script de creacion: %CREATE_SCRIPT%
    pause
    exit /b 1
)

%ISQL_PATH% -user SYSDBA -password masterkey -i "%CREATE_SCRIPT%"

if %errorLevel% equ 0 (
    echo [OK] Base de datos creada exitosamente.
) else (
    echo [ERROR] Error al crear la base de datos.
)

echo.

REM Configurar alias
echo [INFO] Configurando alias...

set ALIAS_FILE="%INSTALL_DIR%\aliases.conf"

findstr /C:"violet = " "%ALIAS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo. >> "%ALIAS_FILE%"
    echo # Violet ERP >> "%ALIAS_FILE%"
    echo violet = %DATA_DIR%\VIOLET3.FDB >> "%ALIAS_FILE%"
    echo violet3 = %DATA_DIR%\VIOLET3.FDB >> "%ALIAS_FILE%"
    echo [OK] Alias agregados a aliases.conf
) else (
    echo [INFO] Alias ya existen.
)

echo.

REM Resumen
echo ============================================================================
echo   INSTALACION COMPLETADA!
echo ============================================================================
echo.
echo   Firebird SQL 2.5.2 ha sido instalado exitosamente.
echo.
echo   Detalles:
echo   - Servicio: FirebirdServerDefaultInstance
echo   - Puerto: 3050
echo   - Usuario: SYSDBA
echo   - Password: masterkey
echo   - Base de datos: %DATA_DIR%\VIOLET3.FDB
echo.
echo   Comandos utiles:
echo   - Conectar: isql -user SYSDBA -password masterkey localhost:violet
echo   - Servicio: net start/stop FirebirdServerDefaultInstance
echo.
echo ============================================================================

REM Limpiar
echo [INFO] Limpiando archivos temporales...
del "%DOWNLOAD_FILE%" >nul 2>&1

pause

REM Preguntar si desea continuar
set /p INSTALL_NODE="¿Desea instalar Node.js y dependencias ahora? (S/N): "
if /i "%INSTALL_NODE%"=="S" (
    echo.
    echo [INFO] Iniciando instalacion de Node.js...
    call "%SCRIPT_DIR%install-nodejs.bat"
)

ENDLOCAL
exit /b 0
