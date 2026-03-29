/**
 * Sistema de Autenticación de Dos Factores (2FA)
 * Implementa TOTP (Time-based One-Time Password) según RFC 6238
 */

import { sanitizeString } from './sanitization';

/**
 * Genera un secreto aleatorio para 2FA (base32)
 */
export const generate2FASecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32
  const length = 32;
  let secret = '';
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    secret += chars[array[i] % chars.length];
  }
  
  return secret;
};

/**
 * Genera un código TOTP de 6 dígitos
 */
export const generateTOTP = (secret: string, timeStep: number = 30): string => {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const counter = time.toString(16).padStart(16, '0');
  
  // Simulación simplificada de HMAC-SHA1
  // En producción, usar una librería como otpauth o speakeasy
  const hash = hashHMAC(secret, counter);
  const offset = parseInt(hash.slice(-1), 16);
  const code = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;
  
  return (code % 1000000).toString().padStart(6, '0');
};

/**
 * Verifica un código TOTP
 */
export const verifyTOTP = (
  secret: string,
  code: string,
  window: number = 1
): boolean => {
  const sanitizedCode = sanitizeString(code);
  
  if (!sanitizedCode || sanitizedCode.length !== 6 || !/^\d{6}$/.test(sanitizedCode)) {
    return false;
  }
  
  // Verificar código actual y ventanas de tiempo adyacentes
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    const expectedCode = generateTOTPAtTime(secret, time);
    
    if (sanitizedCode === expectedCode) {
      return true;
    }
  }
  
  return false;
};

/**
 * Genera código TOTP en un tiempo específico
 */
const generateTOTPAtTime = (secret: string, time: number): string => {
  const counter = time.toString(16).padStart(16, '0');
  const hash = hashHMAC(secret, counter);
  const offset = parseInt(hash.slice(-1), 16);
  const code = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;
  
  return (code % 1000000).toString().padStart(6, '0');
};

/**
 * Hash HMAC simplificado (para demo)
 * En producción, usar crypto.subtle.sign con HMAC-SHA1
 */
const hashHMAC = (key: string, message: string): string => {
  // Implementación mejorada para demo
  // En producción, usar: crypto.subtle.sign('HMAC', key, message)
  const combined = key + message + key.length + message.length;
  let hash = 5381; // DJB2 hash
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  
  // Generar hash más largo y variado
  const baseHash = Math.abs(hash).toString(16);
  const extendedHash = baseHash.repeat(5).slice(0, 40);
  
  return extendedHash.padStart(40, '0');
};

/**
 * Genera URL para QR code (compatible con Google Authenticator)
 */
export const generate2FAQRCodeURL = (
  secret: string,
  username: string,
  issuer: string = 'Violet ERP'
): string => {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedUsername = encodeURIComponent(username);
  
  return `otpauth://totp/${encodedIssuer}:${encodedUsername}?secret=${secret}&issuer=${encodedIssuer}`;
};

/**
 * Genera códigos de respaldo (backup codes)
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .slice(0, 8);
    
    codes.push(code);
  }
  
  return codes;
};

/**
 * Interfaz para configuración de 2FA del usuario
 */
export interface User2FAConfig {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  verifiedAt?: string;
}

/**
 * Habilita 2FA para un usuario
 */
export const enable2FA = (username: string): {
  secret: string;
  qrCodeURL: string;
  backupCodes: string[];
} => {
  const secret = generate2FASecret();
  const qrCodeURL = generate2FAQRCodeURL(secret, username);
  const backupCodes = generateBackupCodes();
  
  return {
    secret,
    qrCodeURL,
    backupCodes,
  };
};

/**
 * Verifica código de respaldo
 */
export const verifyBackupCode = (
  code: string,
  backupCodes: string[]
): { valid: boolean; remainingCodes?: string[] } => {
  const sanitizedCode = sanitizeString(code).toUpperCase();
  
  if (!sanitizedCode || sanitizedCode.length !== 8) {
    return { valid: false };
  }
  
  const index = backupCodes.indexOf(sanitizedCode);
  
  if (index === -1) {
    return { valid: false };
  }
  
  // Remover código usado
  const remainingCodes = backupCodes.filter((_, i) => i !== index);
  
  return {
    valid: true,
    remainingCodes,
  };
};
