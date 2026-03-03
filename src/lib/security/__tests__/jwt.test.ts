import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  isTokenExpiringSoon,
  getTokenExpirationTime,
  decodeToken,
} from '../jwt';

describe('JWT Security', () => {
  const mockPayload = {
    userId: '1',
    username: 'testuser',
    email: 'test@example.com',
    tenantId: 'tenant1',
    role: 'admin',
    isSuperAdmin: false,
    permissions: ['view:dashboard', 'inventory:read'],
  };

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include all payload data', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.tenantId).toBe(mockPayload.tenantId);
      expect(decoded?.role).toBe(mockPayload.role);
      expect(decoded?.isSuperAdmin).toBe(mockPayload.isSuperAdmin);
      expect(decoded?.permissions).toEqual(mockPayload.permissions);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken('user123');
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and type', () => {
      const token = generateRefreshToken('user123');
      const decoded: any = decodeToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded.userId).toBe('user123');
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.username).toBe(mockPayload.username);
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should reject malformed token', () => {
      const decoded = verifyToken('not.a.valid.jwt.token');
      expect(decoded).toBeNull();
    });

    it('should reject empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken('user123');
      const userId = verifyRefreshToken(token);
      
      expect(userId).toBe('user123');
    });

    it('should reject invalid refresh token', () => {
      const userId = verifyRefreshToken('invalid-token');
      expect(userId).toBeNull();
    });

    it('should reject access token as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const userId = verifyRefreshToken(accessToken);
      expect(userId).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid');
      expect(decoded).toBeNull();
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should return positive time for valid token', () => {
      const token = generateAccessToken(mockPayload);
      const remaining = getTokenExpirationTime(token);
      
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(24 * 60 * 60); // Max 24 hours
    });

    it('should return 0 for invalid token', () => {
      const remaining = getTokenExpirationTime('invalid');
      expect(remaining).toBe(0);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return false for fresh token', () => {
      const token = generateAccessToken(mockPayload);
      const expiringSoon = isTokenExpiringSoon(token, 5);
      
      expect(expiringSoon).toBe(false);
    });

    it('should return false for invalid token', () => {
      const expiringSoon = isTokenExpiringSoon('invalid', 5);
      expect(expiringSoon).toBe(false);
    });

    it('should use default threshold of 5 minutes', () => {
      const token = generateAccessToken(mockPayload);
      const expiringSoon = isTokenExpiringSoon(token);
      
      expect(typeof expiringSoon).toBe('boolean');
    });
  });

  describe('Token Security', () => {
    it('should generate different tokens for same payload', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken(mockPayload);
      
      // Tokens should be different due to timestamp
      expect(token1).not.toBe(token2);
    });

    it('should include expiration in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      
      expect(decoded?.exp).toBeTruthy();
      expect(typeof decoded?.exp).toBe('number');
    });

    it('should include issuer and audience', () => {
      const token = generateAccessToken(mockPayload);
      const decoded: any = decodeToken(token);
      
      expect(decoded.iss).toBe('violet-erp');
      expect(decoded.aud).toBe('violet-erp-users');
    });
  });
});
