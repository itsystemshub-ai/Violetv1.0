/**
 * Authentication Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { config } from '../config/env.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  tenantId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// Login
authRouter.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password, tenantId } = loginSchema.parse(req.body);

    // Find user
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ? AND is_active = 1
    `).get(username) as any;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        tenantId: tenantId || user.tenant_id,
        permissions: JSON.parse(user.permissions),
        isSuperAdmin: user.is_super_admin === 1,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Store refresh token
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(tokenId, user.id, refreshToken, expiresAt);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenantId || user.tenant_id,
        department: user.department,
        avatarUrl: user.avatar_url,
        is2FAEnabled: user.is_2fa_enabled === 1,
        permissions: JSON.parse(user.permissions),
        isSuperAdmin: user.is_super_admin === 1,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
});

// Refresh token
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    // Check if token exists in database
    const storedToken = db.prepare(`
      SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?
    `).get(refreshToken, decoded.userId) as any;

    if (!storedToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      });
    }

    // Get user
    const user = db.prepare(`
      SELECT * FROM users WHERE id = ? AND is_active = 1
    `).get(decoded.userId) as any;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        tenantId: user.tenant_id,
        permissions: JSON.parse(user.permissions),
        isSuperAdmin: user.is_super_admin === 1,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token expired',
      });
    }

    console.error('Refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed',
    });
  }
});

// Logout
authRouter.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Delete refresh token
      db.prepare(`
        DELETE FROM refresh_tokens WHERE token = ?
      `).run(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed',
    });
  }
});

// Get current user
authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, name, role, tenant_id, department, 
             avatar_url, is_2fa_enabled, permissions, is_super_admin
      FROM users WHERE id = ?
    `).get(req.user!.id) as any;

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      department: user.department,
      avatarUrl: user.avatar_url,
      is2FAEnabled: user.is_2fa_enabled === 1,
      permissions: JSON.parse(user.permissions),
      isSuperAdmin: user.is_super_admin === 1,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user',
    });
  }
});
