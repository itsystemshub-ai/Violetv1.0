/**
 * Violet ERP - Autenticación Middleware
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
};

// Alias para authenticate
export const requireAuth = authenticate;

export const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (req.user.role === 'super_admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const AuthRequest = {};
