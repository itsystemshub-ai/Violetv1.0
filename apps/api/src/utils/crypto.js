const crypto = require('crypto');

/**
 * Utilidades de criptografía
 */
class CryptoUtils {
  /**
   * Genera un UUID
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Genera un hash
   */
  static hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }
}

module.exports = CryptoUtils;
