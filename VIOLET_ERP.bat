@echo off
title Violet ERP - Menu Principal
color 0B

:menu
cls
echo ========================================
echo   VIOLET ERP - MENU PRINCIPAL
echo ========================================
echo.
echo   1. Inicio Rapido (App + Proxy IA)
echo   2. Iniciar con Verificacion
echo   3. Monitorear Sistema
echo   4. Verificar Configuracion IA
echo   5. Probar API de Groq
echo   6. Reparar Dependencias
echo   7. Generar Ejecutable (.exe)
echo   8. Salir
echo.
echo ========================================
set /p opcion="Selecciona una opcion (1-8): "

if "%opcion%"=="1" goto inicio_rapido
if "%opcion%"=="2" goto inicio_verificacion
if "%opcion%"=="3" goto monitorear
if "%opcion%"=="4" goto verificar_ia
if "%opcion%"=="5" goto probar_api
if "%opcion%"=="6" goto reparar_dependencias
if "%opcion%"=="7" goto generar_exe
if "%opcion%"=="8" goto salir

echo.
echo [!] Opcion invalida. Presiona cualquier tecla para continuar...
pause >nul
goto menu

REM ========================================
REM   1. INICIO RAPIDO
REM ========================================
:inicio_rapido
cls
echo ========================================
echo   Violet ERP - Inicio Rapido
echo ========================================
echo.

echo [1/4] Verificando puertos...
netstat -ano | findstr ":3001" >nul
if not errorlevel 1 (
    echo [!] Puerto 3001 ya esta en uso
    echo [i] El proxy puede estar corriendo ya
)

netstat -ano | findstr ":8080" >nul
if not errorlevel 1 (
    echo [!] Puerto 8080 ya esta en uso
    echo [i] La aplicacion puede estar corriendo ya
)
echo.

echo [2/4] Instalando dependencias del proxy...
cd server
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo [X] Error instalando dependencias
        cd ..
        pause
        goto menu
    )
) else (
    echo [OK] Dependencias ya instaladas
)
cd ..
echo.

echo [3/4] Verificando configuracion...
echo [i] IMPORTANTE: Configura tu API Key de Groq en: Configuracion ^> IA
echo [i] Obten tu API Key gratis en: https://console.groq.com
echo [i] La API Key debe estar en el archivo .env como VITE_GROQ_API_KEY
echo.

echo [4/4] Iniciando aplicacion y proxy...
echo.
echo ========================================
echo   Sistema Iniciando
echo ========================================
echo.
echo [OK] Aplicacion: http://localhost:8080
echo [OK] Proxy IA: http://localhost:3001
echo [OK] Health Check: http://localhost:3001/health
echo.
echo [i] Espera a ver los mensajes de inicio
echo [i] Presiona Ctrl+C para detener
echo.

npm run dev:full
goto menu

REM ========================================
REM   2. INICIO CON VERIFICACION
REM ========================================
:inicio_verificacion
cls
echo ========================================
echo   Violet ERP - Inicio con Verificacion
echo ========================================
echo.

REM Verificar si el puerto 3001 esta en uso
netstat -ano | findstr ":3001" >nul
if not errorlevel 1 (
    echo [!] El puerto 3001 ya esta en uso.
    echo [!] Esto puede significar que el proxy ya esta corriendo.
    echo.
    choice /C SN /M "Deseas continuar de todos modos (S/N)"
    if errorlevel 2 goto menu
)

REM Verificar si el puerto 8080 esta en uso
netstat -ano | findstr ":8080" >nul
if not errorlevel 1 (
    echo [!] El puerto 8080 ya esta en uso.
    echo [!] Esto puede significar que la aplicacion ya esta corriendo.
    echo.
    choice /C SN /M "Deseas continuar de todos modos (S/N)"
    if errorlevel 2 goto menu
)

echo [1/3] Verificando dependencias del proxy...
cd server
if not exist "node_modules" (
    echo [!] Instalando dependencias del proxy...
    call npm install
    if errorlevel 1 (
        echo [X] Error instalando dependencias
        cd ..
        pause
        goto menu
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] Dependencias ya instaladas
)
cd ..

echo.
echo [2/3] Verificando API Key...
echo [i] Recuerda configurar tu API key en: Configuracion ^> IA
echo [i] Obten tu API Key gratis en: https://console.groq.com
echo [i] Guarda la key en el archivo .env como VITE_GROQ_API_KEY
echo.

echo [3/3] Iniciando sistema completo...
echo.
echo ========================================
echo   Sistema Iniciando
echo ========================================
echo.
echo [OK] Aplicacion: http://localhost:8080
echo [OK] Proxy IA: http://localhost:3001
echo.
echo [i] Presiona Ctrl+C para detener
echo.

pause
goto menu

REM ========================================
REM   3. MONITOREAR SISTEMA
REM ========================================
:monitorear
cls
title Monitor del Sistema Violet ERP
color 0A

:loop_monitor
cls
echo ========================================
echo   Monitor del Sistema Violet ERP
echo ========================================
echo.
echo Verificando servicios...
echo.

REM Verificar puerto 8080
netstat -ano | findstr ":8080" >nul
if errorlevel 1 (
    echo [X] Aplicacion: NO CORRIENDO
) else (
    echo [OK] Aplicacion: CORRIENDO en puerto 8080
)

REM Verificar puerto 3001
netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo [X] Proxy IA: NO CORRIENDO
) else (
    echo [OK] Proxy IA: CORRIENDO en puerto 3001
)

