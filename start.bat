@echo off
REM =============================================================================
REM Violet ERP - Iniciar Sistema
REM Ejecuta: start.bat
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              VIOLET ERP - INICIANDO SISTEMA               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Verificar si .env existe
if not exist ".env" (
    echo [!] No se encontró .env
    echo [→] Copiando .env.example a .env...
    copy .env.example .env
    echo [✓] .env creado - Edítalo con tus credenciales
    echo.
)

REM Verificar dependencias instaladas
if not exist "node_modules" (
    echo [!] Dependencias no instaladas
    echo [→] Ejecutando instalación automática...
    echo.
    call install-all.bat
)

echo [1/3] Iniciando Backend...
echo.

start "Violet ERP - Backend" cmd /k "cd backend\api && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/3] Iniciando Frontend...
echo.

start "Violet ERP - Frontend" cmd /k "cd frontend\web && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Sistema iniciado...
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║              SISTEMA INICIADO CORRECTAMENTE               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Accede a:
echo   → Frontend: http://localhost:5173
echo   → Backend:  http://localhost:3000
echo.
echo Para detener el sistema:
echo   → Cierra las ventanas de Backend y Frontend
echo.
echo.

REM Abrir navegador automáticamente
start http://localhost:5173

exit /b 0
