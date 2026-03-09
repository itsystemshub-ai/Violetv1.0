const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let proxyProcess = null;

/**
 * Inicia el servidor proxy de Groq
 */
function startProxyServer() {
  try {
    const proxyPath = path.join(__dirname, '../server/groq-proxy.cjs');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(proxyPath)) {
      console.error('[Proxy] No se encontró groq-proxy.cjs en:', proxyPath);
      return false;
    }

    console.log('[Proxy] Iniciando servidor proxy de IA...');
    
    // Iniciar el proceso de Node.js
    proxyProcess = spawn('node', [proxyPath], {
      cwd: path.join(__dirname, '../server'),
      stdio: 'pipe',
      detached: false
    });

    // Capturar salida estándar
    proxyProcess.stdout.on('data', (data) => {
      console.log(`[Proxy] ${data.toString().trim()}`);
    });

    // Capturar errores
    proxyProcess.stderr.on('data', (data) => {
      console.error(`[Proxy Error] ${data.toString().trim()}`);
    });

    // Manejar cierre del proceso
    proxyProcess.on('close', (code) => {
      console.log(`[Proxy] Proceso terminado con código ${code}`);
      proxyProcess = null;
    });

    // Manejar errores del proceso
    proxyProcess.on('error', (err) => {
      console.error('[Proxy] Error al iniciar:', err);
      proxyProcess = null;
    });

    console.log('[Proxy] Servidor proxy iniciado correctamente');
    return true;
  } catch (error) {
    console.error('[Proxy] Error al iniciar servidor proxy:', error);
    return false;
  }
}

/**
 * Detiene el servidor proxy
 */
function stopProxyServer() {
  if (proxyProcess) {
    console.log('[Proxy] Deteniendo servidor proxy...');
    proxyProcess.kill();
    proxyProcess = null;
  }
}

module.exports = {
  startProxyServer,
  stopProxyServer
};
