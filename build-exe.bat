@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================================
:: Script de Construcción Automatizada - Violet ERP
:: Genera el instalador .exe para Windows
:: ============================================================================

color 0B
cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    VIOLET ERP - BUILD SCRIPT                   ║
echo ║                  Generador de Ejecutable (.exe)                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [PASO 1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ Node.js no está instalado
    echo.
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js instalado: %NODE_VERSION%
echo.

:: Verificar npm
echo [PASO 2/5] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ npm no está disponible
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm instalado: v%NPM_VERSION%
echo.

echo ════════════════════════════════════════════════════════════════
echo.

:: Preguntar si desea limpiar
set /p CLEAN="¿Deseas limpiar caché y dependencias antes de construir? (s/N): "
if /i "%CLEAN%"=="s" (
    echo.
    echo [LIMPIEZA] Eliminando archivos antiguos...
    
    if exist "node_modules" (
        echo Eliminando node_modules...
        rmdir /s /q "node_modules" 2>nul
        echo ✓ node_modules eliminado
    )
    
    if exist "dist" (
        echo Eliminando dist...
        rmdir /s /q "dist" 2>nul
        echo ✓ dist eliminado
    )
    
    if exist "dist-electron" (
        echo Eliminando dist-electron...
        rmdir /s /q "dist-electron" 2>nul
        echo ✓ dist-electron eliminado
    )
    
    echo.
    echo [INSTALACIÓN] Instalando dependencias...
    echo Esto puede tardar varios minutos...
    echo.
    call npm install
    
    if errorlevel 1 (
        color 0C
        echo ✗ Error al instalar dependencias
        pause
        exit /b 1
    )
    
    echo ✓ Dependencias instaladas correctamente
    echo.
)

echo ════════════════════════════════════════════════════════════════
echo.

:: Verificar TypeScript
echo [PASO 3/5] Verificando errores de TypeScript...
call npm run typecheck
if errorlevel 1 (
    color 0E
    echo.
    echo ⚠ Hay errores de TypeScript
    set /p CONTINUE="¿Deseas continuar de todos modos? (s/N): "
    if /i not "!CONTINUE!"=="s" (
        exit /b 1
    )
)
echo.

echo ════════════════════════════════════════════════════════════════
echo.

:: Construir la aplicación
echo [PASO 4/5] Compilando TypeScript y construyendo aplicación React...
echo ℹ Esto puede tardar 2-5 minutos...
echo.

call npm run build

if errorlevel 1 (
    color 0C
    echo ✗ Error al construir la aplicación
    pause
    exit /b 1
)

echo ✓ Aplicación construida correctamente
echo.

echo ════════════════════════════════════════════════════════════════
echo.

:: Generar el ejecutable
echo [PASO 5/5] Generando instalador .exe...
echo ℹ Esto puede tardar 5-10 minutos en el primer build...
echo.

call npm run electron:dist

if errorlevel 1 (
    color 0C
    echo ✗ Error al generar el ejecutable
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.

:: Verificar resultado
if exist "dist-electron" (
    color 0A
    echo ✓ ¡Instalador generado exitosamente!
    echo.
    echo 📦 Archivos generados:
    echo.
    
    for /r "dist-electron" %%f in (*.exe) do (
        echo    • %%~nxf
        echo      Ubicación: %%f
        set "size=%%~zf"
        set /a "sizeMB=!size! / 1048576"
        echo      Tamaño: !sizeMB! MB
        echo.
    )
    
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo ✓ BUILD COMPLETADO EXITOSAMENTE
    echo.
    
    :: Preguntar si desea abrir la carpeta
    set /p OPEN="¿Deseas abrir la carpeta con el instalador? (S/n): "
    if /i not "!OPEN!"=="n" (
        start "" "%CD%\dist-electron"
    )
) else (
    color 0C
    echo ✗ La carpeta dist-electron no fue creada
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