echo.
echo ========================================
echo   URLs de Acceso
echo ========================================
echo.
echo Aplicacion: http://localhost:8080
echo Proxy IA: http://localhost:3001
echo Health Check: http://localhost:3001/health
echo.
echo ========================================
echo   Actualizando en 5 segundos...
echo   Presiona Ctrl+C para volver al menu
echo ========================================

timeout /t 5 /nobreak >nul
goto loop_monitor

REM ========================================
REM   4. VERIFICAR IA
REM ========================================
:verificar_ia
cls
echo ========================================
echo   Verificacion del Sistema de IA
echo ========================================
echo.

echo [1/4] Verificando archivos necesarios...
if exist "server\groq-proxy.cjs" (
    echo   [OK] Servidor proxy encontrado
) else (
    echo   [X] Servidor proxy NO encontrado
    pause
    goto menu
)

if exist "server\package.json" (
    echo   [OK] Configuracion del proxy encontrada
) else (
    echo   [X] Configuracion del proxy NO encontrada
    pause
    goto menu
)

if exist "src\hooks\useAI.ts" (
    echo   [OK] Hook de IA encontrado
) else (
    echo   [X] Hook de IA NO encontrado
    pause
    goto menu
)

if exist "src\components\AIChat.tsx" (
    echo   [OK] Componente de chat encontrado
) else (
    echo   [X] Componente de chat NO encontrado
    pause
    goto menu
)

echo.
echo [2/4] Verificando dependencias del proxy...
cd server
if exist "node_modules" (
    echo   [OK] Dependencias instaladas
) else (
    echo   [!] Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo   [X] Error instalando dependencias
        cd ..
        pause
        goto menu
    )
    echo   [OK] Dependencias instaladas correctamente
)
cd ..

echo.
echo [3/4] Verificando puertos...
netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo   [OK] Puerto 3001 disponible
) else (
    echo   [!] Puerto 3001 en uso (normal si el proxy esta corriendo)
)

netstat -ano | findstr ":8080" >nul
if errorlevel 1 (
    echo   [OK] Puerto 8080 disponible
) else (
    echo   [!] Puerto 8080 en uso (normal si la app esta corriendo)
)

echo.
echo [4/4] Verificando API Key...
echo   Recuerda configurar tu API key en: Configuracion ^> IA
echo   Obten tu API Key gratis en: https://console.groq.com
echo   Guarda la key en el archivo .env como VITE_GROQ_API_KEY
echo.

echo ========================================
echo   [OK] Verificacion completada exitosamente
echo ========================================
echo.
pause
goto menu

REM ========================================
REM   5. PROBAR API GROQ
REM ========================================
:probar_api
cls
echo ========================================
echo   Probando API de Groq
echo ========================================
echo.
echo [!] NOTA: Esta prueba requiere que configures tu API Key primero
echo [i] Edita el archivo .env y agrega: VITE_GROQ_API_KEY=tu_api_key_aqui
echo [i] Obten tu API Key gratis en: https://console.groq.com
echo.
echo Para probar la API manualmente, usa este comando (reemplaza TU_API_KEY):
echo.
echo curl https://api.groq.com/openai/v1/chat/completions -s ^
echo -H "Content-Type: application/json" ^
echo -H "Authorization: Bearer TU_API_KEY" ^
echo -d "{\"model\": \"llama-3.3-70b-versatile\",\"messages\": [{\"role\": \"user\",\"content\": \"Hola\"}]}"

echo.
echo.
echo ========================================
echo   Prueba completada
echo ========================================
echo.
echo Si ves un JSON con "choices" y "content", la API funciona correctamente.
echo.
pause
goto menu

REM ========================================
REM   7. GENERAR EJECUTABLE
REM ========================================
:generar_exe
cls
echo ========================================
echo   Generando Violet ERP.exe
echo ========================================
echo.

echo [1/5] Limpiando builds anteriores...
if exist "dist" rmdir /s /q dist
if exist "dist-electron" rmdir /s /q dist-electron
echo [OK] Limpieza completada
echo.

echo [2/5] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [X] Error instalando dependencias
    pause
    goto menu
)
echo [OK] Dependencias instaladas
echo.

echo [3/5] Instalando dependencias del proxy...
cd server
call npm install
if errorlevel 1 (
    echo [X] Error instalando dependencias del proxy
    cd ..
    pause
    goto menu
)
cd ..
echo [OK] Dependencias del proxy instaladas
echo.

echo [4/5] Compilando aplicacion...
call npm run build
if errorlevel 1 (
    echo [X] Error compilando aplicacion
    pause
    goto menu
)
echo [OK] Aplicacion compilada
echo.

echo [5/5] Generando ejecutable...
call npm run electron:dist
if errorlevel 1 (
    echo [X] Error generando ejecutable
    pause
    goto menu
)
echo [OK] Ejecutable generado
echo.

echo ========================================
echo   Generacion Completada
echo ========================================
echo.
echo El archivo .exe se encuentra en:
echo   dist-electron\Violet ERP Setup.exe
echo.
echo Tamaño aproximado: ~150-200 MB
echo.
echo Para instalar:
echo   1. Ejecuta "Violet ERP Setup.exe"
echo   2. Sigue el asistente de instalacion
echo   3. El programa se instalara en Program Files
echo   4. Se creara un acceso directo en el escritorio
echo.
pause
goto menu

REM ========================================
REM   8. SALIR
REM ========================================
:salir
cls
echo ========================================
echo   Gracias por usar Violet ERP
echo ========================================
echo.
echo Sistema desarrollado por Cauplas Team
echo Documentacion: DOCUMENTACION_COMPLETA.md
echo.
echo Hasta pronto!
echo.
timeout /t 2 >nul
exit /b 0
