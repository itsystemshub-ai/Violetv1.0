@echo off
REM =============================================================================
REM Violet ERP - Configurar Firebird (Solo CMD)
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - CONFIGURADOR DE FIREBIRD                ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar si Firebird está instalado
echo [1/3] Verificando Firebird...

sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Firebird NO está instalado
    echo.
    echo Para instalar Firebird:
    echo   1. Ve a: https://firebirdsql.org
    echo   2. Descarga Firebird 3.0+
    echo   3. Ejecuta el instalador
    echo.
    set /p CONTINUE="¿Deseas continuar sin Firebird? (S/N): "
    if /i not "%CONTINUE%"=="S" (
        exit /b 1
    )
) else (
    echo [✓] Firebird está instalado
    sc query FirebirdServerDefaultInstance | find "STATE"
)

echo.

REM Detectar ruta de Firebird
echo [2/3] Detectando configuración de Firebird...

set "FOUND_PATH="
if exist "C:\Program Files\Firebird\Firebird_3\data\" (
    set "FOUND_PATH=C:/Program Files/Firebird/Firebird_3/data/"
) else if exist "C:\Program Files (x86)\Firebird\Firebird_3\data\" (
    set "FOUND_PATH=C:/Program Files (x86)/Firebird/Firebird_3/data/"
) else if exist "C:\Firebird\data\" (
    set "FOUND_PATH=C:/Firebird/data/"
) else if exist "C:\VioletERP\database\" (
    set "FOUND_PATH=C:/VioletERP/database/"
)

if defined FOUND_PATH (
    echo [✓] Ruta encontrada: %FOUND_PATH%
) else (
    echo [!] No se encontró una instalación estándar de Firebird
    set "FOUND_PATH=C:/VioletERP/database/"
)

echo.

REM Configurar .env
echo [3/3] Configurando archivo .env...

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [✓] .env creado desde .env.example
    )
) else (
    echo [✓] .env ya existe
)

echo.
echo Ingresa la ruta completa de tu base de datos Firebird:
echo Ejemplo: C:/VioletERP/database/valery3.fdb
echo.
set /p DB_PATH="Ruta de la base de datos: "

if "%DB_PATH%"=="" (
    set "DB_PATH=%FOUND_PATH%valery3.fdb"
    echo Usando ruta por defecto: %DB_PATH%
)

REM Actualizar .env
echo [→] Actualizando .env...

(
    echo # Violet ERP - Variables de Entorno
    echo NODE_ENV=development
    echo APP_NAME=Violet ERP
    echo APP_VERSION=2.0.0
    echo.
    echo # Servidor
    echo PORT=3000
    echo HOST=localhost
    echo CORS_ORIGIN=http://localhost:5173
    echo.
    echo # Firebird Database
    echo FIREBIRD_HOST=localhost
    echo FIREBIRD_PORT=3050
    echo FIREBIRD_DATABASE=localhost:%DB_PATH%
    echo FIREBIRD_USER=SYSDBA
    echo FIREBIRD_PASSWORD=masterkey
    echo.
    echo # JWT
    echo JWT_SECRET=violet-erp-dev-secret-2024
    echo JWT_EXPIRES_IN=1h
    echo JWT_REFRESH_SECRET=violet-erp-dev-refresh-2024
    echo JWT_REFRESH_EXPIRES_IN=7d
    echo.
    echo # Seguridad
    echo BCRYPT_ROUNDS=10
    echo.
    echo # Logs
    echo LOG_LEVEL=debug
    echo LOG_FILE=./logs/app.log
    echo.
    echo # WebSockets
    echo WS_ENABLED=true
    echo WS_PORT=3001
) > .env

echo [✓] .env actualizado con la ruta: %DB_PATH%

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║          CONFIGURACION COMPLETADA                         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Próximos pasos:
echo.
echo   1. Inicializar la base de datos:
echo      cd backend\api
echo      pnpm db:init
echo.
echo   2. Iniciar el sistema:
echo      start.bat
echo.
echo Credenciales por defecto:
echo   Email:    admin@violet-erp.com
echo   Password: admin123
echo.

pause
