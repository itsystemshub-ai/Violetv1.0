# ============================================================================
# VIOLET ERP - INSTALADOR AUTOMÁTICO (PowerShell)
# Instalación completa de Firebird SQL + Node.js + Dependencias
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('All', 'Firebird', 'Node', 'Configure', 'Verify')]
    [string]$Mode = 'All',
    
    [Parameter(Mandatory=$false)]
    [switch]$NoRestart,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$ErrorActionPreference = 'Stop'
$FirebirdVersion = '2.5.2.26540'
$FirebirdUrl = 'https://sourceforge.net/projects/firebird/projects/firebird-win32/2.5.2-Release/Firebird-2.5.2.26540_0_Win32.exe/download'
$NodeVersion = '18.20.0'
$NodeUrl = 'https://nodejs.org/dist/v18.20.0/node-v18.20.0-x64.msi'
$InstallDir = 'C:\Program Files\Firebird\Firebird_2_5'
$DataDir = 'C:\VIOLET_ERP'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $DataDir 'LOGS\instalacion.log'

# ============================================================================
# FUNCIONES DE LOG
# ============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Crear directorio de logs si no existe
    $logDir = Split-Path $LogFile -Parent
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    
    # Escribir al archivo
    Add-Content -Path $LogFile -Value $logEntry
    
    # Escribir a consola con colores
    switch ($Level) {
        'INFO' { Write-Host $logEntry -ForegroundColor Cyan }
        'OK' { Write-Host $logEntry -ForegroundColor Green }
        'WARN' { Write-Host $logEntry -ForegroundColor Yellow }
        'ERROR' { Write-Host $logEntry -ForegroundColor Red }
        default { Write-Host $logEntry }
    }
}

# ============================================================================
# VERIFICAR PERMISOS DE ADMINISTRADOR
# ============================================================================

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (!(Test-Administrator)) {
    Write-Log 'Este script requiere permisos de administrador' 'ERROR'
    Write-Host ''
    Write-Host 'Por favor ejecute este script como administrador:' -ForegroundColor Yellow
    Write-Host '1. Click derecho en el archivo' -ForegroundColor Yellow
    Write-Host '2. Seleccione "Ejecutar como administrador"' -ForegroundColor Yellow
    Write-Host ''
    Start-Sleep -Seconds 5
    exit 1
}

Write-Log 'Permisos de administrador verificados' 'OK'

# ============================================================================
# CREAR DIRECTORIOS
# ============================================================================

function New-DataDirectories {
    Write-Log 'Creando directorios...' 'INFO'
    
    $directories = @(
        $DataDir,
        (Join-Path $DataDir 'BACKUPS'),
        (Join-Path $DataDir 'LOGS'),
        (Join-Path $DataDir 'TEMP')
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Creado: $dir" 'OK'
        }
    }
}

# ============================================================================
# INSTALAR FIREBIRD
# ============================================================================

function Install-Firebird {
    Write-Log '=== INSTALANDO FIREBIRD SQL ===' 'INFO'
    
    $downloadFile = Join-Path $env:TEMP 'Firebird-2.5.2.26540_0_Win32.exe'
    
    # Descargar si no existe
    if (!(Test-Path $downloadFile)) {
        Write-Log 'Descargando Firebird SQL 2.5.2...' 'INFO'
        
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $FirebirdUrl -OutFile $downloadFile -UseBasicParsing
            Write-Log "Descarga completada: $downloadFile" 'OK'
        }
        catch {
            Write-Log "Error al descargar: $_" 'ERROR'
            Write-Log 'Descargue manualmente desde: https://firebirdsql.org/en/firebird-2-5/' 'WARN'
            return $false
        }
    }
    
    # Instalar
    Write-Log 'Instalando Firebird SQL...' 'INFO'
    
    try {
        $process = Start-Process -FilePath $downloadFile -ArgumentList '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-' -PassThru -Wait
        Write-Log 'Firebird instalado exitosamente' 'OK'
    }
    catch {
        Write-Log "Error en instalacion: $_" 'ERROR'
        return $false
    }
    
    # Esperar servicio
    Write-Log 'Esperando servicio Firebird...' 'INFO'
    Start-Sleep -Seconds 10
    
    # Verificar servicio
    $service = Get-Service -Name 'FirebirdServerDefaultInstance' -ErrorAction SilentlyContinue
    if ($service) {
        Write-Log 'Servicio Firebird corriendo' 'OK'
        return $true
    }
    else {
        Write-Log 'Servicio Firebird no encontrado' 'ERROR'
        return $false
    }
}

