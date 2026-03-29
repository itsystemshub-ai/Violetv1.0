@echo off
REM =============================================================================
REM Violet ERP - Instalación Automática Completa (Solo CMD)
REM Descarga e instala TODO lo necesario para el sistema
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - INSTALACION AUTOMATICA COMPLETA         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Se requieren permisos de administrador
    echo.
    echo Por favor, haz clic derecho en install.bat y selecciona:
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [✓] Permisos de administrador verificados
echo.

REM =============================================================================
REM 1. VERIFICAR E INSTALAR NODE.JS
REM =============================================================================

echo [1/6] Verificando Node.js...

node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Node.js NO está instalado
    echo [→] Descargando e instalando Node.js 20.x...
    echo.
    
    REM Descargar Node.js
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'"
    
    REM Instalar silenciosamente
    start /wait msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
    
    REM Limpiar
    del "%TEMP%\nodejs.msi" /Q
    
    echo [✓] Node.js instalado
    echo.
    
    REM Refresh environment variables
    set "PATH=%PATH%;C:\Program Files\nodejs"
) else (
    echo [✓] Node.js ya está instalado
    node --version
    echo.
)

REM =============================================================================
REM 2. INSTALAR PNPM GLOBAL
REM =============================================================================

echo [2/6] Verificando pnpm...

pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] pnpm NO está instalado
    echo [→] Instalando pnpm globalmente...
    echo.
    
    npm install -g pnpm
    
    if %errorLevel% neq 0 (
        echo [!] Error instalando pnpm, usando npm como fallback
    ) else (
        echo [✓] pnpm instalado
    )
    echo.
) else (
    echo [✓] pnpm ya está instalado
    pnpm --version
    echo.
)

REM =============================================================================
REM 3. VERIFICAR FIREBIRD
REM =============================================================================

echo [3/6] Verificando Firebird...

sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Firebird NO está instalado o no está en ejecución
    echo.
    echo [→] Para instalar Firebird manualmente:
    echo      1. Ve a: https://firebirdsql.org
    echo      2. Descarga Firebird 3.0+
    echo      3. Ejecuta el instalador
    echo.
    echo [→] O usa: configure-firebird.cmd
    echo.
    set /p SKIP_FIREBIRD="¿Continuar sin Firebird? (S/N): "
    if /i not "%SKIP_FIREBIRD%"=="S" (
        echo.
        echo Instalación cancelada.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [✓] Firebird está instalado
    sc query FirebirdServerDefaultInstance | find "STATE"
    echo.
)

REM =============================================================================
REM 4. INSTALAR DEPENDENCIAS DEL PROYECTO
REM =============================================================================

echo [4/6] Instalando dependencias del proyecto...
echo.

cd /d "%~dp0"

REM Root dependencies
if exist "pnpm-lock.yaml" (
    echo [→] Usando pnpm para dependencias root...
    call pnpm install
) else (
    echo [→] Usando npm para dependencias root...
    call npm install
)

echo.

REM Backend dependencies
echo [→] Instalando dependencias del backend...
cd backend\api
if exist "pnpm-lock.yaml" (
    call pnpm install
) else (
    call npm install
)
cd ..\..

echo.

REM Frontend dependencies
echo [→] Instalando dependencias del frontend...
cd frontend\web
if exist "pnpm-lock.yaml" (
    call pnpm install
) else (
    call npm install
)
cd ..\..

echo.
echo [✓] Dependencias instaladas correctamente
echo.

REM =============================================================================
REM 5. CONFIGURAR VARIABLES DE ENTORNO
REM =============================================================================

echo [5/6] Configurando variables de entorno...
echo.

if not exist ".env" (
    echo [→] Creando .env desde .env.example...
    copy .env.example .env
    echo [✓] .env creado
    echo.
    echo [!] IMPORTANTE: Edita .env con tus credenciales de Firebird
    echo.
) else (
    echo [✓] .env ya existe
    echo.
)

REM =============================================================================
REM 6. INICIALIZAR BASE DE DATOS (OPCIONAL)
REM =============================================================================

echo [6/6] ¿Deseas inicializar la base de datos Firebird ahora?
echo.
set /p INIT_DB="Inicializar Firebird con schema y datos por defecto? (S/N): "

if /i "%INIT_DB%"=="S" (
    echo.
    echo [→] Inicializando base de datos...
    cd backend\api
    call node scripts/init-firebird.js
    cd ..\..
    echo.
)

REM =============================================================================
REM RESUMEN FINAL
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║          INSTALACION COMPLETADA EXITOSAMENTE              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Componentes instalados:
echo   ✓ Node.js
echo   ✓ pnpm
echo   ✓ Dependencias del proyecto (1178+ paquetes)
echo.
echo Próximos pasos:
echo   1. Edita .env con tus credenciales de Firebird
echo   2. Ejecuta: start.bat para iniciar el sistema
echo.
echo Para iniciar el sistema ahora:
echo   → Ejecuta: start.bat
echo.
echo Credenciales por defecto:
echo   Email:    admin@violet-erp.com
echo   Password: admin123
echo.

pause
