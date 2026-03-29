@echo off
REM =============================================================================
REM Violet ERP - Inicio Automático con Instalación
REM Verifica e instala dependencias automáticamente antes de iniciar
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - INICIANDO SISTEMA                       ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM =============================================================================
REM 1. VERIFICAR E INSTALAR DEPENDENCIAS ROOT
REM =============================================================================

echo [1/4] Verificando dependencias root...

if not exist "node_modules" (
    echo [!] Dependencias root no instaladas
    echo [→] Instalando con pnpm...
    call pnpm install
    if errorlevel 1 (
        echo [!] pnpm falló, usando npm...
        call npm install
    )
    echo [✓] Dependencias root instaladas
) else (
    echo [✓] Dependencias root verificadas
)

echo.

REM =============================================================================
REM 2. VERIFICAR E INSTALAR BACKEND
REM =============================================================================

echo [2/4] Verificando backend...

cd backend\api
if not exist "node_modules" (
    echo [!] Dependencias del backend no instaladas
    echo [→] Instalando dependencias del backend...
    call pnpm install
    if errorlevel 1 (
        call npm install
    )
    echo [✓] Dependencias del backend instaladas
) else (
    echo [✓] Backend verificado
)
cd ..\..

echo.

REM =============================================================================
REM 3. VERIFICAR E INSTALAR FRONTEND
REM =============================================================================

echo [3/4] Verificando frontend...

cd frontend\web
if not exist "node_modules" (
    echo [!] Dependencias del frontend no instaladas
    echo [→] Instalando dependencias del frontend...
    call pnpm install
    if errorlevel 1 (
        call npm install
    )
    echo [✓] Dependencias del frontend instaladas
) else (
    echo [✓] Frontend verificado
)
cd ..\..

echo.

REM =============================================================================
REM 4. INICIAR SERVIDORES
REM =============================================================================

echo [4/4] Iniciando servidores...
echo.

REM Iniciar backend
echo [→] Iniciando Backend (http://localhost:3000)...
start "Violet ERP - Backend" cmd /k "cd backend\api && echo. && echo ╔═══════════════════════════════════════════════════════════╗ && echo ║         VIOLET ERP - BACKEND API                          ║ && echo ╚═══════════════════════════════════════════════════════════╝ && echo. && echo URL:    http://localhost:3000 && echo Health: http://localhost:3000/health && echo API:    http://localhost:3000/api && echo. && npm run dev"

REM Esperar a que el backend inicie
timeout /t 5 /nobreak >nul

REM Iniciar frontend
echo [→] Iniciando Frontend (http://localhost:5173)...
start "Violet ERP - Frontend" cmd /k "cd frontend\web && echo. && echo ╔═══════════════════════════════════════════════════════════╗ && echo ║         VIOLET ERP - FRONTEND WEB                         ║ && echo ╚═══════════════════════════════════════════════════════════╝ && echo. && echo URL: http://localhost:5173 && echo. && npm run dev"

echo.
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║          SISTEMA INICIADO CORRECTAMENTE                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Accede a:
echo   → Frontend: http://localhost:5173
echo   → Backend:  http://localhost:3000
echo   → Health:   http://localhost:3000/health
echo.
echo Credenciales:
echo   Email:    admin@violet-erp.com
echo   Password: admin123
echo.

REM Abrir navegador automáticamente después de 3 segundos
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Para detener el sistema:
echo   → Cierra las ventanas de Backend y Frontend
echo   → O ejecuta: stop.bat
echo.

exit /b 0
