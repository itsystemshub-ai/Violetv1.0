@echo off
REM ============================================================================
REM VIOLET ERP - INSTALADOR AUTOMATICO COMPLETO (CMD PURO)
REM Sin dependencias de PowerShell - Todo en CMD
REM ============================================================================

SETLOCAL EnableDelayedExpansion

REM ============================================================================
REM CONFIGURACIÓN
REM ============================================================================

set SCRIPT_DIR=%~dp0
set DATA_DIR=C:\VIOLET_ERP
set FIREBIRD_VERSION=2.5.2.26540
set FIREBIRD_URL=https://sourceforge.net/projects/firebird/projects/firebird-win32/2.5.2-Release/Firebird-2.5.2.26540_0_Win32.exe/download
set NODE_VERSION=18.20.0
set NODE_URL=https://nodejs.org/dist/v18.20.0/node-v18.20.0-x64.msi
set INSTALL_DIR=C:\Program Files\Firebird\Firebird_2_5
set LOG_FILE=%DATA_DIR%\LOGS\instalacion.log

REM ============================================================================
REM FUNCIONES DE LOG
REM ============================================================================

:LOG
echo [%DATE% %TIME%] %1 >> "%LOG_FILE%"
echo %1
goto :EOF

:LOG_OK
echo [%DATE% %TIME%] [OK] %1 >> "%LOG_FILE%"
echo [OK] %1
goto :EOF

:LOG_ERROR
echo [%DATE% %TIME%] [ERROR] %1 >> "%LOG_FILE%"
echo [ERROR] %1
goto :EOF

:LOG_WARN
echo [%DATE% %TIME%] [WARN] %1 >> "%LOG_FILE%"
echo [WARN] %1
goto :EOF

:LOG_INFO
echo [%DATE% %TIME%] [INFO] %1 >> "%LOG_FILE%"
echo [INFO] %1
goto :EOF

REM ============================================================================
REM VERIFICAR PERMISOS DE ADMINISTRADOR
REM ============================================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Este script requiere permisos de administrador.
    echo.
    echo Instrucciones:
    echo 1. Haga clic derecho en este archivo
    echo 2. Seleccione "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

call :LOG_OK "Permisos de administrador verificados"
echo.

REM ============================================================================
REM CREAR DIRECTORIOS
REM ============================================================================

call :LOG_INFO "Creando directorios..."

if not exist "%DATA_DIR%" (
    mkdir "%DATA_DIR%"
    call :LOG_OK "Creado: %DATA_DIR%"
)

if not exist "%DATA_DIR%\BACKUPS" (
    mkdir "%DATA_DIR%\BACKUPS"
    call :LOG_OK "Creado: %DATA_DIR%\BACKUPS"
)

if not exist "%DATA_DIR%\LOGS" (
    mkdir "%DATA_DIR%\LOGS"
    call :LOG_OK "Creado: %DATA_DIR%\LOGS"
)

if not exist "%DATA_DIR%\TEMP" (
    mkdir "%DATA_DIR%\TEMP"
    call :LOG_OK "Creado: %DATA_DIR%\TEMP"
)

echo.

REM ============================================================================
REM MENÚ PRINCIPAL
REM ============================================================================

:MENU
cls
echo ============================================================================
echo   VIOLET ERP - INSTALADOR AUTOMATICO (CMD)
echo ============================================================================
echo.
echo Seleccione el tipo de instalacion:
echo.
echo   1. COMPLETA (Firebird + Node.js + Dependencias) - RECOMENDADO
echo   2. Solo Firebird SQL (Base de datos)
echo   3. Solo Node.js y Dependencias
echo   4. Solo Configuracion (Crear BD + Configurar)
echo   5. Verificar Instalacion
echo   6. Salir
echo.

set /p OPTION="Ingrese su opcion (1-6): "

if "%OPTION%"=="1" goto :INSTALL_ALL
if "%OPTION%"=="2" goto :INSTALL_FIREBIRD_ONLY
if "%OPTION%"=="3" goto :INSTALL_NODE_ONLY
if "%OPTION%"=="4" goto :CONFIGURE_ONLY
if "%OPTION%"=="5" goto :VERIFY_INSTALL
if "%OPTION%"=="6" goto :EOF

echo [ERROR] Opcion no valida.
timeout /t 2 /nobreak >nul
goto :MENU

REM ============================================================================
REM INSTALACIÓN COMPLETA
REM ============================================================================

:INSTALL_ALL
echo.
call :LOG_INFO "=== INICIANDO INSTALACION COMPLETA ==="
echo.

REM Instalar Firebird
call :LOG_INFO "[PASO 1/5] Instalando Firebird SQL..."
call :INSTALL_FIREBIRD
echo.

