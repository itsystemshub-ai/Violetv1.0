import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, needsRehash } from '../passwordHash';

describe('Password Hashing', () => {
  const testPassword = 'MySecurePassword123!';

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const hash = await hashPassword(testPassword);
      
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      
      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should reject password shorter than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });

    it('should reject null password', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow();
    });

    it('should reject undefined password', async () => {
      await expect(hashPassword(undefined as any)).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword123!', hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const isValid = await verifyPassword(testPassword, 'invalid-hash');
      
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const hash = await hashPassword('Password123');
      const isValid = await verifyPassword('password123', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle special characters', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()';
      const hash = await hashPassword(specialPassword);
      const isValid = await verifyPassword(specialPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodePassword = 'Contraseña123!';
      const hash = await hashPassword(unicodePassword);
      const isValid = await verifyPassword(unicodePassword, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should return false for fresh hash', async () => {
      const hash = await hashPassword(testPassword);
      const needs = needsRehash(hash);
      
      expect(needs).toBe(false);
    });

    it('should return true for invalid hash', () => {
      const needs = needsRehash('invalid-hash');
      
      expect(needs).toBe(true);
    });

    it('should return true for empty hash', () => {
      const needs = needsRehash('');
      
      expect(needs).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should use bcrypt format', async () => {
      const hash = await hashPassword(testPassword);
      
      // Bcrypt format: $2a$rounds$salt+hash
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should use sufficient rounds', async () => {
      const hash = await hashPassword(testPassword);
      const rounds = parseInt(hash.split('$')[2]);
      
      expect(rounds).toBeGreaterThanOrEqual(10);
      expect(rounds).toBeLessThanOrEqual(15);
    });

    it('should be slow enough to prevent brute force', async () => {
      const start = Date.now();
      await hashPassword(testPassword);
      const duration = Date.now() - start;
      
      // Should take at least 50ms (bcrypt is intentionally slow)
      expect(duration).toBeGreaterThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100) + '12345678';
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle passwords with only numbers', async () => {
      const numPassword = '12345678';
      const hash = await hashPassword(numPassword);
      const isValid = await verifyPassword(numPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle passwords with spaces', async () => {
      const spacePassword = 'My Password 123';
      const hash = await hashPassword(spacePassword);
      const isValid = await verifyPassword(spacePassword, hash);
      
      expect(isValid).toBe(true);
    });
  });
});
