# =============================================================================
# VIOLET ERP - Configuración Rápida de Firebird
# =============================================================================
# Este script te ayuda a configurar la conexión a Firebird correctamente
# =============================================================================

Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║      VIOLET ERP - CONFIGURADOR DE FIREBIRD                ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si Firebird está instalado
Write-Host "[1/4] Verificando Firebird..." -ForegroundColor Green

$firebirdService = Get-Service -Name "Firebird*" -ErrorAction SilentlyContinue

if ($firebirdService) {
    Write-Host "  ✓ Firebird está instalado" -ForegroundColor Green
    Write-Host "    Estado: $($firebirdService.Status)" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Firebird NO está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Para instalar Firebird:" -ForegroundColor Yellow
    Write-Host "  1. Ve a: https://firebirdsql.org" -ForegroundColor White
    Write-Host "  2. Descarga Firebird 3.0+" -ForegroundColor White
    Write-Host "  3. Ejecuta el instalador" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "  ¿Deseas continuar sin Firebird? (S/N)"
    if ($continue -ne 'S' -and $continue -ne 's') {
        exit
    }
}

Write-Host ""

# Detectar ruta de Firebird
Write-Host "[2/4] Detectando configuración de Firebird..." -ForegroundColor Green

$defaultPaths = @(
    "C:/Program Files/Firebird/Firebird_3/data/",
    "C:/Program Files (x86)/Firebird/Firebird_3/data/",
    "C:/Firebird/data/",
    "C:/VioletERP/database/"
)

$foundPath = $null

foreach ($path in $defaultPaths) {
    if (Test-Path $path) {
        $foundPath = $path
        Write-Host "  ✓ Ruta encontrada: $path" -ForegroundColor Green
        break
    }
}

if (-not $foundPath) {
    Write-Host "  ⚠ No se encontró una instalación estándar de Firebird" -ForegroundColor Yellow
    $foundPath = "C:/VioletERP/database/"
}

Write-Host ""

# Configurar .env
Write-Host "[3/4] Configurando archivo .env..." -ForegroundColor Green

$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "  ✓ .env creado desde .env.example" -ForegroundColor Green
    } else {
        Write-Host "  ✗ No se encontró .env.example" -ForegroundColor Red
    }
} else {
    Write-Host "  ✓ .env ya existe" -ForegroundColor Green
}

Write-Host ""

# Solicitar ruta de la base de datos
Write-Host "[4/4] Configurando ruta de la base de datos..." -ForegroundColor Green
Write-Host ""
Write-Host "  Ingresa la ruta completa de tu base de datos Firebird:" -ForegroundColor Yellow
Write-Host "  Ejemplo: C:/VioletERP/database/valery3.fdb" -ForegroundColor Gray
Write-Host ""

$dbPath = Read-Host "  Ruta de la base de datos"

if ([string]::IsNullOrWhiteSpace($dbPath)) {
    $dbPath = "$foundPath\valery3.fdb"
    Write-Host "  Usando ruta por defecto: $dbPath" -ForegroundColor Gray
}

# Actualizar .env
$envContent = Get-Content $envPath -Raw
$envContent = $envContent -replace "FIREBIRD_DATABASE=.*", "FIREBIRD_DATABASE=localhost:$dbPath"
$envContent | Set-Content $envPath -NoNewline

Write-Host "  ✓ .env actualizado con la ruta: $dbPath" -ForegroundColor Green

Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║          CONFIGURACIÓN COMPLETADA                         ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Inicializar la base de datos:" -ForegroundColor White
Write-Host "     cd backend/api" -ForegroundColor Gray
Write-Host "     pnpm db:init" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Iniciar el sistema:" -ForegroundColor White
Write-Host "     pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Credenciales por defecto:" -ForegroundColor White
Write-Host "    Email: admin@violet-erp.com" -ForegroundColor Gray
Write-Host "    Password: admin123" -ForegroundColor Gray
Write-Host ""

Write-Host "  Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
