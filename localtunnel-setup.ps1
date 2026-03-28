# localtunnel-setup.ps1
# Script para exponer el ERP localmente para pruebas de n8n
# Uso: .\localtunnel-setup.ps1 -port 5173

param (
    [int]$port = 5173
)

Write-Host "--- Violet ERP - LocalTunnel Setup ---" -ForegroundColor Cyan
Write-Host "Verificando instalación de localtunnel..."

if (!(Get-Command lt -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando localtunnel via npm..." -ForegroundColor Yellow
    npm install -g localtunnel
}

Write-Host "Iniciando túnel en el puerto $port..." -ForegroundColor Green
Write-Host "Copia la URL generada y pégala en tu configuración de n8n o en el archivo .env" -ForegroundColor Gray
Write-Host "Presiona Ctrl+C para detener el túnel."

lt --port $port
