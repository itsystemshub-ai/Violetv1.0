#!/usr/bin/env node

/**
 * Script para iniciar el servidor proxy de IA automáticamente
 * Se ejecuta al iniciar la aplicación en modo desarrollo
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_PORT = 3001;
const SERVER_DIR = path.join(__dirname, '..', 'server');
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

console.log('🚀 Iniciando servidor proxy de IA...\n');

// Función para verificar si el servidor está corriendo
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Función para iniciar el servidor
async function startServer(retryCount = 0) {
  // Verificar si ya está corriendo
  const isRunning = await checkServer();
  
  if (isRunning) {
    console.log('✅ Servidor proxy ya está corriendo en puerto', SERVER_PORT);
    console.log('📡 Endpoint: http://localhost:' + SERVER_PORT + '/api/groq/chat');
    console.log('💚 Health Check: http://localhost:' + SERVER_PORT + '/health\n');
    return;
  }

  if (retryCount >= MAX_RETRIES) {
    console.error('❌ No se pudo iniciar el servidor después de', MAX_RETRIES, 'intentos');
    console.error('Por favor, inicia el servidor manualmente:');
    console.error('  cd server && npm start\n');
    process.exit(1);
  }

  console.log(`Intento ${retryCount + 1}/${MAX_RETRIES}...`);

  // Iniciar el servidor
  const serverProcess = spawn('npm', ['start'], {
    cwd: SERVER_DIR,
    stdio: 'inherit',
    shell: true,
    detached: true,
  });

  serverProcess.unref();

  // Esperar un momento para que el servidor inicie
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verificar si inició correctamente
  const started = await checkServer();

  if (started) {
    console.log('\n✅ Servidor proxy iniciado exitosamente');
    console.log('📡 Endpoint: http://localhost:' + SERVER_PORT + '/api/groq/chat');
    console.log('💚 Health Check: http://localhost:' + SERVER_PORT + '/health\n');
  } else {
    console.log('⚠️  Servidor no respondió, reintentando...\n');
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    await startServer(retryCount + 1);
  }
}

// Ejecutar
startServer().catch((error) => {
  console.error('❌ Error al iniciar servidor:', error.message);
  process.exit(1);
});
