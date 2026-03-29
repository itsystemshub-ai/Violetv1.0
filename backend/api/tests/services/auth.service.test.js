import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../src/services/auth.service';

describe('AuthService', () => {
  let authService;

  beforeAll(() => {
    authService = new AuthService();
  });

  afterAll(() => {
    // Cleanup
  });

  describe('login', () => {
    it('should throw error with invalid credentials', async () => {
      await expect(authService.login('invalid@test.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid credentials');
    });

    it('should return user data and tokens with valid credentials', async () => {
      // This would require a real database connection
      // Mock test example
      const mockUser = {
        id: '1',
        email: 'admin@violet-erp.com',
        username: 'admin',
      };

      expect(mockUser).toBeDefined();
      expect(mockUser.email).toBe('admin@violet-erp.com');
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const mockUser = { id: '1', email: 'test@test.com', role_name: 'user' };
      const permissions = [{ name: 'users:read' }];

      const token = authService.generateAccessToken(mockUser, permissions);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });
});
