/**
 * Violet ERP - AuthService
 * Autenticación y autorización con Firebird
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { firebirdPool } from '../database/firebird-pool.js';
import { config } from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AuthService');

export class AuthService {
  /**
   * Iniciar sesión
   */
  async login(email, password) {
    try {
      logger.info(`Login attempt for: ${email}`);

      // Buscar usuario
      const user = await firebirdPool.executeQuery(
        `SELECT u.*, r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.email = ? AND u.is_active = 1`,
        [email]
      );

      if (!user || user.length === 0) {
        logger.warn(`Login failed - User not found: ${email}`);
        throw new Error('Invalid credentials');
      }

      const userData = user[0];

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, userData.password_hash);

      if (!isValid) {
        logger.warn(`Login failed - Invalid password for: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Obtener permisos
      const permissions = await firebirdPool.executeQuery(
        `SELECT p.name
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [userData.role_id]
      );

      // Generar tokens
      const accessToken = this.generateAccessToken(userData, permissions);
      const refreshToken = this.generateRefreshToken(userData);

      // Guardar sesión
      await this.saveSession(userData.id, accessToken, refreshToken);

      // Actualizar último login
      await firebirdPool.executeQuery(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
        [userData.id]
      );

      logger.info(`Login successful: ${email}`);

      return {
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          avatar: userData.avatar,
          role: userData.role_name,
          isEmailVerified: userData.is_email_verified === 'S',
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwtExpiresIn,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Registrar usuario
   */
  async register(data) {
    const transaction = [
      {
        sql: `SELECT id FROM users WHERE email = ?`,
        params: [data.email],
      },
    ];

    // Verificar si el email ya existe
    const existing = await firebirdPool.executeQuery(
      `SELECT id FROM users WHERE email = ?`,
      [data.email]
    );

    if (existing && existing.length > 0) {
      throw new Error('Email already registered');
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
    const userId = uuidv4();

    // Crear usuario
    await firebirdPool.executeQuery(
      `INSERT INTO users (
        id, email, username, password_hash, first_name, last_name,
        role_id, is_active, is_email_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'N', CURRENT_TIMESTAMP)`,
      [
        userId,
        data.email,
        data.username,
        passwordHash,
        data.firstName,
        data.lastName,
      ]
    );

    logger.info(`User registered: ${userId}`);

    return { id: userId, email: data.email };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

      // Verificar sesión
      const session = await firebirdPool.executeQuery(
        `SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP`,
        [refreshToken]
      );

      if (!session || session.length === 0) {
        throw new Error('Invalid refresh token');
      }

      // Obtener usuario
      const user = await firebirdPool.executeQuery(
        `SELECT * FROM users WHERE id = ? AND is_active = 1`,
        [decoded.id]
      );

      if (!user || user.length === 0) {
        throw new Error('User not found');
      }

      const userData = user[0];

      // Obtener permisos
      const permissions = await firebirdPool.executeQuery(
        `SELECT p.name
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [userData.role_id]
      );

      // Generar nuevo access token
      const accessToken = this.generateAccessToken(userData, permissions);

      // Actualizar sesión
      await firebirdPool.executeQuery(
        `UPDATE sessions SET token = ? WHERE refresh_token = ?`,
        [accessToken, refreshToken]
      );

      return { accessToken, expiresIn: config.jwtExpiresIn };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(token) {
    await firebirdPool.executeQuery(
      `DELETE FROM sessions WHERE token = ?`,
      [token]
    );

    logger.info('Logout successful');
  }

  /**
   * Generar access token
   */
  generateAccessToken(user, permissions) {
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

  /**
   * Generar refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    });
  }

  /**
   * Guardar sesión
   */
  async saveSession(userId, token, refreshToken) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await firebirdPool.executeQuery(
      `INSERT INTO sessions (
        id, user_id, token, refresh_token, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [sessionId, userId, token, refreshToken, expiresAt]
    );
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(userId) {
    const user = await firebirdPool.executeQuery(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    const userData = user[0];

    const permissions = await firebirdPool.executeQuery(
      `SELECT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [userData.role_id]
    );

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatar: userData.avatar,
      phone: userData.phone,
      department: userData.department,
      position: userData.position,
      role: userData.role_name,
      isEmailVerified: userData.is_email_verified === 'S',
      lastLogin: userData.last_login,
      permissions: permissions.map((p) => p.name),
    };
  }
}

export const authService = new AuthService();
export default authService;
