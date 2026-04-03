/**
 * Authentication Routes - Con SQLite y Username
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { firebirdPool } from '../../database/firebird-pool.js';
import { config } from '../../config/env.js';
import { authLimiter } from '../../middleware/rateLimit.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Iniciar sesión con USERNAME
 */
authRouter.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Username y contraseña requeridos',
      });
    }

    // Buscar usuario por USERNAME (no por correo)
    const users = await firebirdPool.executeQuery(
      `SELECT u.*, r.nombre as rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.perfil_codigo = r.codigo
       WHERE (u.codigo = ? OR u.username = ?) AND u.activo = 'S'`,
      [username.toUpperCase(), username.toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Credenciales inváldas',
      });
    }

    const user = users[0];

    if (user.bloqueado === 'S') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Usuario bloqueado',
      });
    }

    const validPassword = await bcrypt.compare(password, user.clave);

    if (!validPassword) {
      await firebirdPool.executeQuery(
        `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE codigo = ?`,
        [user.codigo]
      );

      if (user.intentos_fallidos + 1 >= 5) {
        await firebirdPool.executeQuery(
          `UPDATE usuarios SET bloqueado = 'S' WHERE codigo = ?`,
          [user.codigo]
        );
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Usuario bloqueado por múltiples intentos fallidos',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Credenciales inváldas',
      });
    }

    // Obtener permisos
    const permissions = await firebirdPool.executeQuery(
      `SELECT proceso_codigo, insertar, modificar, eliminar, consultar, procesar
       FROM permisos WHERE perfil_codigo = ?`,
      [user.perfil_codigo]
    );

    // Resetear intentos y actualizar login
    await firebirdPool.executeQuery(
      `UPDATE usuarios SET intentos_fallidos = 0, ultimo_login = CURRENT_TIMESTAMP WHERE codigo = ?`,
      [user.codigo]
    );

    // Generar tokens
    const accessToken = jwt.sign(
      {
        userId: user.codigo,
        username: user.username || user.codigo,
        nombre: user.nombre,
        role: user.perfil_codigo,
        permissions: (permissions || []).map(p => p.proceso_codigo),
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.codigo },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Registrar sesión
    const sessionId = `${Date.now()}-${user.codigo}`;
    await firebirdPool.executeQuery(
      `INSERT INTO sesiones_usuario (id, usuario_codigo, token, activa, inicio, vencimiento)
       VALUES (?, ?, ?, 'S', CURRENT_TIMESTAMP, datetime('now', '+24 hours'))`,
      [sessionId, user.codigo, refreshToken]
    );

    res.json({
      success: true,
      data: {
        user: {
          codigo: user.codigo,
          username: user.username || user.codigo,
          nombre: user.nombre,
          role: user.perfil_codigo,
          roleName: user.rol_nombre,
        },
        permissions: (permissions || []).map(p => ({
          proceso: p.proceso_codigo,
          insertar: p.insertar === 'S',
          modificar: p.modificar === 'S',
          eliminar: p.eliminar === 'S',
          consultar: p.consultar === 'S',
          procesar: p.procesar === 'S',
        })),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: config.jwt.expiresIn,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 * Registrar usuario con USERNAME
 */
authRouter.post('/register', async (req, res) => {
  try {
    const { username, nombre, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y contraseña requeridos',
      });
    }

    // Verificar si existe username
    const existing = await firebirdPool.executeQuery(
      `SELECT codigo FROM usuarios WHERE username = ? OR codigo = ?`,
      [username.toLowerCase(), username.toUpperCase()]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El username ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
    const codigo = `USER-${Date.now()}`;

    await firebirdPool.executeQuery(
      `INSERT INTO usuarios (codigo, username, nombre, clave, perfil_codigo, activo, creado_en)
       VALUES (?, ?, ?, ?, ?, 'S', CURRENT_TIMESTAMP)`,
      [codigo, username.toLowerCase(), nombre || username, hashedPassword, 'user']
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { codigo, username, nombre: nombre || username },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        await firebirdPool.executeQuery(
          `UPDATE sesiones_usuario SET activa = 'N' WHERE usuario_codigo = ?`,
          [decoded.userId]
        );
      } catch (e) {
        // Token inválido
      }
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const users = await firebirdPool.executeQuery(
      `SELECT u.*, r.nombre as rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.perfil_codigo = r.codigo
       WHERE u.codigo = ?`,
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const user = users[0];
    const permissions = await firebirdPool.executeQuery(
      `SELECT proceso_codigo, insertar, modificar, eliminar, consultar, procesar
       FROM permisos WHERE perfil_codigo = ?`,
      [user.perfil_codigo]
    );

    res.json({
      success: true,
      data: {
        user: {
          codigo: user.codigo,
          username: user.username || user.codigo,
          nombre: user.nombre,
          role: user.perfil_codigo,
          roleName: user.rol_nombre,
          activo: user.activo,
        },
        permissions: (permissions || []).map(p => ({
          proceso: p.proceso_codigo,
          insertar: p.insertar === 'S',
          modificar: p.modificar === 'S',
          eliminar: p.eliminar === 'S',
          consultar: p.consultar === 'S',
          procesar: p.procesar === 'S',
        })),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 */
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido',
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    const sessions = await firebirdPool.executeQuery(
      `SELECT * FROM sesiones_usuario WHERE usuario_codigo = ? AND token = ? AND activa = 'S'`,
      [decoded.userId, refreshToken]
    );

    if (!sessions || sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada o inválida',
      });
    }

    const users = await firebirdPool.executeQuery(
      `SELECT u.*, r.nombre as rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.perfil_codigo = r.codigo
       WHERE u.codigo = ?`,
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const user = users[0];
    const permissions = await firebirdPool.executeQuery(
      `SELECT proceso_codigo FROM permisos WHERE perfil_codigo = ?`,
      [user.perfil_codigo]
    );

    const accessToken = jwt.sign(
      {
        userId: user.codigo,
        username: user.username || user.codigo,
        nombre: user.nombre,
        role: user.perfil_codigo,
        permissions: (permissions || []).map(p => p.proceso_codigo),
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: config.jwt.expiresIn,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido o expirado',
    });
  }
});

export default authRouter;
