@echo off
REM =============================================================================
REM Violet ERP - Instalación al Inicio de Windows
REM Agrega al programador de tareas para ejecución automática
REM =============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      VIOLET ERP - CONFIGURAR INICIO AUTOMÁTICO           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo Esto agregará Violet ERP al inicio de Windows.
echo El sistema se instalará e iniciará automáticamente.
echo.
set /p CONFIRM="¿Deseas continuar? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo.
    echo Operación cancelada.
    pause
    exit /b 0
)

echo.
echo [→] Configurando inicio automático...
echo.

REM Obtener ruta actual
set VIOLET_PATH=%~dp0
set VIOLET_PATH=%VIOLET_PATH:~0,-1%

REM Crear tarea en el programador de tareas
echo [→] Creando tarea programada...
echo.

schtasks /create /tn "Violet ERP - Inicio Automático" /tr "cmd.exe /c start /min \"%VIOLET_PATH%\install-all.bat\"" /sc onlogon /ru "%USERNAME%" /rl highest /f

if %errorLevel% neq 0 (
    echo [!] Error creando la tarea programada
    echo.
    echo Alternativa manual:
    echo   1. Presiona Win + R
    echo   2. Escribe: shell:startup
    echo   3. Crea un acceso directo a install-all.bat
    echo.
) else (
    echo [✓] Tarea creada exitosamente
    echo.
    echo Violet ERP se instalará automáticamente al iniciar sesión.
    echo.
)

REM También crear acceso directo en el menú de inicio
echo [→] Creando acceso directo en el menú Inicio...
echo.

set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\Violet ERP.lnk

powershell -Command "$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%VIOLET_PATH%\start.bat'; $Shortcut.WorkingDirectory = '%VIOLET_PATH%'; $Shortcut.Description = 'Iniciar Violet ERP'; $Shortcut.Save()"

if %errorLevel% equ 0 (
    echo [✓] Acceso directo creado en Inicio
    echo.
)

echo ╔═══════════════════════════════════════════════════════════╗
echo ║              CONFIGURACIÓN COMPLETADA                     ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Para iniciar manualmente:
echo   → Ejecuta: start.bat
echo.
echo Para remover el inicio automático:
echo   → Ejecuta: uninstall-startup.bat
echo.
pause
