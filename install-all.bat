@echo off
REM =============================================================================
REM Violet ERP - Instalación Automática
REM Ejecuta: install-all.bat
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         VIOLET ERP - INSTALACIÓN AUTOMÁTICA              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Se requieren permisos de administrador
    echo.
    echo Haz clic derecho en install-all.bat y selecciona:
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

echo [1/5] Verificando Node.js...
echo.

node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Node.js no está instalado
    echo [→] Instalando Node.js...
    echo.
    
    REM Instalar Node.js desde el instalador local o URL
    if exist "installers\nodejs-installer.exe" (
        echo [→] Ejecutando instalador local...
        start /wait installers\nodejs-installer.exe /quiet
    ) else (
        echo [→] Descargando e instalando Node.js...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"
        start /wait msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
        del "%TEMP%\nodejs.msi"
    )
    
    echo [✓] Node.js instalado
    echo.
) else (
    echo [✓] Node.js ya está instalado
    node --version
    echo.
)

REM =============================================================================
REM 2. VERIFICAR E INSTALAR PNPM
REM =============================================================================

echo [2/5] Verificando pnpm...
echo.

pnpm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] pnpm no está instalado
    echo [→] Instalando pnpm globalmente...
    echo.
    
    npm install -g pnpm
    
    if %errorLevel% neq 0 (
        echo [!] Error instalando pnpm
        echo [→] Usando npm en su lugar...
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
REM 3. VERIFICAR E INSTALAR FIREBIRD
REM =============================================================================

echo [3/5] Verificando Firebird...
echo.

REM Verificar si Firebird está instalado (registro o servicio)
sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Firebird no está instalado o no está en ejecución
    echo [→] Instalando Firebird...
    echo.
    
    if exist "installers\Firebird-3.0.10.exe" (
        echo [→] Ejecutando instalador local de Firebird...
        start /wait installers\Firebird-3.0.10.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
    ) else if exist "installers\firebird-installer.exe" (
        echo [→] Ejecutando instalador local de Firebird...
        start /wait installers\firebird-installer.exe /quiet
    ) else (
        echo [→] Descargando e instalando Firebird...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/FirebirdSQL/firebird/releases/download/R3_0_10/Firebird-3.0.10.33601_Win32.exe' -OutFile '%TEMP%\firebird.exe'}"
        start /wait "%TEMP%\firebird.exe" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
        del "%TEMP%\firebird.exe"
    )
    
    echo [✓] Firebird instalado
    echo.
    echo [!] IMPORTANTE: Configura la ruta de la base de datos en .env
    echo.
) else (
    echo [✓] Firebird ya está instalado
    sc query FirebirdServerDefaultInstance | find "STATE"
    echo.
)

REM =============================================================================
REM 4. INSTALAR DEPENDENCIAS DEL PROYECTO
REM =============================================================================

echo [4/5] Instalando dependencias del proyecto...
echo.

cd /d "%~dp0"

if exist "pnpm-lock.yaml" (
    echo [→] Usando pnpm...
    pnpm install
) else (
    echo [→] Usando npm...
    call npm install
    
    if exist "backend\api" (
        cd backend\api
        call npm install
        cd ..\..
    )
    
    if exist "frontend\web" (
        cd frontend\web
        call npm install
        cd ..\..
    )
)

if %errorLevel% neq 0 (
    echo [!] Error instalando dependencias
    echo [→] Intentando con npm...
    call npm install
)

echo [✓] Dependencias instaladas
echo.

REM =============================================================================
REM 5. CONFIGURAR VARIABLES DE ENTORNO
REM =============================================================================

echo [5/5] Configurando variables de entorno...
echo.

if not exist ".env" (
    echo [→] Creando archivo .env desde .env.example...
    copy .env.example .env
    echo [✓] Archivo .env creado
    echo.
    echo [!] IMPORTANTE: Edita .env con tus credenciales de Firebird
    echo.
) else (
    echo [✓] Archivo .env ya existe
    echo.
)

REM =============================================================================
REM INICIALIZAR BASE DE DATOS
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              INICIALIZANDO BASE DE DATOS                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

if exist "database\firebird\schema.sql" (
    echo [→] Esquema de base de datos disponible en:
    echo      database\firebird\schema.sql
    echo.
    echo [!] Para inicializar la base de datos:
    echo      1. Abre IBExpert o FlameRobin
    echo      2. Conéctate a Firebird
    echo      3. Crea una nueva base de datos
    echo      4. Ejecuta el archivo schema.sql
    echo.
)

REM =============================================================================
REM RESUMEN FINAL
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           INSTALACIÓN COMPLETADA EXITOSAMENTE             ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Componentes instalados:
echo   ✓ Node.js
echo   ✓ pnpm (o npm)
echo   ✓ Firebird
echo   ✓ Dependencias del proyecto
echo.
echo Próximos pasos:
echo   1. Edita .env con tus credenciales de Firebird
echo   2. Inicializa la base de datos con schema.sql
echo   3. Ejecuta: pnpm dev
echo.
echo Para iniciar el sistema:
echo   → Ejecuta: start.bat
echo.
pause
