const express = require('express');
const corsMiddleware = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/api.routes');
const { json: jsonConfig } = require('./config/server');

/**
 * Aplicación Express principal
 */
function createApp() {
  const app = express();

  // Middlewares
  app.use(corsMiddleware);
  app.use(express.json(jsonConfig));

  // Rutas
  app.use('/api', apiRoutes);

  // Manejo de errores
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
