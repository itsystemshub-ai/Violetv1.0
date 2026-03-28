import CryptoJS from "crypto-js";

/**
 * Clave de cifrado para datos sensibles
 * En producción, esto debería venir de variables de entorno
 */
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "violet-erp-secure-key-2026";

/**
 * Cifra un texto usando AES-256
 */
export function encrypt(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Error al cifrar:", error);
    return text;
  }
}

/**
 * Descifra un texto cifrado con AES-256
 */
export function decrypt(encryptedText: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error al descifrar:", error);
    return encryptedText;
  }
}

/**
 * Cifra un objeto completo
 */
export function encryptObject<T>(obj: T): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    console.error("Error al cifrar objeto:", error);
    return JSON.stringify(obj);
  }
}

/**
 * Descifra un objeto
 */
export function decryptObject<T>(encryptedString: string): T | null {
  try {
    const decrypted = decrypt(encryptedString);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Error al descifrar objeto:", error);
    return null;
  }
}

/**
 * Hash de una contraseña (para comparación, no reversible)
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Verifica si un hash coincide con una contraseña
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
