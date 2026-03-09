/**
 * SecurityService - Gestión de seguridad, cifrado y certificados
 * Implementa protección de datos financieros y operativos
 */

export class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Inicializar clave de cifrado
   */
  async initializeEncryption(): Promise<void> {
    try {
      // Generar o recuperar clave de cifrado
      const keyData = localStorage.getItem('encryption_key');
      
      if (keyData) {
        // Importar clave existente
        const keyBuffer = this.base64ToArrayBuffer(keyData);
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generar nueva clave
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Guardar clave
        const exportedKey = await crypto.subtle.exportKey('raw', this.encryptionKey);
        localStorage.setItem('encryption_key', this.arrayBufferToBase64(exportedKey));
      }
    } catch (error) {
      console.error('[Security] Error inicializando cifrado:', error);
      throw error;
    }
  }

  /**
   * Cifrar datos sensibles (financieros, operativos)
   */
  async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generar IV aleatorio
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Cifrar
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        dataBuffer
      );
      
      // Combinar IV + datos cifrados
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('[Security] Error cifrando datos:', error);
      throw error;
    }
  }

  /**
   * Descifrar datos
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Separar IV y datos cifrados
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      // Descifrar
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        data
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('[Security] Error descifrando datos:', error);
      throw error;
    }
  }

  /**
   * Hash de contraseñas (SHA-256)
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verificar certificado SSL
   */
  async verifySSLCertificate(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Generar token de sesión seguro
   */
  generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer);
  }

  /**
   * Validar integridad de datos
   */
  async validateDataIntegrity(data: string, signature: string): Promise<boolean> {
    try {
      const dataHash = await this.hashPassword(data);
      return dataHash === signature;
    } catch {
      return false;
    }
  }

  // Utilidades
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const securityService = SecurityService.getInstance();
