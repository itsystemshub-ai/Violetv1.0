# Script para verificar la estructura del empaquetado de Violet ERP
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN DE EMPAQUETADO - VIOLET ERP" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el directorio unpacked
$unpackedDir = "dist-electron\win-unpacked"
if (Test-Path $unpackedDir) {
    Write-Host "✓ Directorio unpacked encontrado" -ForegroundColor Green
    
    # Verificar estructura de resources
    Write-Host "`nEstructura de resources:" -ForegroundColor Yellow
    
    $resourcesDir = "$unpackedDir\resources"
    if (Test-Path $resourcesDir) {
        Write-Host "  ✓ resources/" -ForegroundColor Green
        
        # Verificar app.asar
        if (Test-Path "$resourcesDir\app.asar") {
            $asarSize = (Get-Item "$resourcesDir\app.asar").Length / 1MB
            Write-Host "    ✓ app.asar ($([math]::Round($asarSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "    ✗ app.asar NO ENCONTRADO" -ForegroundColor Red
        }
        
        # Verificar app.asar.unpacked
        if (Test-Path "$resourcesDir\app.asar.unpacked") {
            Write-Host "    ✓ app.asar.unpacked/" -ForegroundColor Green
            
            # Verificar backend
            if (Test-Path "$resourcesDir\app.asar.unpacked\backend") {
                Write-Host "      ✓ backend/" -ForegroundColor Green
            } else {
                Write-Host "      ✗ backend/ NO ENCONTRADO" -ForegroundColor Red
            }
            
            # Verificar dist
            if (Test-Path "$resourcesDir\app.asar.unpacked\dist") {
                Write-Host "      ✓ dist/" -ForegroundColor Green
                
                # Verificar index.html
                if (Test-Path "$resourcesDir\app.asar.unpacked\dist\index.html") {
                    Write-Host "        ✓ index.html" -ForegroundColor Green
                } else {
                    Write-Host "        ✗ index.html NO ENCONTRADO" -ForegroundColor Red
                }
                
                # Verificar assets
                if (Test-Path "$resourcesDir\app.asar.unpacked\dist\assets") {
                    $assetsCount = (Get-ChildItem "$resourcesDir\app.asar.unpacked\dist\assets").Count
                    Write-Host "        ✓ assets/ ($assetsCount archivos)" -ForegroundColor Green
                } else {
                    Write-Host "        ✗ assets/ NO ENCONTRADO" -ForegroundColor Red
                }
            } else {
                Write-Host "      ✗ dist/ NO ENCONTRADO" -ForegroundColor Red
            }
        } else {
            Write-Host "    ✗ app.asar.unpacked/ NO ENCONTRADO" -ForegroundColor Red
        }
        
        # Verificar dist en resources (extraResources)
        if (Test-Path "$resourcesDir\dist") {
            Write-Host "    ✓ dist/ (extraResources)" -ForegroundColor Green
            
            # Verificar index.html
            if (Test-Path "$resourcesDir\dist\index.html") {
                Write-Host "      ✓ index.html" -ForegroundColor Green
            } else {
                Write-Host "      ✗ index.html NO ENCONTRADO" -ForegroundColor Red
            }
            
            # Verificar assets
            if (Test-Path "$resourcesDir\dist\assets") {
                $assetsCount = (Get-ChildItem "$resourcesDir\dist\assets").Count
                Write-Host "      ✓ assets/ ($assetsCount archivos)" -ForegroundColor Green
            } else {
                Write-Host "      ✗ assets/ NO ENCONTRADO" -ForegroundColor Red
            }
        } else {
            Write-Host "    ⚠ dist/ (extraResources) NO ENCONTRADO" -ForegroundColor Yellow
            Write-Host "      (Esto es normal si solo se usa app.asar.unpacked)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ resources/ NO ENCONTRADO" -ForegroundColor Red
    }
    
    # Verificar ejecutable principal
    Write-Host "`nEjecutable principal:" -ForegroundColor Yellow
    if (Test-Path "$unpackedDir\Violet ERP.exe") {
        $exeSize = (Get-Item "$unpackedDir\Violet ERP.exe").Length / 1MB
        Write-Host "  ✓ Violet ERP.exe ($([math]::Round($exeSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Violet ERP.exe NO ENCONTRADO" -ForegroundColor Red
    }
    
} else {
    Write-Host "✗ Directorio unpacked NO encontrado" -ForegroundColor Red
    Write-Host "  Ejecuta primero: npm run electron:dist" -ForegroundColor Yellow
}

# Verificar instalador
Write-Host "`nInstalador:" -ForegroundColor Yellow
if (Test-Path "dist-electron\Violet ERP Setup 0.0.1.exe") {
    $setupSize = (Get-Item "dist-electron\Violet ERP Setup 0.0.1.exe").Length / 1MB
    Write-Host "  ✓ Violet ERP Setup 0.0.1.exe ($([math]::Round($setupSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Instalador NO encontrado" -ForegroundColor Red
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN COMPLETADA" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
