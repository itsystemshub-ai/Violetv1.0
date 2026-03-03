/**
 * Módulo de encriptación para datos sensibles
 * Usa AES-256 para encriptar datos en localStorage
 */

import CryptoJS from 'crypto-js';

// IMPORTANTE: En producción, esta clave debe venir de variables de entorno
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'violet-erp-default-key-change-in-production';

/**
 * Encripta datos usando AES-256
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Desencripta datos encriptados con AES-256
 */
export const decryptData = (encryptedData: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

/**
 * Storage seguro que encripta automáticamente
 */
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
    }
  },

  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return decryptData(encrypted);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};

/**
 * Hash de contraseñas (para validación client-side)
 * NOTA: En producción, el hash debe hacerse en el servidor
 */
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

/**
 * Genera un token seguro aleatorio
 */
export const generateSecureToken = (): string => {
  const randomBytes = CryptoJS.lib.WordArray.random(32);
  return CryptoJS.enc.Base64.stringify(randomBytes);
};
