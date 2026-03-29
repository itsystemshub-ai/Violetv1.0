# =============================================================================
# Violet ERP - Instalación Automática (PowerShell)
# Ejecutar como Administrador
# =============================================================================

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host " [!] Se requieren permisos de administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host " Haz clic derecho en install-all.ps1 y selecciona:" -ForegroundColor Yellow
    Write-Host " 'Ejecutar con PowerShell como administrador'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Presiona cualquier tecla para salir..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║         VIOLET ERP - INSTALACIÓN AUTOMÁTICA              ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# 1. Verificar e instalar Node.js
# =============================================================================

Write-Host " [1/5] Verificando Node.js..." -ForegroundColor Green
Write-Host ""

try {
    $nodeVersion = node --version
    Write-Host " [✓] Node.js ya está instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " [!] Node.js no está instalado" -ForegroundColor Yellow
    Write-Host " [→] Instalando Node.js..." -ForegroundColor Cyan
    
    # Descargar e instalar Node.js
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    $downloadUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    
    Write-Host " [→] Descargando Node.js..."
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
    
    Write-Host " [→] Instalando..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet /norestart"
    
    Remove-Item $installerPath -Force
    
    Write-Host " [✓] Node.js instalado" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 2. Instalar pnpm
# =============================================================================

Write-Host " [2/5] Verificando pnpm..." -ForegroundColor Green
Write-Host ""

try {
    $pnpmVersion = pnpm --version
    Write-Host " [✓] pnpm ya está instalado: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host " [!] pnpm no está instalado" -ForegroundColor Yellow
    Write-Host " [→] Instalando pnpm globalmente..." -ForegroundColor Cyan
    
    npm install -g pnpm
    
    Write-Host " [✓] pnpm instalado" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 3. Verificar Firebird
# =============================================================================

Write-Host " [3/5] Verificando Firebird..." -ForegroundColor Green
Write-Host ""

$firebirdService = Get-Service -Name "FirebirdServer*" -ErrorAction SilentlyContinue

if ($firebirdService) {
    Write-Host " [✓] Firebird está instalado" -ForegroundColor Green
    Write-Host "     Estado: $($firebirdService.Status)" -ForegroundColor Gray
} else {
    Write-Host " [!] Firebird no está instalado" -ForegroundColor Yellow
    Write-Host " [→] Para instalar Firebird:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "     1. Descarga desde: https://firebirdsql.org" -ForegroundColor White
    Write-Host "     2. O ejecuta el instalador en installers\" -ForegroundColor White
    Write-Host ""
    Write-Host " [→] ¿Deseas descargar Firebird ahora? (S/N)" -ForegroundColor Yellow
    $downloadFirebird = Read-Host
    
    if ($downloadFirebird -eq 'S' -or $downloadFirebird -eq 's') {
        $firebirdPath = "$env:TEMP\firebird-installer.exe"
        $firebirdUrl = "https://github.com/FirebirdSQL/firebird/releases/download/R3_0_10/Firebird-3.0.10.33601_Win32.exe"
        
        Write-Host " [→] Descargando Firebird..."
        Invoke-WebRequest -Uri $firebirdUrl -OutFile $firebirdPath -UseBasicParsing
        
        Write-Host " [→] Ejecutando instalador..."
        Start-Process $firebirdPath -Wait -ArgumentList "/VERYSILENT"
        
        Write-Host " [✓] Firebird instalado" -ForegroundColor Green
    }
}

Write-Host ""

# =============================================================================
# 4. Instalar dependencias del proyecto
# =============================================================================

Write-Host " [4/5] Instalando dependencias del proyecto..." -ForegroundColor Green
Write-Host ""

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

if (Test-Path "pnpm-lock.yaml") {
    Write-Host " [→] Usando pnpm..."
    pnpm install
} else {
    Write-Host " [→] Usando npm..."
    
    npm install
    
    if (Test-Path "backend\api\package.json") {
        Set-Location "backend\api"
        npm install
        Set-Location "..\.."
    }
    
    if (Test-Path "frontend\web\package.json") {
        Set-Location "frontend\web"
        npm install
        Set-Location "..\.."
    }
}

Write-Host " [✓] Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# =============================================================================
# 5. Configurar .env
# =============================================================================

Write-Host " [5/5] Configurando variables de entorno..." -ForegroundColor Green
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host " [→] Creando .env desde .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Host " [✓] .env creado" -ForegroundColor Green
    Write-Host ""
    Write-Host " [!] IMPORTANTE: Edita .env con tus credenciales de Firebird" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host " [✓] .env ya existe" -ForegroundColor Green
    Write-Host ""
}

# =============================================================================
# Resumen final
# =============================================================================

Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║           INSTALACIÓN COMPLETADA EXITOSAMENTE             ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host " Componentes instalados:" -ForegroundColor White
Write-Host "   ✓ Node.js" -ForegroundColor Green
Write-Host "   ✓ pnpm" -ForegroundColor Green
Write-Host "   ✓ Dependencias del proyecto" -ForegroundColor Green
Write-Host ""
Write-Host " Próximos pasos:" -ForegroundColor White
Write-Host "   1. Edita .env con tus credenciales de Firebird" -ForegroundColor Yellow
Write-Host "   2. Inicializa la base de datos (database/firebird/schema.sql)" -ForegroundColor Yellow
Write-Host "   3. Ejecuta: .\start.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host " Para inicio automático en Windows:" -ForegroundColor White
Write-Host "   → Ejecuta: .\setup-startup.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host " Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
