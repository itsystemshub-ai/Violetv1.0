/**
 * Configuración del servidor
 */
module.exports = {
  port: process.env.PORT || 3000,
  proxyPort: process.env.PROXY_PORT || 3001,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  },
  json: {
    limit: '10mb'
  }
};
