# ============================================================================
# Script de Construcción Automatizada - Violet ERP
# Genera el instalador .exe para Windows
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VIOLET ERP - BUILD SCRIPT                   ║" -ForegroundColor Cyan
Write-Host "║                  Generador de Ejecutable (.exe)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar mensajes con colores
function Write-Step {
    param([string]$Message)
    Write-Host "► $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

# Verificar Node.js
Write-Step "Verificando Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado. Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
}

# Verificar npm
Write-Step "Verificando npm..."
try {
    $npmVersion = npm --version
    Write-Success "npm instalado: v$npmVersion"
} catch {
    Write-Error "npm no está disponible"
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Preguntar si desea limpiar antes de construir
$clean = Read-Host "¿Deseas limpiar caché y dependencias antes de construir? (s/N)"
if ($clean -eq "s" -or $clean -eq "S") {
    Write-Step "Limpiando archivos antiguos..."
    
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
        Write-Success "node_modules eliminado"
    }
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Success "dist eliminado"
    }
    
    if (Test-Path "dist-electron") {
        Remove-Item -Recurse -Force "dist-electron"
        Write-Success "dist-electron eliminado"
    }
    
    Write-Host ""
    Write-Step "Instalando dependencias..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error al instalar dependencias"
        exit 1
    }
    Write-Success "Dependencias instaladas correctamente"
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar TypeScript
Write-Step "Verificando errores de TypeScript..."
npm run typecheck

if ($LASTEXITCODE -ne 0) {
    Write-Error "Hay errores de TypeScript. Por favor, corrígelos antes de continuar."
    $continue = Read-Host "¿Deseas continuar de todos modos? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Construir la aplicación
Write-Step "Compilando TypeScript y construyendo aplicación React..."
Write-Info "Esto puede tardar 2-5 minutos..."
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al construir la aplicación"
    exit 1
}

Write-Success "Aplicación construida correctamente"
Write-Host ""

# Generar el ejecutable
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Step "Generando instalador .exe..."
Write-Info "Esto puede tardar 5-10 minutos en el primer build..."
Write-Host ""

npm run electron:dist

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al generar el ejecutable"
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar resultado
if (Test-Path "dist-electron") {
    $exeFiles = Get-ChildItem -Path "dist-electron" -Filter "*.exe" -Recurse
    
    if ($exeFiles.Count -gt 0) {
        Write-Success "¡Instalador generado exitosamente!"
        Write-Host ""
        Write-Host "📦 Archivos generados:" -ForegroundColor Green
        Write-Host ""
        
        foreach ($file in $exeFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "   • $($file.Name)" -ForegroundColor White
            Write-Host "     Ubicación: $($file.FullName)" -ForegroundColor Gray
            Write-Host "     Tamaño: $size MB" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✓ BUILD COMPLETADO EXITOSAMENTE" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
        
        # Preguntar si desea abrir la carpeta
        $open = Read-Host "¿Deseas abrir la carpeta con el instalador? (S/n)"
        if ($open -ne "n" -and $open -ne "N") {
            Start-Process "explorer.exe" -ArgumentList (Resolve-Path "dist-electron")
        }
        
    } else {
        Write-Error "No se encontró el archivo .exe en dist-electron"
        exit 1
    }
} else {
    Write-Error "La carpeta dist-electron no fue creada"
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
