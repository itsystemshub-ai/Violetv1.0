/**
 * Violet ERP - Encryption Service
 * Usa Web Crypto API nativa del navegador en lugar de crypto-js
 */

class EncryptionService {
  private key: CryptoKey | null = null;
  private keyMaterial: CryptoKey | null = null;

  /**
   * Inicializar el servicio de encriptación
   */
  async initialize(password: string) {
    try {
      // Derivar clave usando PBKDF2
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      this.keyMaterial = keyMaterial;

      // Derivar clave AES-GCM
      this.key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('violet-erp-salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      console.log('[Encryption] Service initialized');
    } catch (error) {
      console.error('[Encryption] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Encriptar datos
   */
  async encrypt(data: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encoder.encode(data)
      );

      // Combinar IV + datos encriptados
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convertir a base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('[Encryption] Encrypt error:', error);
      throw error;
    }
  }

  /**
   * Desencriptar datos
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Convertir de base64 a Uint8Array
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extraer IV y datos
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('[Encryption] Decrypt error:', error);
      throw error;
    }
  }

  /**
   * Generar hash SHA-256
   */
  async hash(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const hashBuffer = await window.crypto.subtle.digest(
        'SHA-256',
        encoder.encode(data)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('[Encryption] Hash error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

export default encryptionService;
