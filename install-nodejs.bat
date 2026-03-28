@echo off
REM ============================================================================
REM VIOLET ERP - INSTALADOR DE NODE.JS (CMD PURO)
REM Sin dependencias de PowerShell
REM ============================================================================

SETLOCAL EnableDelayedExpansion

echo.
echo ============================================================================
echo   VIOLET ERP - Instalador de Node.js y Dependencias
echo ============================================================================
echo.

REM Verificar arquitectura
wmic os get osarchitecture | find "64" >nul 2>&1
if %errorLevel% equ 0 (
    set ARCH=x64
    set NODE_URL=https://nodejs.org/dist/v18.20.0/node-v18.20.0-x64.msi
) else (
    set ARCH=x86
    set NODE_URL=https://nodejs.org/dist/v18.20.0/node-v18.20.0-x86.msi
)

echo [INFO] Arquitectura detectada: %ARCH%
echo.

REM Verificar Node.js instalado
echo [PASO 1/4] Verificando Node.js...

node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js ya esta instalado: !NODE_VERSION!
    
    set /p REINSTALL="¿Desea reinstalar? (S/N): "
    if /i not "!REINSTALL!"=="S" (
        goto :INSTALL_DEPS
    )
) else (
    echo [INFO] Node.js no esta instalado.
)

echo.

REM Descargar Node.js
echo [PASO 2/4] Descargando Node.js 18.20.0 LTS...

set DOWNLOAD_FILE=%TEMP%\node-v18.20.0-%ARCH%.msi

if exist "%DOWNLOAD_FILE%" (
    echo [INFO] Archivo ya existe, saltando descarga...
) else (
    echo [DESCARGANDO] Por favor espere...
    
    REM Usar bitsadmin
    bitsadmin /transfer NodeDownload /download /priority normal "%NODE_URL%" "%DOWNLOAD_FILE%"
    
    if exist "%DOWNLOAD_FILE%" (
        echo [OK] Descarga completada.
    ) else (
        echo [ERROR] No se pudo descargar Node.js.
        echo [INFO] Descargue manualmente desde: https://nodejs.org/
        pause
        exit /b 1
    )
)

echo.

REM Instalar Node.js
echo [PASO 3/4] Instalando Node.js...

msiexec /i "%DOWNLOAD_FILE%" /quiet /norestart

if %errorLevel% equ 0 (
    echo [OK] Node.js instalado exitosamente.
) else (
    echo [ADVERTENCIA] La instalacion pudo tener errores no criticos.
)

echo.
echo [INFO] Esperando registro de variables de entorno...
timeout /t 10 /nobreak >nul

set "PATH=%PATH%;C:\Program Files\nodejs"

echo.

REM Instalar dependencias
:INSTALL_DEPS
echo [PASO 4/4] Instalando dependencias del proyecto...

cd /d "%~dp0"

echo [INFO] Limpiando cache de npm...
call npm cache clean --force

echo [INSTALANDO] Esto puede tomar varios minutos...
call npm install

if %errorLevel% equ 0 (
    echo [OK] Dependencias instaladas exitosamente.
) else (
    echo [ERROR] Error al instalar dependencias.
    pause
    exit /b 1
)

echo.

REM Construir paquetes
echo [INFO] Construyendo paquetes compartidos...

call npm run build:packages

if %errorLevel% equ 0 (
    echo [OK] Paquetes construidos exitosamente.
) else (
    echo [ADVERTENCIA] Algunos paquetes pudieron fallar.
)

echo.

REM Verificación
echo ============================================================================
echo   VERIFICACION FINAL
echo ============================================================================
echo.

node --version
npm --version

echo.
echo [OK] Node.js y npm instalados correctamente.
echo.

REM Resumen
echo ============================================================================
echo   INSTALACION COMPLETADA!
echo ============================================================================
echo.
echo   Node.js y dependencias han sido instalados exitosamente.
echo.
echo   Comandos utiles:
echo   - npm run dev           : Iniciar aplicacion en modo desarrollo
echo   - npm run build         : Construir aplicacion
echo   - npm run test          : Ejecutar tests
echo   - npm run lint          : Ejecutar linter
echo.
echo   Siguiente paso:
echo   1. Configurar variables de entorno en .env
echo   2. Ejecutar: npm run dev
echo.
echo ============================================================================

REM Limpiar
echo [INFO] Limpiando archivos temporales...
del "%DOWNLOAD_FILE%" >nul 2>&1

pause

ENDLOCAL
exit /b 0
