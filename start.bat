@echo off
REM =============================================================================
REM Violet ERP - Iniciar Sistema Automático
REM Instala dependencias si faltan y inicia backend + frontend
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         VIOLET ERP - INICIANDO SISTEMA                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Verificar si node_modules existe en root
if not exist "node_modules" (
    echo [!] Dependencias root no instaladas
    echo [→] Instalando dependencias con pnpm...
    echo.
    call pnpm install
    if %errorLevel% neq 0 (
        echo [!] Error instalando dependencias root
        echo [→] Usando npm como fallback...
        call npm install
    )
    echo.
)

REM Verificar backend
cd backend\api
if not exist "node_modules" (
    echo [!] Dependencias backend no instaladas
    echo [→] Instalando dependencias del backend...
    echo.
    call pnpm install
    if %errorLevel% neq 0 (
        call npm install
    )
    echo.
)
cd ..\..

REM Verificar frontend
cd frontend\web
if not exist "node_modules" (
    echo [!] Dependencias frontend no instaladas
    echo [→] Instalando dependencias del frontend...
    echo.
    call pnpm install
    if %errorLevel% neq 0 (
        call npm install
    )
    echo.
)
cd ..\..

echo ╔═══════════════════════════════════════════════════════════╗
echo ║              INICIANDO SERVIDORES                         ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Iniciar backend en ventana separada
echo [1/2] Iniciando Backend...
start "Violet ERP - Backend" cmd /k "cd backend\api && echo Backend API - http://localhost:3000 && echo Health: http://localhost:3000/health && echo. && npm run dev"

REM Esperar a que el backend inicie
timeout /t 5 /nobreak >nul

REM Iniciar frontend en ventana separada
echo [2/2] Iniciando Frontend...
start "Violet ERP - Frontend" cmd /k "cd frontend\web && echo Frontend Web - http://localhost:5173 && echo. && npm run dev"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           SISTEMA INICIADO CORRECTAMENTE                  ║
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
echo Para detener:
echo   → Cierra las ventanas de Backend y Frontend
echo   → O ejecuta: stop.bat
echo.

REM Abrir navegador automáticamente
timeout /t 3 /nobreak >nul
start http://localhost:5173

exit /b 0
