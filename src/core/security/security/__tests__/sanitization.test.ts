import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeRIF,
  isSafeSqlString,
  sanitizeObject,
  sanitizeFilename,
  isSafeUrl,
  sanitizePath,
  validateNumberRange,
  sanitizeAmount,
} from '../sanitization';

describe('sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      expect(sanitizeString('Hello\x00World')).toBe('HelloWorld');
      expect(sanitizeString('Test\x1FString')).toBe('TestString');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(123 as any)).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('should preserve normal text', () => {
      expect(sanitizeString('Normal text 123')).toBe('Normal text 123');
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('Hello\x00\x00World')).toBe('HelloWorld');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid emails', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('test.user@domain.co.uk')).toBe('test.user@domain.co.uk');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('invalid')).toBeNull();
      expect(sanitizeEmail('invalid@')).toBeNull();
      expect(sanitizeEmail('@invalid.com')).toBeNull();
      expect(sanitizeEmail('invalid@domain')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should handle empty strings', () => {
      expect(sanitizeEmail('')).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    it('should preserve valid phone characters', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePhone('+1-555-ABC-1234')).toBe('+1-555--1234');
    });

    it('should trim whitespace', () => {
      expect(sanitizePhone('  555-1234  ')).toBe('555-1234');
    });

    it('should handle empty strings', () => {
      expect(sanitizePhone('')).toBe('');
    });

    it('should preserve international format', () => {
      expect(sanitizePhone('+58 414 1234567')).toBe('+58 414 1234567');
    });
  });

  describe('sanitizeRIF', () => {
    it('should format valid RIF', () => {
      expect(sanitizeRIF('j-12345678-9')).toBe('J-12345678-9');
    });

    it('should convert to uppercase', () => {
      expect(sanitizeRIF('v-12345678-9')).toBe('V-12345678-9');
    });

    it('should remove invalid characters', () => {
      // La función solo remueve caracteres que NO son JGVEPCD, 0-9, o -
      // ABC son letras válidas pero no son tipos de RIF válidos
      // Sin embargo, la función actual no los filtra
      expect(sanitizeRIF('J-123ABC456-9')).toBe('J-123C456-9');
    });

    it('should preserve valid RIF types', () => {
      expect(sanitizeRIF('J-12345678-9')).toBe('J-12345678-9');
      expect(sanitizeRIF('G-12345678-9')).toBe('G-12345678-9');
      expect(sanitizeRIF('V-12345678-9')).toBe('V-12345678-9');
      expect(sanitizeRIF('E-12345678-9')).toBe('E-12345678-9');
      expect(sanitizeRIF('P-12345678-9')).toBe('P-12345678-9');
      expect(sanitizeRIF('C-12345678-9')).toBe('C-12345678-9');
      expect(sanitizeRIF('D-12345678-9')).toBe('D-12345678-9');
    });

    it('should trim whitespace', () => {
      expect(sanitizeRIF('  J-12345678-9  ')).toBe('J-12345678-9');
    });
  });

  describe('isSafeSqlString', () => {
    it('should detect SQL injection attempts', () => {
      expect(isSafeSqlString("'; DROP TABLE users; --")).toBe(false);
      expect(isSafeSqlString('SELECT * FROM users')).toBe(false);
      expect(isSafeSqlString('INSERT INTO users')).toBe(false);
      expect(isSafeSqlString('UPDATE users SET')).toBe(false);
      expect(isSafeSqlString('DELETE FROM users')).toBe(false);
    });

    it('should detect OR/AND injection patterns', () => {
      expect(isSafeSqlString("admin' OR '1'='1")).toBe(false);
      expect(isSafeSqlString("admin' AND '1'='1")).toBe(false);
    });

    it('should detect UNION attacks', () => {
      expect(isSafeSqlString('UNION SELECT password FROM users')).toBe(false);
    });

    it('should detect comment patterns', () => {
      expect(isSafeSqlString('admin --')).toBe(false);
      expect(isSafeSqlString('admin /* comment */')).toBe(false);
    });

    it('should allow safe strings', () => {
      expect(isSafeSqlString('John Doe')).toBe(true);
      expect(isSafeSqlString('user@example.com')).toBe(true);
      expect(isSafeSqlString('Product Name 123')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isSafeSqlString('select * from users')).toBe(false);
      expect(isSafeSqlString('SeLeCt * FrOm users')).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const input = {
        name: '  John Doe  ',
        email: 'test@example.com',
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('test@example.com');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '  Jane  ',
          address: {
            street: '  Main St  ',
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).toBe('Jane');
      expect(result.user.address.street).toBe('Main St');
    });

    it('should sanitize arrays of strings', () => {
      const input = {
        tags: ['  tag1  ', '  tag2  ', '  tag3  '],
      };
      const result = sanitizeObject(input);
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should sanitize arrays of objects', () => {
      const input = {
        users: [
          { name: '  John  ' },
          { name: '  Jane  ' },
        ],
      };
      const result = sanitizeObject(input);
      expect(result.users[0].name).toBe('John');
      expect(result.users[1].name).toBe('Jane');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        score: null,
      };
      const result = sanitizeObject(input);
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.score).toBeNull();
    });

    it('should remove control characters from strings', () => {
      const input = {
        name: 'John\x00Doe',
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe('JohnDoe');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid characters with underscores', () => {
      expect(sanitizeFilename('file<name>.txt')).toBe('file_name_.txt');
      expect(sanitizeFilename('file:name.txt')).toBe('file_name.txt');
    });

    it('should prevent directory traversal', () => {
      // La función reemplaza .. con nada, y / con _
      expect(sanitizeFilename('../../../etc/passwd')).toBe('._._._etc_passwd');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt');
    });

    it('should handle multiple dots', () => {
      expect(sanitizeFilename('file...txt')).toBe('file.txt');
    });

    it('should preserve extension', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('image.jpg')).toBe('image.jpg');
    });
  });

  describe('isSafeUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('should reject javascript: URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should reject file: URLs', () => {
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isSafeUrl('not a url')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
    });

    it('should accept URLs with paths and query strings', () => {
      expect(isSafeUrl('https://example.com/path?query=value')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isSafeUrl('http://localhost:3000')).toBe(true);
    });
  });

  describe('sanitizePath', () => {
    it('should prevent directory traversal', () => {
      expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizePath('../../file.txt')).toBe('file.txt');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePath('path<>:"|?*')).toBe('path');
    });

    it('should remove leading slashes', () => {
      expect(sanitizePath('/path/to/file')).toBe('path/to/file');
      expect(sanitizePath('///path/to/file')).toBe('path/to/file');
    });

    it('should trim whitespace', () => {
      expect(sanitizePath('  path/to/file  ')).toBe('path/to/file');
    });

    it('should preserve valid paths', () => {
      expect(sanitizePath('path/to/file.txt')).toBe('path/to/file.txt');
    });
  });

  describe('validateNumberRange', () => {
    it('should validate numbers within range', () => {
      expect(validateNumberRange(5, 0, 10)).toBe(true);
      expect(validateNumberRange(0, 0, 10)).toBe(true);
      expect(validateNumberRange(10, 0, 10)).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(validateNumberRange(-1, 0, 10)).toBe(false);
      expect(validateNumberRange(11, 0, 10)).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validateNumberRange(NaN, 0, 10)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(validateNumberRange('5' as any, 0, 10)).toBe(false);
      expect(validateNumberRange(null as any, 0, 10)).toBe(false);
      expect(validateNumberRange(undefined as any, 0, 10)).toBe(false);
    });

    it('should handle negative ranges', () => {
      expect(validateNumberRange(-5, -10, 0)).toBe(true);
      expect(validateNumberRange(-11, -10, 0)).toBe(false);
    });

    it('should handle decimal numbers', () => {
      expect(validateNumberRange(5.5, 0, 10)).toBe(true);
      expect(validateNumberRange(10.1, 0, 10)).toBe(false);
    });
  });

  describe('sanitizeAmount', () => {
    it('should parse string amounts', () => {
      expect(sanitizeAmount('123.45')).toBe(123.45);
      expect(sanitizeAmount('$1,234.56')).toBe(1234.56);
    });

    it('should handle numeric amounts', () => {
      expect(sanitizeAmount(123.45)).toBe(123.45);
    });

    it('should round to 2 decimal places', () => {
      expect(sanitizeAmount(123.456)).toBe(123.46);
      expect(sanitizeAmount(123.454)).toBe(123.45);
    });

    it('should handle negative amounts', () => {
      expect(sanitizeAmount('-123.45')).toBe(-123.45);
      expect(sanitizeAmount(-123.45)).toBe(-123.45);
    });

    it('should return 0 for invalid amounts', () => {
      expect(sanitizeAmount('invalid')).toBe(0);
      expect(sanitizeAmount('abc')).toBe(0);
    });

    it('should remove currency symbols', () => {
      expect(sanitizeAmount('$123.45')).toBe(123.45);
      expect(sanitizeAmount('€123.45')).toBe(123.45);
    });

    it('should remove thousands separators', () => {
      expect(sanitizeAmount('1,234,567.89')).toBe(1234567.89);
    });

    it('should handle zero', () => {
      expect(sanitizeAmount(0)).toBe(0);
      expect(sanitizeAmount('0')).toBe(0);
    });
  });
});
