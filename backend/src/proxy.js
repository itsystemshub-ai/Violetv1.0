const express = require('express');
const corsMiddleware = require('./middlewares/cors');
const groqRoutes = require('./routes/groq.routes');
const { proxyPort } = require('./config/server');

/**
 * Servidor proxy de Groq
 */
function startProxyServer() {
  const app = express();

  // Middlewares
  app.use(corsMiddleware);
  app.use(express.json());

  // Rutas
  app.use('/api/groq', groqRoutes);

  // Iniciar servidor
  app.listen(proxyPort, () => {
    console.log(`🚀 Groq Proxy Server running on http://localhost:${proxyPort}`);
    console.log(`📡 Endpoint: http://localhost:${proxyPort}/api/groq/chat`);
  });
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startProxyServer();
}

module.exports = { startProxyServer };
