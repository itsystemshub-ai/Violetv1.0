/**
 * Tests para sistema de autenticación de dos factores (2FA)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generate2FASecret,
  generateTOTP,
  verifyTOTP,
  generate2FAQRCodeURL,
  generateBackupCodes,
  enable2FA,
  verifyBackupCode,
} from '../twoFactor';

describe('twoFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate2FASecret', () => {
    it('debe generar un secreto de 32 caracteres', () => {
      const secret = generate2FASecret();
      expect(secret).toHaveLength(32);
    });

    it('debe generar secretos únicos', () => {
      const secret1 = generate2FASecret();
      const secret2 = generate2FASecret();
      expect(secret1).not.toBe(secret2);
    });

    it('debe usar solo caracteres base32 válidos', () => {
      const secret = generate2FASecret();
      const base32Regex = /^[A-Z2-7]+$/;
      expect(secret).toMatch(base32Regex);
    });
  });

  describe('generateTOTP', () => {
    it('debe generar un código de 6 dígitos', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTOTP(secret);
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('debe generar códigos diferentes para secretos diferentes', () => {
      const code1 = generateTOTP('SECRET1');
      const code2 = generateTOTP('SECRET2');
      expect(code1).not.toBe(code2);
    });

    it('debe incluir ceros a la izquierda si es necesario', () => {
      const secret = 'TESTSECRET';
      const code = generateTOTP(secret);
      expect(code).toHaveLength(6);
    });
  });

  describe('verifyTOTP', () => {
    it('debe verificar código válido', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTOTP(secret);
      const isValid = verifyTOTP(secret, code);
      expect(isValid).toBe(true);
    });

    it('debe rechazar código inválido', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const isValid = verifyTOTP(secret, '000000');
      expect(isValid).toBe(false);
    });

    it('debe rechazar código con longitud incorrecta', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(verifyTOTP(secret, '123')).toBe(false);
      expect(verifyTOTP(secret, '1234567')).toBe(false);
    });

    it('debe rechazar código con caracteres no numéricos', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(verifyTOTP(secret, 'abc123')).toBe(false);
      expect(verifyTOTP(secret, '12-345')).toBe(false);
    });

    it('debe sanitizar entrada', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTOTP(secret);
      expect(verifyTOTP(secret, `  ${code}  `)).toBe(true);
    });

    it('debe aceptar códigos dentro de la ventana de tiempo', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTOTP(secret);
      
      // Simular verificación inmediata
      const isValid = verifyTOTP(secret, code, 1);
      expect(isValid).toBe(true);
    });
  });

  describe('generate2FAQRCodeURL', () => {
    it('debe generar URL válida para QR code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const username = 'testuser';
      const url = generate2FAQRCodeURL(secret, username);
      
      expect(url).toContain('otpauth://totp/');
      expect(url).toContain(secret);
      expect(url).toContain(username);
    });

    it('debe incluir issuer por defecto', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const username = 'testuser';
      const url = generate2FAQRCodeURL(secret, username);
      
      expect(url).toContain('Violet%20ERP');
    });

    it('debe permitir issuer personalizado', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const username = 'testuser';
      const issuer = 'My Company';
      const url = generate2FAQRCodeURL(secret, username, issuer);
      
      expect(url).toContain('My%20Company');
    });

    it('debe codificar caracteres especiales', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const username = 'test@user.com';
      const url = generate2FAQRCodeURL(secret, username);
      
      expect(url).toContain('test%40user.com');
    });
  });

  describe('generateBackupCodes', () => {
    it('debe generar 10 códigos por defecto', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('debe generar cantidad personalizada de códigos', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('debe generar códigos de 8 caracteres', () => {
      const codes = generateBackupCodes();
      codes.forEach(code => {
        expect(code).toHaveLength(8);
      });
    });

    it('debe generar códigos únicos', () => {
      const codes = generateBackupCodes(20);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(20);
    });

    it('debe usar solo caracteres hexadecimales en mayúsculas', () => {
      const codes = generateBackupCodes();
      const hexRegex = /^[0-9A-F]{8}$/;
      codes.forEach(code => {
        expect(code).toMatch(hexRegex);
      });
    });
  });

  describe('enable2FA', () => {
    it('debe retornar configuración completa', () => {
      const username = 'testuser';
      const config = enable2FA(username);
      
      expect(config).toHaveProperty('secret');
      expect(config).toHaveProperty('qrCodeURL');
      expect(config).toHaveProperty('backupCodes');
    });

    it('debe generar secreto válido', () => {
      const config = enable2FA('testuser');
      expect(config.secret).toHaveLength(32);
    });

    it('debe generar URL de QR válida', () => {
      const username = 'testuser';
      const config = enable2FA(username);
      
      expect(config.qrCodeURL).toContain('otpauth://totp/');
      expect(config.qrCodeURL).toContain(config.secret);
      expect(config.qrCodeURL).toContain(username);
    });

    it('debe generar códigos de respaldo', () => {
      const config = enable2FA('testuser');
      expect(config.backupCodes).toHaveLength(10);
    });
  });

  describe('verifyBackupCode', () => {
    const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];

    it('debe verificar código válido', () => {
      const result = verifyBackupCode('ABCD1234', backupCodes);
      expect(result.valid).toBe(true);
      expect(result.remainingCodes).toHaveLength(2);
    });

    it('debe rechazar código inválido', () => {
      const result = verifyBackupCode('INVALID0', backupCodes);
      expect(result.valid).toBe(false);
      expect(result.remainingCodes).toBeUndefined();
    });

    it('debe remover código usado', () => {
      const result = verifyBackupCode('EFGH5678', backupCodes);
      expect(result.valid).toBe(true);
      expect(result.remainingCodes).not.toContain('EFGH5678');
      expect(result.remainingCodes).toContain('ABCD1234');
      expect(result.remainingCodes).toContain('IJKL9012');
    });

    it('debe ser case-insensitive', () => {
      const result = verifyBackupCode('abcd1234', backupCodes);
      expect(result.valid).toBe(true);
    });

    it('debe rechazar código con longitud incorrecta', () => {
      expect(verifyBackupCode('ABC', backupCodes).valid).toBe(false);
      expect(verifyBackupCode('ABCD12345', backupCodes).valid).toBe(false);
    });

    it('debe sanitizar entrada', () => {
      const result = verifyBackupCode('  ABCD1234  ', backupCodes);
      expect(result.valid).toBe(true);
    });

    it('debe manejar lista vacía de códigos', () => {
      const result = verifyBackupCode('ABCD1234', []);
      expect(result.valid).toBe(false);
    });
  });

  describe('Integración 2FA', () => {
    it('debe completar flujo completo de habilitación', () => {
      const username = 'testuser';
      
      // 1. Habilitar 2FA
      const config = enable2FA(username);
      expect(config.secret).toBeTruthy();
      
      // 2. Generar código TOTP
      const code = generateTOTP(config.secret);
      expect(code).toHaveLength(6);
      
      // 3. Verificar código
      const isValid = verifyTOTP(config.secret, code);
      expect(isValid).toBe(true);
    });

    it('debe permitir usar código de respaldo', () => {
      const config = enable2FA('testuser');
      const backupCode = config.backupCodes[0];
      
      const result = verifyBackupCode(backupCode, config.backupCodes);
      expect(result.valid).toBe(true);
      expect(result.remainingCodes).toHaveLength(9);
    });

    it('debe rechazar código de respaldo ya usado', () => {
      const config = enable2FA('testuser');
      const backupCode = config.backupCodes[0];
      
      // Usar código
      const result1 = verifyBackupCode(backupCode, config.backupCodes);
      expect(result1.valid).toBe(true);
      
      // Intentar usar de nuevo
      const result2 = verifyBackupCode(backupCode, result1.remainingCodes!);
      expect(result2.valid).toBe(false);
    });
  });
});
