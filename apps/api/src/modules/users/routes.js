/**
 * Violet ERP - Rutas de Usuarios (Placeholder)
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/users - Listar usuarios
router.get('/', authorize('users:read'), (req, res) => {
  res.json({
    success: true,
    data: {
      users: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    },
  });
});

// GET /api/users/:id - Obtener usuario
router.get('/:id', authorize('users:read'), (req, res) => {
  res.json({
    success: true,
    data: { user: {} },
  });
});

// POST /api/users - Crear usuario
router.post('/', authorize('users:create'), (req, res) => {
  res.status(201).json({
    success: true,
    data: { user: {}, message: 'User created successfully' },
  });
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authorize('users:update'), (req, res) => {
  res.json({
    success: true,
    data: { user: {}, message: 'User updated successfully' },
  });
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', authorize('users:delete'), (req, res) => {
  res.json({
    success: true,
    data: { message: 'User deleted successfully' },
  });
});

export { router as userRoutes };
