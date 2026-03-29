@echo off
REM =============================================================================
REM Violet ERP - Instalar Dependencias Faltantes del Frontend
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - INSTALAR DEPENDENCIAS                   ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0frontend\web"

echo Instalando dependencias faltantes...
echo.

REM Dependencias principales faltantes
echo [1/4] Instalando crypto-js...
call npm install --save crypto-js

echo.
echo [2/4] Instalando @types/crypto-js...
call npm install --save-dev @types/crypto-js

echo.
echo [3/4] Instalando next-themes...
call npm install --save next-themes

echo.
echo [4/4] Instalando @sentry/react...
call npm install --save @sentry/react

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║          DEPENDENCIAS INSTALADAS                          ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Reinicia el servidor de desarrollo para aplicar los cambios.
echo.

pause
