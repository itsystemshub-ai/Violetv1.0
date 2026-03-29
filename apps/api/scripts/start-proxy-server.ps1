# Script para iniciar el servidor proxy de IA en Windows
# Se ejecuta automáticamente al iniciar la aplicación

$SERVER_PORT = 3001
$SERVER_DIR = Join-Path $PSScriptRoot "..\server"
$MAX_RETRIES = 3
$RETRY_DELAY = 2

Write-Host "🚀 Iniciando servidor proxy de IA...`n" -ForegroundColor Cyan

# Función para verificar si el servidor está corriendo
function Test-ServerRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$SERVER_PORT/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Función para iniciar el servidor
function Start-ProxyServer {
    param([int]$RetryCount = 0)

    # Verificar si ya está corriendo
    if (Test-ServerRunning) {
        Write-Host "✅ Servidor proxy ya está corriendo en puerto $SERVER_PORT" -ForegroundColor Green
        Write-Host "📡 Endpoint: http://localhost:$SERVER_PORT/api/groq/chat" -ForegroundColor White
        Write-Host "💚 Health Check: http://localhost:$SERVER_PORT/health`n" -ForegroundColor White
        return
    }

    if ($RetryCount -ge $MAX_RETRIES) {
        Write-Host "❌ No se pudo iniciar el servidor después de $MAX_RETRIES intentos" -ForegroundColor Red
        Write-Host "Por favor, inicia el servidor manualmente:" -ForegroundColor Yellow
        Write-Host "  cd server && npm start`n" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Intento $($RetryCount + 1)/$MAX_RETRIES..." -ForegroundColor Yellow

    # Iniciar el servidor en segundo plano
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm start
    } -ArgumentList $SERVER_DIR

    # Esperar un momento para que el servidor inicie
    Start-Sleep -Seconds 3

    # Verificar si inició correctamente
    if (Test-ServerRunning) {
        Write-Host "`n✅ Servidor proxy iniciado exitosamente" -ForegroundColor Green
        Write-Host "📡 Endpoint: http://localhost:$SERVER_PORT/api/groq/chat" -ForegroundColor White
        Write-Host "💚 Health Check: http://localhost:$SERVER_PORT/health`n" -ForegroundColor White
    }
    else {
        Write-Host "⚠️  Servidor no respondió, reintentando...`n" -ForegroundColor Yellow
        Start-Sleep -Seconds $RETRY_DELAY
        Start-ProxyServer -RetryCount ($RetryCount + 1)
    }
}

# Ejecutar
try {
    Start-ProxyServer
}
catch {
    Write-Host "❌ Error al iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
