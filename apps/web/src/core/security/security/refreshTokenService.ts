import { localDb } from "@/core/database/localDb";
import { generateRefreshToken } from './jwt';

export interface RefreshToken {
  id?: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

/**
 * Crea y almacena un refresh token.
 */
export async function createRefreshToken(
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateRefreshToken(userId);
  
  const refreshToken: RefreshToken = {
    userId,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    createdAt: new Date(),
    deviceInfo,
    ipAddress,
  };

  // Guardar en localStorage por ahora (en producción usar DB)
  const existingTokens = getStoredTokens();
  existingTokens.push(refreshToken);
  localStorage.setItem('refreshTokens', JSON.stringify(existingTokens));

  return token;
}

/**
 * Revoca un refresh token.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokens = getStoredTokens();
  const updated = tokens.map(t => 
    t.token === token ? { ...t, revokedAt: new Date() } : t
  );
  localStorage.setItem('refreshTokens', JSON.stringify(updated));
}

/**
 * Revoca todos los refresh tokens de un usuario.
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  const tokens = getStoredTokens();
  const updated = tokens.map(t => 
    t.userId === userId ? { ...t, revokedAt: new Date() } : t
  );
  localStorage.setItem('refreshTokens', JSON.stringify(updated));
}

/**
 * Verifica si un refresh token es válido.
 */
export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const tokens = getStoredTokens();
  const refreshToken = tokens.find(t => t.token === token);

  if (!refreshToken) {
    return false;
  }

  // Verificar si está revocado
  if (refreshToken.revokedAt) {
    return false;
  }

  // Verificar si expiró
  if (new Date(refreshToken.expiresAt) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Limpia tokens expirados (ejecutar periódicamente).
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const tokens = getStoredTokens();
  const now = new Date();
  
  const valid = tokens.filter(t => new Date(t.expiresAt) >= now);
  const expired = tokens.length - valid.length;
  
  localStorage.setItem('refreshTokens', JSON.stringify(valid));
  
  return expired;
}

/**
 * Helper para obtener tokens almacenados
 */
function getStoredTokens(): RefreshToken[] {
  const stored = localStorage.getItem('refreshTokens');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}