REM Instalar Node.js
call :LOG_INFO "[PASO 2/5] Instalando Node.js..."
call :INSTALL_NODE
echo.

REM Instalar dependencias
call :LOG_INFO "[PASO 3/5] Instalando dependencias NPM..."
call :INSTALL_NPM
echo.

REM Configurar
call :LOG_INFO "[PASO 4/5] Configurando entorno..."
call :CONFIGURE_ENV
echo.

REM Verificar
call :LOG_INFO "[PASO 5/5] Verificando instalacion..."
call :VERIFY_INSTALL
echo.

call :LOG_OK "=== INSTALACION COMPLETADA ==="
echo.
echo ============================================================================
echo   ¡INSTALACION COMPLETADA!
echo ============================================================================
echo.
echo Siguiente paso:
echo 1. Configure .env si es necesario
echo 2. Ejecute: npm run dev
echo.
pause
goto :MENU

REM ============================================================================
REM SOLO FIREBIRD
REM ============================================================================

:INSTALL_FIREBIRD_ONLY
echo.
call :LOG_INFO "=== INSTALANDO SOLO FIREBIRD ==="
echo.
call :INSTALL_FIREBIRD
call :CONFIGURE_FIREWALL
call :CREATE_DATABASE
call :CONFIGURE_ALIAS
echo.
call :LOG_OK "Firebird instalado exitosamente"
pause
goto :MENU

REM ============================================================================
REM SOLO NODE.JS
REM ============================================================================

:INSTALL_NODE_ONLY
echo.
call :LOG_INFO "=== INSTALANDO SOLO NODE.JS ==="
echo.
call :INSTALL_NODE
call :INSTALL_NPM
call :BUILD_PACKAGES
echo.
call :LOG_OK "Node.js instalado exitosamente"
pause
goto :MENU

REM ============================================================================
REM SOLO CONFIGURACIÓN
REM ============================================================================

:CONFIGURE_ONLY
echo.
call :LOG_INFO "=== CONFIGURANDO SISTEMA ==="
echo.
call :CONFIGURE_ENV
call :CREATE_DATABASE
call :CONFIGURE_ALIAS
echo.
call :LOG_OK "Configuracion completada"
pause
goto :MENU

REM ============================================================================
REM INSTALAR FIREBIRD
REM ============================================================================

:INSTALL_FIREBIRD
set DOWNLOAD_FILE=%TEMP%\Firebird-2.5.2.26540_0_Win32.exe

REM Verificar si ya existe
if exist "%DOWNLOAD_FILE%" (
    call :LOG_INFO "Archivo de instalacion ya existe, saltando descarga..."
    goto :RUN_FIREBIRD_INSTALL
)

REM Descargar
call :LOG_INFO "Descargando Firebird SQL 2.5.2..."
call :LOG_INFO "URL: %FIREBIRD_URL%"
call :LOG_INFO "Destino: %DOWNLOAD_FILE%"
echo.

REM Usar bitsadmin (alternativa a PowerShell)
bitsadmin /transfer FirebirdDownload /download /priority normal "%FIREBIRD_URL%" "%DOWNLOAD_FILE%" >nul 2>&1

if exist "%DOWNLOAD_FILE%" (
    call :LOG_OK "Descarga completada"
) else (
    call :LOG_ERROR "No se pudo descargar Firebird"
    call :LOG_WARN "Descargue manualmente desde: https://firebirdsql.org/en/firebird-2-5/"
    echo.
    set /p MANUAL_DOWNLOAD="¿Ya descargo el archivo manualmente? (S/N): "
    if /i "%MANUAL_DOWNLOAD%"=="S" (
        goto :RUN_FIREBIRD_INSTALL
    ) else (
        call :LOG_ERROR "Instalacion cancelada"
        goto :EOF
    )
)

:RUN_FIREBIRD_INSTALL
call :LOG_INFO "Instalando Firebird SQL..."

REM Ejecutar instalador en modo silencioso
"%DOWNLOAD_FILE%" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-

if %errorLevel% equ 0 (
    call :LOG_OK "Firebird instalado exitosamente"
) else (
    call :LOG_WARN "El instalador pudo tener errores no criticos"
)

echo.
call :LOG_INFO "Esperando a que el servicio se inicie..."
timeout /t 10 /nobreak >nul

REM Verificar servicio
sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG_OK "Servicio Firebird corriendo"
) else (
    call :LOG_ERROR "Servicio Firebird no encontrado"
)

echo.
goto :EOF

REM ============================================================================
REM CONFIGURAR FIREWALL
REM ============================================================================

:CONFIGURE_FIREWALL
call :LOG_INFO "Configurando Firewall de Windows..."