# ============================================================================
# CONFIGURAR FIREWALL
# ============================================================================

function Set-FirewallRules {
    Write-Log 'Configurando Firewall de Windows...' 'INFO'
    
    # Regla para puerto
    $ruleName = 'Firebird SQL'
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    if (!$existingRule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3050 -Action Allow | Out-Null
        Write-Log 'Regla de firewall agregada (puerto 3050)' 'OK'
    }
    else {
        Write-Log 'Regla de firewall ya existe' 'INFO'
    }
    
    # Regla para ejecutable
    $ruleName = 'Firebird Server'
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    if (!$existingRule) {
        $fbServer = Join-Path $InstallDir 'bin\fbserver.exe'
        if (Test-Path $fbServer) {
            New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Program $fbServer -Action Allow | Out-Null
            Write-Log 'Regla de firewall para fbserver.exe' 'OK'
        }
    }
}

# ============================================================================
# CREAR BASE DE DATOS
# ============================================================================

function New-VioletDatabase {
    Write-Log 'Creando base de datos VIOLET3.FDB...' 'INFO'
    
    $isqlPath = Join-Path $InstallDir 'bin\isql.exe'
    $createScript = Join-Path $ScriptDir 'packages\database\firebird\00_crear_base_de_datos.sql'
    
    if (!(Test-Path $isqlPath)) {
        Write-Log 'isql.exe no encontrado. ¿Firebird esta instalado?' 'ERROR'
        return $false
    }
    
    if (!(Test-Path $createScript)) {
        Write-Log "Script no encontrado: $createScript" 'ERROR'
        return $false
    }
    
    # Ejecutar script
    Write-Log 'Ejecutando script de creacion...' 'INFO'
    
    try {
        & $isqlPath -user SYSDBA -password masterkey -i $createScript
        Write-Log 'Base de datos creada exitosamente' 'OK'
        return $true
    }
    catch {
        Write-Log "Error al crear base de datos: $_" 'ERROR'
        return $false
    }
}

# ============================================================================
# CONFIGURAR ALIAS
# ============================================================================

function Set-Alias {
    Write-Log 'Configurando alias...' 'INFO'
    
    $aliasFile = Join-Path $InstallDir 'aliases.conf'
    
    if (!(Test-Path $aliasFile)) {
        Write-Log 'aliases.conf no encontrado' 'ERROR'
        return $false
    }
    
    # Verificar si ya existen alias
    $content = Get-Content $aliasFile -Raw
    if ($content -notmatch 'violet\s*=') {
        $newAliases = @"

# Violet ERP
violet = $DataDir\VIOLET3.FDB
violet3 = $DataDir\VIOLET3.FDB
"@
        Add-Content -Path $aliasFile -Value $newAliases
        Write-Log 'Alias agregados a aliases.conf' 'OK'
    }
    else {
        Write-Log 'Alias ya existen' 'INFO'
    }
    
    return $true
}

# ============================================================================
# INSTALAR NODE.JS
# ============================================================================

function Install-NodeJs {
    Write-Log '=== INSTALANDO NODE.JS ===' 'INFO'
    
    $downloadFile = Join-Path $env:TEMP 'node-v18.20.0-x64.msi'
    
    # Descargar si no existe
    if (!(Test-Path $downloadFile)) {
        Write-Log 'Descargando Node.js 18.20.0 LTS...' 'INFO'
        
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $NodeUrl -OutFile $downloadFile -UseBasicParsing
            Write-Log "Descarga completada: $downloadFile" 'OK'
        }
        catch {
            Write-Log "Error al descargar: $_" 'ERROR'
            Write-Log 'Descargue manualmente desde: https://nodejs.org/' 'WARN'
            return $false
        }
    }
    
    # Instalar
    Write-Log 'Instalando Node.js...' 'INFO'
    
    try {
        $process = Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i', $downloadFile, '/quiet', '/norestart' -PassThru -Wait
        Write-Log 'Node.js instalado exitosamente' 'OK'
        return $true
    }
    catch {
        Write-Log "Error en instalacion: $_" 'ERROR'
        return $false
    }
}

