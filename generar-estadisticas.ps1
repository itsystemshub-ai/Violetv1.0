# Script para generar estadísticas del proyecto
Write-Host "Generando estadísticas del proyecto..." -ForegroundColor Cyan
Write-Host ""

$output = @"
ESTADÍSTICAS DEL PROYECTO - VIOLET ERP
========================================

Generado: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

RESUMEN GENERAL:
================

"@

# Total de archivos
Write-Host "Contando todos los archivos..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue
$totalFiles = $allFiles.Count
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum / 1MB

$output += "Total de archivos: $totalFiles`n"
$output += "Tamaño total: $([math]::Round($totalSize, 2)) MB`n`n"

Write-Host "Total: $totalFiles archivos ($([math]::Round($totalSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Estadísticas por carpeta principal
$output += "ESTADÍSTICAS POR CARPETA PRINCIPAL:`n"
$output += "====================================`n`n"

Write-Host "Analizando carpetas principales..." -ForegroundColor Yellow

$folders = @(
    "src",
    "backend",
    "electron",
    "dist",
    "dist-electron",
    "node_modules",
    "public",
    "scripts",
    "coverage",
    ".github",
    "bcv-exchange-rates",
    "database",
    "server",
    "supabase",
    "examples"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "  Analizando $folder..." -ForegroundColor Gray
        $folderFiles = Get-ChildItem -Path $folder -Recurse -File -ErrorAction SilentlyContinue
        $count = $folderFiles.Count
        $size = ($folderFiles | Measure-Object -Property Length -Sum).Sum / 1MB
        $output += "$folder/`n"
        $output += "  Archivos: $count`n"
        $output += "  Tamaño: $([math]::Round($size, 2)) MB`n`n"
    }
}

Write-Host ""
Write-Host "Analizando extensiones de archivo..." -ForegroundColor Yellow

# Archivos por extensión
$output += "`nARCHIVOS POR EXTENSIÓN (Top 30):`n"
$output += "==================================`n`n"

$extensions = $allFiles | Group-Object Extension | Sort-Object Count -Descending | Select-Object -First 30
foreach ($ext in $extensions) {
    $extName = if ($ext.Name) { $ext.Name } else { "(sin extensión)" }
    $extSize = ($ext.Group | Measure-Object -Property Length -Sum).Sum / 1MB
    $output += "$extName`n"
    $output += "  Cantidad: $($ext.Count)`n"
    $output += "  Tamaño: $([math]::Round($extSize, 2)) MB`n`n"
}

Write-Host ""
Write-Host "Identificando archivos más grandes..." -ForegroundColor Yellow

# Archivos más grandes
$output += "`nARCHIVOS MÁS GRANDES (Top 30):`n"
$output += "================================`n`n"

$largestFiles = $allFiles | Sort-Object Length -Descending | Select-Object -First 30
foreach ($file in $largestFiles) {
    $size = $file.Length / 1MB
    $relativePath = $file.FullName.Replace($PWD.Path + '\', '')
    $output += "$relativePath`n"
    $output += "  Tamaño: $([math]::Round($size, 2)) MB`n`n"
}

# Estadísticas de código fuente
$output += "`nESTADÍSTICAS DE CÓDIGO FUENTE:`n"
$output += "================================`n`n"

$codeExtensions = @('.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs')
$codeFiles = $allFiles | Where-Object { $codeExtensions -contains $_.Extension }
$codeCount = $codeFiles.Count
$codeSize = ($codeFiles | Measure-Object -Property Length -Sum).Sum / 1MB

$output += "Archivos de código: $codeCount`n"
$output += "Tamaño de código: $([math]::Round($codeSize, 2)) MB`n`n"

foreach ($ext in $codeExtensions) {
    $extFiles = $codeFiles | Where-Object { $_.Extension -eq $ext }
    if ($extFiles) {
        $count = $extFiles.Count
        $size = ($extFiles | Measure-Object -Property Length -Sum).Sum / 1MB
        $output += "$ext : $count archivos ($([math]::Round($size, 2)) MB)`n"
    }
}

# Guardar en archivo
$output | Out-File -FilePath "ESTADISTICAS_PROYECTO.txt" -Encoding UTF8

Write-Host ""
Write-Host "Estadísticas generadas exitosamente!" -ForegroundColor Green
Write-Host "Archivo: ESTADISTICAS_PROYECTO.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen:" -ForegroundColor Yellow
Write-Host "  Total de archivos: $totalFiles" -ForegroundColor White
Write-Host "  Tamaño total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor White
Write-Host "  Archivos de código: $codeCount" -ForegroundColor White
Write-Host "  Tamaño de código: $([math]::Round($codeSize, 2)) MB" -ForegroundColor White
