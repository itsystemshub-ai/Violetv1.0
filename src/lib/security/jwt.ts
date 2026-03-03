import jwt from 'jsonwebtoken';

// Obtener secret desde variables de entorno
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 horas
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 días

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  tenantId: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
  exp?: number;
}

/**
 * Genera un token JWT de acceso.
 * 
 * @param payload - Datos del usuario
 * @returns Token JWT
 * 
 * @example
 * ```typescript
 * const token = generateAccessToken({
 *   userId: user.id,
 *   username: user.username,
 *   email: user.email,
 *   tenantId: user.tenantId,
 *   role: user.role,
 *   isSuperAdmin: user.isSuperAdmin,
 *   permissions: user.permissions,
 * });
 * ```
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'violet-erp',
    audience: 'violet-erp-users',
  });
}

/**
 * Genera un refresh token.
 * 
 * @param userId - ID del usuario
 * @returns Refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'violet-erp',
      audience: 'violet-erp-users',
    }
  );
}

/**
 * Verifica y decodifica un token JWT.
 * 
 * @param token - Token a verificar
 * @returns Payload decodificado o null si es inválido
 * 
 * @example
 * ```typescript
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log('Usuario:', payload.username);
 * } else {
 *   console.log('Token inválido o expirado');
 * }
 * ```
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'violet-erp',
      audience: 'violet-erp-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Token inválido');
    }
    return null;
  }
}

/**
 * Verifica un refresh token.
 * 
 * @param token - Refresh token
 * @returns userId si es válido, null si no
 */
export function verifyRefreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'violet-erp',
      audience: 'violet-erp-users',
    }) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Decodifica un token sin verificar (útil para debugging).
 * 
 * @param token - Token a decodificar
 * @returns Payload decodificado
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el tiempo restante de un token en segundos.
 * 
 * @param token - Token a verificar
 * @returns Segundos restantes o 0 si expiró
 */
export function getTokenExpirationTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;

  return remaining > 0 ? remaining : 0;
}

/**
 * Verifica si un token está próximo a expirar.
 * 
 * @param token - Token a verificar
 * @param thresholdMinutes - Minutos de umbral (default: 5)
 * @returns true si expira pronto
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMinutes: number = 5
): boolean {
  const remaining = getTokenExpirationTime(token);
  return remaining > 0 && remaining < thresholdMinutes * 60;
}
