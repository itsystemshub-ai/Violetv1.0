/**
 * Users Routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { db } from '../database/init.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

// Get all users
usersRouter.get('/', authorize('users:read'), (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, name, role, tenant_id, department, 
           avatar_url, is_active, created_at
    FROM users
  `).all();

  res.json(users);
});

// Get user by ID
usersRouter.get('/:id', authorize('users:read'), (req, res) => {
  const user = db.prepare(`
    SELECT id, username, email, name, role, tenant_id, department, 
           avatar_url, is_active, created_at
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// Update user
usersRouter.put('/:id', authorize('users:update'), (req, res) => {
  const { id } = req.params;
  
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare(`
    UPDATE users SET
      name = ?, email = ?, role = ?, department = ?, 
      avatar_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    req.body.name, req.body.email, req.body.role,
    req.body.department, req.body.avatarUrl, id
  );

  const updated = db.prepare(`
    SELECT id, username, email, name, role, tenant_id, department, 
           avatar_url, is_active, created_at
    FROM users WHERE id = ?
  `).get(id);

  res.json(updated);
});

// Delete user (soft delete)
usersRouter.delete('/:id', authorize('users:delete'), (req, res) => {
  const { id } = req.params;
  
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
  res.json({ message: 'User deleted successfully' });
});