REM Agregar regla para puerto 3050
netsh advfirewall firewall add rule name="Firebird SQL" dir=in action=allow protocol=TCP localport=3050 >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG_OK "Regla de firewall agregada (puerto 3050)"
) else (
    call :LOG_WARN "No se pudo agregar regla de firewall"
)

REM Agregar regla para ejecutable
netsh advfirewall firewall add rule name="Firebird Server" dir=in action=allow program="%INSTALL_DIR%\bin\fbserver.exe" >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG_OK "Regla de firewall para fbserver.exe"
) else (
    call :LOG_WARN "No se pudo agregar regla para fbserver.exe"
)

echo.
goto :EOF

REM ============================================================================
REM CREAR BASE DE DATOS
REM ============================================================================

:CREATE_DATABASE
call :LOG_INFO "Creando base de datos VIOLET3.FDB..."

set ISQL_PATH="%INSTALL_DIR%\bin\isql.exe"
set CREATE_SCRIPT="%SCRIPT_DIR%packages\database\firebird\00_crear_base_de_datos.sql"

REM Verificar isql
if not exist "%ISQL_PATH%" (
    call :LOG_ERROR "isql.exe no encontrado. ¿Firebird esta instalado?"
    goto :EOF
)

REM Verificar script
if not exist "%CREATE_SCRIPT%" (
    call :LOG_ERROR "Script no encontrado: %CREATE_SCRIPT%"
    goto :EOF
)

REM Ejecutar script
%ISQL_PATH% -user SYSDBA -password masterkey -i "%CREATE_SCRIPT%" >nul 2>&1

if %errorLevel% equ 0 (
    call :LOG_OK "Base de datos creada exitosamente"
) else (
    call :LOG_ERROR "Error al crear base de datos"
)

echo.
goto :EOF

REM ============================================================================
REM CONFIGURAR ALIAS
REM ============================================================================

:CONFIGURE_ALIAS
call :LOG_INFO "Configurando alias..."

set ALIAS_FILE="%INSTALL_DIR%\aliases.conf"

if not exist "%ALIAS_FILE%" (
    call :LOG_ERROR "aliases.conf no encontrado"
    goto :EOF
)

REM Verificar si ya existen alias
findstr /C:"violet = " "%ALIAS_FILE%" >nul 2>&1
if %errorLevel% neq 0 (
    echo. >> "%ALIAS_FILE%"
    echo # Violet ERP >> "%ALIAS_FILE%"
    echo violet = %DATA_DIR%\VIOLET3.FDB >> "%ALIAS_FILE%"
    echo violet3 = %DATA_DIR%\VIOLET3.FDB >> "%ALIAS_FILE%"
    call :LOG_OK "Alias agregados a aliases.conf"
) else (
    call :LOG_INFO "Alias ya existen"
)

echo.
goto :EOF

REM ============================================================================
REM INSTALAR NODE.JS
REM ============================================================================

:INSTALL_NODE
set DOWNLOAD_FILE=%TEMP%\node-v18.20.0-x64.msi

REM Verificar si ya existe
if exist "%DOWNLOAD_FILE%" (
    call :LOG_INFO "Archivo de instalacion ya existe, saltando descarga..."
    goto :RUN_NODE_INSTALL
)

REM Descargar
call :LOG_INFO "Descargando Node.js %NODE_VERSION%..."
call :LOG_INFO "URL: %NODE_URL%"

REM Usar bitsadmin
bitsadmin /transfer NodeDownload /download /priority normal "%NODE_URL%" "%DOWNLOAD_FILE%" >nul 2>&1

if exist "%DOWNLOAD_FILE%" (
    call :LOG_OK "Descarga completada"
) else (
    call :LOG_ERROR "No se pudo descargar Node.js"
    call :LOG_WARN "Descargue manualmente desde: https://nodejs.org/"
    echo.
    set /p MANUAL_DOWNLOAD="¿Ya descargo el archivo manualmente? (S/N): "
    if /i "%MANUAL_DOWNLOAD%"=="S" (
        goto :RUN_NODE_INSTALL
    ) else (
        call :LOG_ERROR "Instalacion cancelada"
        goto :EOF
    )
)

:RUN_NODE_INSTALL
call :LOG_INFO "Instalando Node.js..."

REM Instalar silenciosamente
msiexec /i "%DOWNLOAD_FILE%" /quiet /norestart

if %errorLevel% equ 0 (
    call :LOG_OK "Node.js instalado exitosamente"
) else (
    call :LOG_WARN "La instalacion pudo tener errores no criticos"
)

echo.
call :LOG_INFO "Esperando registro de variables de entorno..."
timeout /t 10 /nobreak >nul

REM Actualizar PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

