@echo off
REM =============================================================================
REM Violet ERP - Remover Inicio Automático
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - REMOVER INICIO AUTOMÁTICO              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [→] Removiendo tarea programada...
echo.

schtasks /delete /tn "Violet ERP - Inicio Automático" /f

echo [→] Removiendo acceso directo de Inicio...
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
del /Q "%STARTUP_FOLDER%\Violet ERP.lnk" 2>nul

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           INICIO AUTOMÁTICO REMOVIDO                      ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Para iniciar manualmente:
echo   → Ejecuta: start.bat
echo.
pause
