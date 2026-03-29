/**
 * Violet ERP - Middleware de Manejo de Errores
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const error = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || undefined,
    },
  };

  // Error de validación
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    error.error.code = 'VALIDATION_ERROR';
    error.error.message = 'Validation failed';
    return res.status(400).json(error);
  }

  // Error de autenticación
  if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
    error.error.code = 'UNAUTHORIZED';
    error.error.message = 'Authentication required';
    return res.status(401).json(error);
  }

  // Error de permisos
  if (err.code === 'FORBIDDEN') {
    error.error.code = 'FORBIDDEN';
    error.error.message = 'Insufficient permissions';
    return res.status(403).json(error);
  }

  // Error de no encontrado
  if (err.code === 'NOT_FOUND') {
    return res.status(404).json(error);
  }

  // Error de conflicto
  if (err.code === 'CONFLICT') {
    error.error.code = 'CONFLICT';
    error.error.message = 'Resource already exists';
    return res.status(409).json(error);
  }

  // Error interno del servidor
  return res.status(500).json(error);
};