# ============================================================================
# INSTALAR DEPENDENCIAS NPM
# ============================================================================

function Install-NpmDependencies {
    Write-Log 'Instalando dependencias NPM...' 'INFO'
    
    Set-Location $ScriptDir
    
    # Limpiar cache
    Write-Log 'Limpiando cache NPM...' 'INFO'
    npm cache clean --force | Out-Null
    
    # Instalar
    Write-Log 'Esto puede tomar varios minutos...' 'INFO'
    
    try {
        npm install
        Write-Log 'Dependencias instaladas exitosamente' 'OK'
        return $true
    }
    catch {
        Write-Log "Error al instalar dependencias: $_" 'ERROR'
        return $false
    }
}

# ============================================================================
# CONSTRUIR PAQUETES
# ============================================================================

function Build-Packages {
    Write-Log 'Construyendo paquetes compartidos...' 'INFO'
    
    Set-Location $ScriptDir
    
    try {
        npm run build:packages
        Write-Log 'Paquetes construidos exitosamente' 'OK'
        return $true
    }
    catch {
        Write-Log "Error al construir paquetes: $_" 'WARN'
        return $false
    }
}

# ============================================================================
# VERIFICAR INSTALACIÓN
# ============================================================================

function Test-Installation {
    Write-Log '' 'INFO'
    Write-Log '=== VERIFICACION DE INSTALACION ===' 'INFO'
    Write-Log '' 'INFO'
    
    $errors = 0
    
    # 1. Firebird
    Write-Log '[1/6] Verificando Firebird SQL...' 'INFO'
    $service = Get-Service -Name 'FirebirdServerDefaultInstance' -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Log '[OK] Servicio Firebird: CORRIENDO' 'OK'
    }
    else {
        Write-Log '[ERROR] Servicio Firebird: NO INSTALADO' 'ERROR'
        $errors++
    }
    
    # 2. Puerto
    Write-Log '[2/6] Verificando puerto 3050...' 'INFO'
    $port = Get-NetTCPConnection -LocalPort 3050 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Log '[OK] Puerto 3050: ESCUCHANDO' 'OK'
    }
    else {
        Write-Log '[WARN] Puerto 3050: NO ESCUCHANDO' 'WARN'
        $errors++
    }
    
    # 3. Node.js
    Write-Log '[3/6] Verificando Node.js...' 'INFO'
    try {
        $nodeVersion = node --version
        Write-Log "[OK] Node.js: $nodeVersion" 'OK'
    }
    catch {
        Write-Log '[ERROR] Node.js: NO INSTALADO' 'ERROR'
        $errors++
    }
    
    # 4. npm
    Write-Log '[4/6] Verificando npm...' 'INFO'
    try {
        $npmVersion = npm --version
        Write-Log "[OK] npm: $npmVersion" 'OK'
    }
    catch {
        Write-Log '[ERROR] npm: NO INSTALADO' 'ERROR'
        $errors++
    }
    
    # 5. Base de datos
    Write-Log '[5/6] Verificando base de datos...' 'INFO'
    $dbPath = Join-Path $DataDir 'VIOLET3.FDB'
    if (Test-Path $dbPath) {
        Write-Log '[OK] Base de datos: EXISTE' 'OK'
    }
    else {
        Write-Log '[WARN] Base de datos: NO EXISTE' 'WARN'
    }
    
    # 6. node_modules
    Write-Log '[6/6] Verificando dependencias...' 'INFO'
    $nodeModules = Join-Path $ScriptDir 'node_modules'
    if (Test-Path $nodeModules) {
        Write-Log '[OK] node_modules: EXISTE' 'OK'
    }
    else {
        Write-Log '[WARN] node_modules: NO EXISTE' 'WARN'
    }
    
    Write-Log '' 'INFO'
    Write-Log '================================' 'INFO'
    
    if ($errors -eq 0) {
        Write-Log 'RESULTADO: TODAS LAS VERIFICACIONES PASARON' 'OK'
        Write-Log '' 'INFO'
        Write-Log '¡El sistema esta listo para usar!' 'OK'
        Write-Log '' 'INFO'
        Write-Log 'Para iniciar:' 'INFO'
        Write-Log '1. Ejecute: npm run dev' 'INFO'
        Write-Log '2. Abra: http://localhost:5173' 'INFO'
    }
    else {
        Write-Log "RESULTADO: $errors VERIFICACION(ES) FALLARON" 'ERROR'
        Write-Log '' 'INFO'
        Write-Log 'Ejecute la instalacion completa para corregir.' 'WARN'
    }
    
    Write-Log '' 'INFO'
    
    return ($errors -eq 0)
}

