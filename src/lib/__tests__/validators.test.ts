import { describe, it, expect } from 'vitest';
import {
  validateRIF,
  validateCedula,
  validateEmail,
  validatePhone,
  validateStrongPassword,
  validateURL,
  validateUUID,
  validateAmount,
  validatePercentage,
  validateDate,
  validateFutureDate,
  validatePastDate,
  validateDateRange,
  validateHexColor,
} from '../validators';

describe('validators', () => {
  describe('validateRIF', () => {
    it('should validate correct RIF formats', () => {
      expect(validateRIF('J-12345678-9')).toBe(true);
      expect(validateRIF('V-12345678-0')).toBe(true);
      expect(validateRIF('E-12345678-1')).toBe(true);
      expect(validateRIF('G-12345678-2')).toBe(true);
    });

    it('should reject invalid RIF formats', () => {
      expect(validateRIF('12345678')).toBe(false);
      expect(validateRIF('J-123-4')).toBe(false);
      expect(validateRIF('X-12345678-9')).toBe(false);
      expect(validateRIF('J12345678-9')).toBe(false);
      expect(validateRIF('')).toBe(false);
    });
  });

  describe('validateCedula', () => {
    it('should validate correct cedula formats', () => {
      expect(validateCedula('V-12345678')).toBe(true);
      expect(validateCedula('E-1234567')).toBe(true);
      expect(validateCedula('V-1234567')).toBe(true);
    });

    it('should reject invalid cedula formats', () => {
      expect(validateCedula('12345678')).toBe(false);
      expect(validateCedula('V-123')).toBe(false);
      expect(validateCedula('X-12345678')).toBe(false);
      expect(validateCedula('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@company.co.ve')).toBe(true);
      expect(validateEmail('admin@violet-erp.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('no-at-sign.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      expect(validatePhone('0414-1234567')).toBe(true);
      expect(validatePhone('+58 414 1234567')).toBe(true);
      expect(validatePhone('0212-1234567')).toBe(true);
      expect(validatePhone('04141234567')).toBe(true);
    });

    it('should reject invalid phone formats', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abcd')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateStrongPassword', () => {
    it('should validate strong passwords', () => {
      const result = validateStrongPassword('MyPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result1 = validateStrongPassword('abc');
      expect(result1.isValid).toBe(false);
      expect(result1.errors.length).toBeGreaterThan(0);

      const result2 = validateStrongPassword('password');
      expect(result2.isValid).toBe(false);

      const result3 = validateStrongPassword('PASSWORD123');
      expect(result3.isValid).toBe(false);
    });

    it('should provide specific error messages', () => {
      const result = validateStrongPassword('short');
      expect(result.errors).toContain('La contraseña debe tener al menos 8 caracteres');
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
      expect(validateURL('https://violet-erp.com/docs')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('htp://wrong')).toBe(false);
      expect(validateURL('')).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('123-456-789')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0)).toBe(true);
      expect(validateAmount(99.99)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(-10)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
    });
  });

  describe('validatePercentage', () => {
    it('should validate correct percentages', () => {
      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(50)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-1)).toBe(false);
      expect(validatePercentage(101)).toBe(false);
      expect(validatePercentage(NaN)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate correct dates', () => {
      expect(validateDate('2026-03-01')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
      expect(validateDate('2026-12-31T23:59:59Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('2026-13-01')).toBe(false);
      expect(validateDate('')).toBe(false);
    });
  });

  describe('validateFutureDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validateFutureDate(futureDate)).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(validateFutureDate(pastDate)).toBe(false);
    });
  });

  describe('validatePastDate', () => {
    it('should validate past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(validatePastDate(pastDate)).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validatePastDate(futureDate)).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-12-31');
      expect(validateDateRange(start, end)).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      const start = new Date('2026-12-31');
      const end = new Date('2026-01-01');
      expect(validateDateRange(start, end)).toBe(false);
    });
  });

  describe('validateHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(validateHexColor('#FF0000')).toBe(true);
      expect(validateHexColor('#000')).toBe(true);
      expect(validateHexColor('#7c3aed')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateHexColor('FF0000')).toBe(false);
      expect(validateHexColor('#GG0000')).toBe(false);
      expect(validateHexColor('#12')).toBe(false);
      expect(validateHexColor('')).toBe(false);
    });
  });
});
