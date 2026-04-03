/**
 * Violet ERP - SecurityService
 * Sistema avanzado de seguridad, autenticación y autorización RBAC
 */

import { firebirdPool } from '../database/firebird-pool.js';
import { createLogger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config/env.js';

const logger = createLogger('SecurityService');

export class SecurityService {
  /**
   * Generar token JWT
   */
  generateAccessToken(user, permissions = []) {
    const payload = {
      userId: user.codigo,
      email: user.correo_e,
      nombre: user.nombre,
      role: user.perfil_codigo,
      permissions: permissions.map(p => p.proceso_codigo),
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
  }

  /**
   * Generar refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user.codigo,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
      issuer: config.jwtIssuer,
    });
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'access' ? config.jwtSecret : config.jwtRefreshSecret;
      const decoded = jwt.verify(token, secret, {
        issuer: config.jwtIssuer,
        audience: type === 'access' ? config.jwtAudience : undefined,
      });

      return { valid: true, decoded };
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Hashear contraseña
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, config.bcryptRounds);
  }

  /**
   * Verificar contraseña
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Autenticar usuario
   */
  async authenticate(email, password) {
    try {
      // Buscar usuario
      const users = await firebirdPool.executeQuery(
        `SELECT u.*, p.nombre as perfil_nombre
         FROM usuarios u
         LEFT JOIN roles p ON u.perfil_codigo = p.codigo
         WHERE u.correo_e = ? AND u.activo = 'S'`,
        [email.toLowerCase()]
      );

      if (!users || users.length === 0) {
        logger.warn(`Login failed: User not found - ${email}`);
        return { success: false, error: 'Credenciales inválidas' };
      }

      const user = users[0];

      // Verificar si está bloqueado
      if (user.bloqueado === 'S') {
        logger.warn(`Login failed: User blocked - ${email}`);
        return { success: false, error: 'Usuario bloqueado' };
      }

      // Verificar contraseña
      const validPassword = await this.verifyPassword(password, user.clave);

      if (!validPassword) {
        logger.warn(`Login failed: Invalid password - ${email}`);
        return { success: false, error: 'Credenciales inválidas' };
      }

      // Obtener permisos
      const permissions = await this.getUserPermissions(user.perfil_codigo);

      // Generar tokens
      const accessToken = this.generateAccessToken(user, permissions);
      const refreshToken = this.generateRefreshToken(user);

      // Actualizar último login
      await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          ultimo_login = CURRENT_TIMESTAMP,
          ultimo_ip = ?,
          intentos_fallidos = 0
         WHERE codigo = ?`,
        [null, user.codigo]
      );

      logger.info(`User authenticated: ${user.codigo}`);

      return {
        success: true,
        user: {
          codigo: user.codigo,
          nombre: user.nombre,
          email: user.correo_e,
          role: user.perfil_codigo,
          roleName: user.perfil_nombre,
        },
        permissions: permissions.map(p => p.proceso_codigo),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwtExpiresIn,
        },
      };
    } catch (error) {
      logger.error('Authentication error:', error);
      return { success: false, error: 'Error de autenticación' };
    }
  }

  /**
   * Obtener permisos de un rol
   */
  async getUserPermissions(roleCode) {
    try {
      const permissions = await firebirdPool.executeQuery(
        `SELECT proceso_codigo, insertar, modificar, eliminar, consultar, procesar
         FROM permisos
         WHERE perfil_codigo = ?`,
        [roleCode]
      );

      return permissions || [];
    } catch (error) {
      logger.error('Error getting permissions:', error);
      return [];
    }
  }

  /**
   * Verificar permiso específico
   */
  async checkPermission(userId, processCode, action) {
    try {
      // Obtener rol del usuario
      const users = await firebirdPool.executeQuery(
        `SELECT perfil_codigo FROM usuarios WHERE codigo = ?`,
        [userId]
      );

      if (!users || users.length === 0) {
        return false;
      }

      const roleCode = users[0].PERFIL_CODIGO;

      // Verificar si es super admin
      if (roleCode === 'super_admin') {
        return true;
      }

      // Obtener permisos
      const permissions = await firebirdPool.executeQuery(
        `SELECT ${action} as permitido FROM permisos
         WHERE perfil_codigo = ? AND proceso_codigo = ?`,
        [roleCode, processCode]
      );

      if (!permissions || permissions.length === 0) {
        return false;
      }

      return permissions[0].PERMITIDO === 'S';
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Registrar intento de login fallido
   */
  async registerFailedLogin(email, ipAddress) {
    try {
      // Incrementar intentos fallidos
      const result = await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          intentos_fallidos = intentos_fallidos + 1,
          ultimo_ip = ?,
          ultimo_intento_fallido = CURRENT_TIMESTAMP
         WHERE correo_e = ?
         RETURNING intentos_fallidos`,
        [ipAddress, email.toLowerCase()]
      );

      const failedAttempts = result[0]?.INTENTOS_FALLIDOS || 1;

      // Bloquear si supera el límite
      if (failedAttempts >= 5) {
        await firebirdPool.executeQuery(
          `UPDATE usuarios SET bloqueado = 'S' WHERE correo_e = ?`,
          [email.toLowerCase()]
        );
        logger.warn(`User auto-blocked after ${failedAttempts} failed attempts: ${email}`);
      }

      return failedAttempts;
    } catch (error) {
      logger.error('Error registering failed login:', error);
      return 0;
    }
  }

  /**
   * Desbloquear usuario
   */
  async unlockUser(userId) {
    try {
      await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          bloqueado = 'N',
          intentos_fallidos = 0,
          ultimo_intento_fallido = NULL
         WHERE codigo = ?`,
        [userId]
      );

      logger.info(`User unlocked: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error unlocking user:', error);
      return false;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    const transaction = [];

    try {
      // Obtener contraseña actual
      const users = await firebirdPool.executeQuery(
        `SELECT clave FROM usuarios WHERE codigo = ?`,
        [userId]
      );

      if (!users || users.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const currentHash = users[0].CLAVE;

      // Verificar contraseña actual
      const validPassword = await this.verifyPassword(currentPassword, currentHash);

      if (!validPassword) {
        throw new Error('Contraseña actual inválida');
      }

      // Hashear nueva contraseña
      const newHash = await this.hashPassword(newPassword);

      // Actualizar contraseña
      await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          clave = ?,
          cambio_clave_en = CURRENT_TIMESTAMP,
          cambiar_clave = 'N'
         WHERE codigo = ?`,
        [newHash, userId]
      );

      logger.info(`Password changed for user: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resetear contraseña (admin)
   */
  async resetPassword(userId, newPassword, adminUserId) {
    try {
      const newHash = await this.hashPassword(newPassword);

      await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          clave = ?,
          cambiar_clave = 'S',
          reset_por_codigo = ?,
          reset_en = CURRENT_TIMESTAMP
         WHERE codigo = ?`,
        [newHash, adminUserId, userId]
      );

      logger.info(`Password reset for user: ${userId} by admin: ${adminUserId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar token de recuperación de contraseña
   */
  async generatePasswordResetToken(email) {
    try {
      const users = await firebirdPool.executeQuery(
        `SELECT codigo FROM usuarios WHERE correo_e = ?`,
        [email.toLowerCase()]
      );

      if (!users || users.length === 0) {
        // No revelar si el usuario existe
        return { success: true };
      }

      const userId = users[0].CODIGO;
      const token = jwt.sign(
        { userId, type: 'password_reset' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      await firebirdPool.executeQuery(
        `UPDATE usuarios SET
          reset_token = ?,
          reset_token_expira = DATEADD(1 HOUR TO CURRENT_TIMESTAMP)
         WHERE codigo = ?`,
        [token, userId]
      );

      logger.info(`Password reset token generated for: ${email}`);
      return { success: true, token };
    } catch (error) {
      logger.error('Error generating reset token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar sesión activa
   */
  async validateSession(userId, sessionId) {
    try {
      const sessions = await firebirdPool.executeQuery(
        `SELECT * FROM sesiones_usuario
         WHERE usuario_codigo = ? AND id = ? AND activa = 'S'
         AND vencimiento > CURRENT_TIMESTAMP`,
        [userId, sessionId]
      );

      return sessions && sessions.length > 0;
    } catch (error) {
      logger.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  async logoutAll(userId) {
    try {
      await firebirdPool.executeQuery(
        `UPDATE sesiones_usuario SET activa = 'N'
         WHERE usuario_codigo = ?`,
        [userId]
      );

      logger.info(`All sessions closed for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error logging out all sessions:', error);
      return false;
    }
  }

  /**
   * Obtener sesiones activas de usuario
   */
  async getActiveSessions(userId) {
    try {
      const sessions = await firebirdPool.executeQuery(
        `SELECT id, estacion, ip_address, inicio, vencimiento
         FROM sesiones_usuario
         WHERE usuario_codigo = ? AND activa = 'S'
         AND vencimiento > CURRENT_TIMESTAMP
         ORDER BY inicio DESC`,
        [userId]
      );

      return sessions || [];
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Registrar actividad de seguridad
   */
  async logSecurityEvent(userId, eventType, details, ipAddress) {
    try {
      await firebirdPool.executeQuery(
        `INSERT INTO seguridad_log (
          id, usuario_codigo, evento, detalles, ip_address,
          creado_en
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          `${Date.now()}-${userId}`,
          userId,
          eventType,
          JSON.stringify(details),
          ipAddress,
        ]
      );
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  /**
   * Obtener estadísticas de seguridad
   */
  async getSecurityStats(dateFrom, dateTo) {
    try {
      const [
        totalLogins,
        failedLogins,
        blockedUsers,
        activeUsers,
      ] = await Promise.all([
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM seguridad_log
           WHERE evento = 'LOGIN_SUCCESS'
           AND creado_en BETWEEN ? AND ?`,
          [dateFrom, dateTo]
        ),
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM seguridad_log
           WHERE evento = 'LOGIN_FAILED'
           AND creado_en BETWEEN ? AND ?`,
          [dateFrom, dateTo]
        ),
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM usuarios WHERE bloqueado = 'S'`
        ),
        firebirdPool.executeQuery(
          `SELECT COUNT(*) as total FROM usuarios WHERE activo = 'S'`
        ),
      ]);

      return {
        periodo: { dateFrom, dateTo },
        loginsExitosos: totalLogins[0]?.TOTAL || 0,
        loginsFallidos: failedLogins[0]?.TOTAL || 0,
        usuariosBloqueados: blockedUsers[0]?.TOTAL || 0,
        usuariosActivos: activeUsers[0]?.TOTAL || 0,
      };
    } catch (error) {
      logger.error('Error getting security stats:', error);
      return null;
    }
  }
}

export const securityService = new SecurityService();
export default securityService;