# ============================================================================
# MENÚ PRINCIPAL
# ============================================================================

function Show-Menu {
    Clear-Host
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host '   VIOLET ERP - INSTALADOR AUTOMATICO' -ForegroundColor Cyan
    Write-Host '============================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Seleccione el tipo de instalacion:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  1. COMPLETA (Firebird + Node.js + Dependencias) - RECOMENDADO'
    Write-Host '  2. Solo Firebird SQL (Base de datos)'
    Write-Host '  3. Solo Node.js y Dependencias'
    Write-Host '  4. Solo Configuracion (Crear BD + Configurar)'
    Write-Host '  5. Verificar Instalacion'
    Write-Host '  6. Salir'
    Write-Host ''
}

# ============================================================================
# MAIN
# ============================================================================

try {
    # Si se especificó modo por línea de comandos
    if ($Mode -eq 'Verify') {
        Test-Installation
        return
    }
    
    # Menú interactivo
    do {
        Show-Menu
        $option = Read-Host 'Ingrese su opcion (1-6)'
        
        switch ($option) {
            '1' {
                # Instalación completa
                Write-Log '' 'INFO'
                Write-Log '=== INICIANDO INSTALACION COMPLETA ===' 'INFO'
                Write-Log '' 'INFO'
                
                New-DataDirectories
                
                if (Install-Firebird) {
                    Set-FirewallRules
                    New-VioletDatabase
                    Set-Alias
                }
                
                Write-Log '' 'INFO'
                
                if (Install-NodeJs) {
                    Install-NpmDependencies
                    Build-Packages
                }
                
                Write-Log '' 'INFO'
                Test-Installation
                
                Write-Log '' 'INFO'
                Write-Log '============================================' -ForegroundColor Green
                Write-Host '   ¡INSTALACION COMPLETADA!' -ForegroundColor Green
                Write-Log '============================================' -ForegroundColor Green
                Write-Log '' 'INFO'
                Write-Log 'Siguiente paso:' 'INFO'
                Write-Log '1. Configure .env si es necesario' 'INFO'
                Write-Log '2. Ejecute: npm run dev' 'INFO'
                Write-Log '' 'INFO'
                
                Read-Host 'Presione Enter para continuar'
            }
            
            '2' {
                # Solo Firebird
                New-DataDirectories
                Install-Firebird
                Set-FirewallRules
                New-VioletDatabase
                Set-Alias
                Read-Host 'Presione Enter para continuar'
            }
            
            '3' {
                # Solo Node.js
                Install-NodeJs
                Install-NpmDependencies
                Build-Packages
                Read-Host 'Presione Enter para continuar'
            }
            
            '4' {
                # Solo configuración
                New-DataDirectories
                New-VioletDatabase
                Set-Alias
                Read-Host 'Presione Enter para continuar'
            }
            
            '5' {
                # Verificar
                Test-Installation
                Read-Host 'Presione Enter para continuar'
            }
        }
    }
    while ($option -ne '6')
}
catch {
    Write-Log "Error fatal: $_" 'ERROR'
    Write-Log $_.ScriptStackTrace 'ERROR'
    Read-Host 'Presione Enter para salir'
}
