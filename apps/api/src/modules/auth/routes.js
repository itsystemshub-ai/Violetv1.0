/**
 * Violet ERP - Rutas de Autenticación
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from './auth.controller.js';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Rutas protegidas
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.put('/password', authenticate, updatePassword);

export { router as authRoutes };
