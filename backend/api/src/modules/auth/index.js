/**
 * Authentication Routes - Simplified
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { authLimiter } from '../../middleware/rateLimit.js';

export const authRouter = Router();

// Login
authRouter.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // Demo authentication (replace with Firebird query)
    if (email === 'admin@violet-erp.com' && password === 'admin123') {
      const user = {
        id: '1',
        email,
        username: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        permissions: ['*'],
      };

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, permissions: user.permissions },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: config.jwtExpiresIn,
          },
        },
      });
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// Register (demo)
authRouter.post('/register', async (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Registration not implemented yet',
  });
});

// Logout
authRouter.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Get current user
authRouter.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user || null,
    },
  });
});

export default authRouter;