goto :EOF

REM ============================================================================
REM INSTALAR NPM
REM ============================================================================

:INSTALL_NPM
call :LOG_INFO "Instalando dependencias NPM..."

cd /d "%SCRIPT_DIR%"

REM Limpiar cache
call :LOG_INFO "Limpiando cache NPM..."
call npm cache clean --force >nul 2>&1

REM Instalar
call :LOG_INFO "Esto puede tomar varios minutos..."
call npm install

if %errorLevel% equ 0 (
    call :LOG_OK "Dependencias instaladas exitosamente"
) else (
    call :LOG_ERROR "Error al instalar dependencias"
)

echo.
goto :EOF

REM ============================================================================
REM CONSTRUIR PAQUETES
REM ============================================================================

:BUILD_PACKAGES
call :LOG_INFO "Construyendo paquetes compartidos..."

cd /d "%SCRIPT_DIR%"

call npm run build:packages >nul 2>&1

if %errorLevel% equ 0 (
    call :LOG_OK "Paquetes construidos exitosamente"
) else (
    call :LOG_WARN "Algunos paquetes pudieron fallar"
)

echo.
goto :EOF

REM ============================================================================
REM CONFIGURAR ENTORNO
REM ============================================================================

:CONFIGURE_ENV
call :LOG_INFO "Configurando entorno..."

REM Crear .env si no existe
if not exist "%SCRIPT_DIR%.env" (
    if exist "%SCRIPT_DIR%.env.example" (
        copy "%SCRIPT_DIR%.env.example" "%SCRIPT_DIR%.env" >nul
        call :LOG_OK "Archivo .env creado"
    ) else (
        call :LOG_WARN ".env.example no encontrado"
    )
) else (
    call :LOG_INFO ".env ya existe"
)

echo.
goto :EOF

REM ============================================================================
REM VERIFICAR INSTALACIÓN
REM ============================================================================

:VERIFY_INSTALL
echo.
call :LOG_INFO "=== VERIFICACION DE INSTALACION ==="
echo.

set ERRORS=0

REM 1. Firebird
call :LOG_INFO "[1/6] Verificando Firebird SQL..."
sc query FirebirdServerDefaultInstance >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG_OK "Servicio Firebird: CORRIENDO"
) else (
    call :LOG_ERROR "Servicio Firebird: NO INSTALADO"
    set /a ERRORS+=1
)

REM 2. Puerto
call :LOG_INFO "[2/6] Verificando puerto 3050..."
netstat -an | find "3050" >nul 2>&1
if %errorLevel% equ 0 (
    call :LOG_OK "Puerto 3050: ESCUCHANDO"
) else (
    call :LOG_WARN "Puerto 3050: NO ESCUCHANDO"
    set /a ERRORS+=1
)

REM 3. Node.js
call :LOG_INFO "[3/6] Verificando Node.js..."
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    call :LOG_OK "Node.js: !NODE_VER!"
) else (
    call :LOG_ERROR "Node.js: NO INSTALADO"
    set /a ERRORS+=1
)

REM 4. npm
call :LOG_INFO "[4/6] Verificando npm..."
npm --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    call :LOG_OK "npm: !NPM_VER!"
) else (
    call :LOG_ERROR "npm: NO INSTALADO"
    set /a ERRORS+=1
)

REM 5. Base de datos
call :LOG_INFO "[5/6] Verificando base de datos..."
if exist "%DATA_DIR%\VIOLET3.FDB" (
    call :LOG_OK "Base de datos: EXISTE"
) else (
    call :LOG_WARN "Base de datos: NO EXISTE"
)

REM 6. node_modules
call :LOG_INFO "[6/6] Verificando dependencias..."
if exist "%SCRIPT_DIR%node_modules" (
    call :LOG_OK "node_modules: EXISTE"
) else (
    call :LOG_WARN "node_modules: NO EXISTE"
)

echo.
echo ============================================================================

if %ERRORS% equ 0 (
    call :LOG_OK "RESULTADO: TODAS LAS VERIFICACIONES PASARON"
    echo.
    call :LOG_OK "¡El sistema esta listo para usar!"
    echo.
    call :LOG_INFO "Para iniciar:"
    call :LOG_INFO "1. Ejecute: npm run dev"
    call :LOG_INFO "2. Abra: http://localhost:5173"
) else (
    call :LOG_ERROR "RESULTADO: %ERRORS% VERIFICACION(ES) FALLARON"
    echo.
    call :LOG_WARN "Ejecute la instalacion completa para corregir."
)

echo ============================================================================
echo.

goto :EOF

REM ============================================================================
REM FIN
REM ============================================================================

:EOF
ENDLOCAL
exit /b 0
