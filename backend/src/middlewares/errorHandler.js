/**
 * Middleware de manejo de errores
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
