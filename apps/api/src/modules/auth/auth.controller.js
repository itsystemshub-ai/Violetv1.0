/**
 * Violet ERP - Controlador de Autenticación
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '@violet-erp/database';
import { config } from '../../config/index.js';
import { generateAuditLog } from '../../utils/audit.js';

/**
 * Iniciar sesión
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
    }

    // Buscar usuario
    const user = db.queryOne(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Obtener permisos del usuario
    const permissions = db.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    // Generar tokens
    const accessToken = generateAccessToken(user, permissions);
    const refreshToken = generateRefreshToken(user);

    // Guardar sesión
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    db.mutate(
      `INSERT INTO sessions (id, user_id, token, refresh_token, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, accessToken, refreshToken, expiresAt, req.ip, req.headers['user-agent']]
    );

    // Actualizar último login
    db.mutate('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Audit log
    generateAuditLog({
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          role: user.role_name,
          isEmailVerified: user.is_email_verified,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwtExpiresIn,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar usuario
 */
export const register = async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validar entrada
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      });
    }

    // Verificar si el email ya existe
    const existingUser = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email already registered',
        },
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Crear usuario
    const userId = crypto.randomUUID();
    const defaultRoleId = 'user';

    db.mutate(
      `INSERT INTO users (id, email, username, password_hash, first_name, last_name, role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, username, passwordHash, firstName, lastName, defaultRoleId]
    );

    // Audit log
    generateAuditLog({
      userId,
      action: 'REGISTER',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          username,
          firstName,
          lastName,
          role: defaultRoleId,
        },
        message: 'Registration successful. Please verify your email.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cerrar sesión
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      db.mutate('DELETE FROM sessions WHERE token = ?', [token]);
    }

    generateAuditLog({
      userId: req.user.id,
      action: 'LOGOUT',
      resource: 'auth',
    });

    res.json({
      success: true,
      data: { message: 'Logout successful' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

    // Verificar sesión en BD
    const session = db.queryOne(
      'SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Obtener usuario y permisos
    const user = db.queryOne('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const permissions = db.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    // Generar nuevo access token
    const accessToken = generateAccessToken(user, permissions);

    // Actualizar sesión
    db.mutate('UPDATE sessions SET token = ? WHERE refresh_token = ?', [accessToken, refreshToken]);

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: config.jwtExpiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = db.queryOne(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const permissions = db.query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        phone: user.phone,
        department: user.department,
        position: user.position,
        role: user.role_name,
        isEmailVerified: user.is_email_verified,
        lastLogin: user.last_login,
        permissions: permissions.map((p) => p.name),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar contraseña
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current and new password are required',
        },
      });
    }

    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
        },
      });
    }

    // Actualizar contraseña
    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    db.mutate('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      passwordHash,
      req.user.id,
    ]);

    generateAuditLog({
      userId: req.user.id,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
    });

    res.json({
      success: true,
      data: { message: 'Password updated successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password (placeholder)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Implementar envío de email de recuperación
    res.json({
      success: true,
      data: { message: 'If the email exists, a reset link has been sent' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password (placeholder)
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Implementar reset con token
    res.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email (placeholder)
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Implementar verificación de email
    res.json({
      success: true,
      data: { message: 'Email verified successfully' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email (placeholder)
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Implementar reenvío de email de verificación
    res.json({
      success: true,
      data: { message: 'Verification email sent' },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Funciones Helper
// ============================================================================

function generateAccessToken(user, permissions) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role_name,
      permissions: permissions.map((p) => p.name),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
}
