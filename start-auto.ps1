# =============================================================================
# Violet ERP - Inicio Automático con Instalación
# Verifica e instala dependencias automáticamente antes de iniciar
# =============================================================================

Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║      VIOLET ERP - INICIANDO SISTEMA                       ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# =============================================================================
# 1. VERIFICAR E INSTALAR DEPENDENCIAS ROOT
# =============================================================================

Write-Host "[1/4] Verificando dependencias root..." -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠ Dependencias root no instaladas" -ForegroundColor Yellow
    Write-Host "  → Instalando con pnpm..." -ForegroundColor Cyan
    
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
    } else {
        Write-Host "  pnpm no encontrado, usando npm" -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "  ✓ Dependencias root instaladas" -ForegroundColor Green
} else {
    Write-Host "  ✓ Dependencias root verificadas" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 2. VERIFICAR E INSTALAR BACKEND
# =============================================================================

Write-Host "[2/4] Verificando backend..." -ForegroundColor Green

$backendPath = Join-Path $projectRoot "backend\api"

if (-not (Test-Path "$backendPath\node_modules")) {
    Write-Host "  ⚠ Dependencias del backend no instaladas" -ForegroundColor Yellow
    Write-Host "  → Instalando dependencias del backend..." -ForegroundColor Cyan
    
    Set-Location $backendPath
    
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
    } else {
        npm install
    }
    
    Set-Location $projectRoot
    Write-Host "  ✓ Dependencias del backend instaladas" -ForegroundColor Green
} else {
    Write-Host "  ✓ Backend verificado" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 3. VERIFICAR E INSTALAR FRONTEND
# =============================================================================

Write-Host "[3/4] Verificando frontend..." -ForegroundColor Green

$frontendPath = Join-Path $projectRoot "frontend\web"

if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "  ⚠ Dependencias del frontend no instaladas" -ForegroundColor Yellow
    Write-Host "  → Instalando dependencias del frontend..." -ForegroundColor Cyan
    
    Set-Location $frontendPath
    
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
    } else {
        npm install
    }
    
    Set-Location $projectRoot
    Write-Host "  ✓ Dependencias del frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "  ✓ Frontend verificado" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 4. INICIAR SERVIDORES
# =============================================================================

Write-Host "[4/4] Iniciando servidores..." -ForegroundColor Green
Write-Host ""

# Iniciar backend
Write-Host "  → Iniciando Backend (http://localhost:3000)..." -ForegroundColor Cyan
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$backendPath'
Write-Host '╔═══════════════════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║         VIOLET ERP - BACKEND API                          ║' -ForegroundColor Cyan
Write-Host '╚═══════════════════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host 'URL:    http://localhost:3000' -ForegroundColor Green
Write-Host 'Health: http://localhost:3000/health' -ForegroundColor Green
Write-Host 'API:    http://localhost:3000/api' -ForegroundColor Green
Write-Host ''
npm run dev
"@ -PassThru -WindowStyle Normal

# Esperar a que el backend inicie
Start-Sleep -Seconds 5

# Iniciar frontend
Write-Host "  → Iniciando Frontend (http://localhost:5173)..." -ForegroundColor Cyan
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$frontendPath'
Write-Host '╔═══════════════════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║         VIOLET ERP - FRONTEND WEB                         ║' -ForegroundColor Cyan
Write-Host '╚═══════════════════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host 'URL: http://localhost:5173' -ForegroundColor Green
Write-Host ''
npm run dev
"@ -PassThru -WindowStyle Normal

Write-Host ""
Write-Host ""
Write-Host " ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host " ║          SISTEMA INICIADO CORRECTAMENTE                   ║" -ForegroundColor Cyan
Write-Host " ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host " Accede a:" -ForegroundColor Yellow
Write-Host "   → Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   → Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   → Health:   http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host " Credenciales:" -ForegroundColor Yellow
Write-Host "   Email:    admin@violet-erp.com" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""

# Abrir navegador automáticamente después de 3 segundos
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host " Para detener el sistema:" -ForegroundColor Yellow
Write-Host "   → Cierra las ventanas de PowerShell del Backend y Frontend" -ForegroundColor Gray
Write-Host ""
