/**
 * Violet ERP - Error Handler Middleware
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const error = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  };

  // Validation error
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    error.error.code = 'VALIDATION_ERROR';
    error.error.message = 'Validation failed';
    return res.status(400).json(error);
  }

  // Authentication error
  if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
    error.error.code = 'UNAUTHORIZED';
    error.error.message = 'Authentication required';
    return res.status(401).json(error);
  }

  // Forbidden error
  if (err.code === 'FORBIDDEN') {
    error.error.code = 'FORBIDDEN';
    error.error.message = 'Insufficient permissions';
    return res.status(403).json(error);
  }

  // Not found
  if (err.code === 'NOT_FOUND') {
    return res.status(404).json(error);
  }

  // Conflict
  if (err.code === 'CONFLICT') {
    error.error.code = 'CONFLICT';
    error.error.message = 'Resource already exists';
    return res.status(409).json(error);
  }

  // Internal server error
  return res.status(500).json(error);
};
