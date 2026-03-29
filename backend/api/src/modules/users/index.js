/**
 * Users Routes - Simplified
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

// Get all users
usersRouter.get('/', authorize('users:read'), (req, res) => {
  res.json({
    success: true,
    data: {
      users: [
        { id: '1', email: 'admin@violet-erp.com', username: 'admin', role: 'super_admin' },
        { id: '2', email: 'user@violet-erp.com', username: 'user', role: 'user' },
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
      },
    },
  });
});

// Get user by ID
usersRouter.get('/:id', authorize('users:read'), (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.params.id,
        email: 'admin@violet-erp.com',
        username: 'admin',
        role: 'super_admin',
      },
    },
  });
});

// Create user
usersRouter.post('/', authorize('users:create'), (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: '3',
        ...req.body,
      },
    },
    message: 'User created successfully',
  });
});

// Update user
usersRouter.put('/:id', authorize('users:update'), (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.params.id,
        ...req.body,
      },
    },
    message: 'User updated successfully',
  });
});

// Delete user
usersRouter.delete('/:id', authorize('users:delete'), (req, res) => {
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

export default usersRouter;
