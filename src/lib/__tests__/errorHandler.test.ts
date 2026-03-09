/**
 * Tests para errorHandler.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  NetworkError,
  DatabaseError,
  BusinessLogicError,
  ErrorType,
  handleError,
  handleAsyncError,
  isOperationalError,
  formatErrorForLogging,
  createErrorFromResponse,
  retryOperation,
} from '../errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION, 400);
      
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include context if provided', () => {
      const context = { field: 'email', value: 'invalid' };
      const error = new AppError('Test error', ErrorType.VALIDATION, 400, true, context);
      
      expect(error.context).toEqual(context);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', ErrorType.VALIDATION, 400);
      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.type).toBe(ErrorType.VALIDATION);
      expect(json.statusCode).toBe(400);
    });
  });

  describe('Error Classes', () => {
    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should create AuthenticationError', () => {
      const error = new AuthenticationError();
      
      expect(error.type).toBe(ErrorType.AUTHENTICATION);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No autenticado');
    });

    it('should create AuthorizationError', () => {
      const error = new AuthorizationError();
      
      expect(error.type).toBe(ErrorType.AUTHORIZATION);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('No autorizado');
    });

    it('should create NotFoundError', () => {
      const error = new NotFoundError('Usuario');
      
      expect(error.type).toBe(ErrorType.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Usuario no encontrado');
    });

    it('should create ConflictError', () => {
      const error = new ConflictError('Duplicate entry');
      
      expect(error.type).toBe(ErrorType.CONFLICT);
      expect(error.statusCode).toBe(409);
    });

    it('should create NetworkError', () => {
      const error = new NetworkError();
      
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.statusCode).toBe(503);
    });

    it('should create DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      
      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.statusCode).toBe(500);
    });

    it('should create BusinessLogicError', () => {
      const error = new BusinessLogicError('Insufficient stock');
      
      expect(error.type).toBe(ErrorType.BUSINESS_LOGIC);
      expect(error.statusCode).toBe(422);
    });
  });

  describe('handleError', () => {
    it('should handle AppError', () => {
      const error = new ValidationError('Invalid input');
      const result = handleError(error, false);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Generic error');
      const result = handleError(error, false);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Generic error');
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should handle unknown errors', () => {
      const result = handleError('string error', false);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('handleAsyncError', () => {
    it('should handle successful async function', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = handleAsyncError(fn, false);
      
      const result = await wrapped();
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should handle async function error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Async error'));
      const wrapped = handleAsyncError(fn, false);
      
      const result = await wrapped();
      
      expect(result).toBeNull();
      expect(fn).toHaveBeenCalled();
    });

    it('should pass arguments to wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = handleAsyncError(fn, false);
      
      await wrapped('arg1', 'arg2');
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('isOperationalError', () => {
    it('should identify operational errors', () => {
      const error = new ValidationError('Invalid input');
      
      expect(isOperationalError(error)).toBe(true);
    });

    it('should identify non-operational errors', () => {
      const error = new AppError('Error', ErrorType.UNKNOWN, 500, false);
      
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for regular errors', () => {
      const error = new Error('Regular error');
      
      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format AppError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const formatted = formatErrorForLogging(error);
      
      expect(formatted.type).toBe(ErrorType.VALIDATION);
      expect(formatted.message).toBe('Invalid input');
      expect(formatted.context).toEqual({ field: 'email' });
    });

    it('should format regular Error', () => {
      const error = new Error('Regular error');
      const formatted = formatErrorForLogging(error);
      
      expect(formatted.name).toBe('Error');
      expect(formatted.message).toBe('Regular error');
    });

    it('should format unknown errors', () => {
      const formatted = formatErrorForLogging('string error');
      
      expect(formatted.error).toBe('string error');
    });
  });

  describe('createErrorFromResponse', () => {
    it('should create ValidationError for 400', () => {
      const error = createErrorFromResponse({ status: 400, data: { message: 'Invalid' } });
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
    });

    it('should create AuthenticationError for 401', () => {
      const error = createErrorFromResponse({ status: 401 });
      
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should create AuthorizationError for 403', () => {
      const error = createErrorFromResponse({ status: 403 });
      
      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('should create NotFoundError for 404', () => {
      const error = createErrorFromResponse({ status: 404, data: { message: 'User' } });
      
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should create ConflictError for 409', () => {
      const error = createErrorFromResponse({ status: 409 });
      
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should create BusinessLogicError for 422', () => {
      const error = createErrorFromResponse({ status: 422 });
      
      expect(error).toBeInstanceOf(BusinessLogicError);
    });

    it('should create NetworkError for 503', () => {
      const error = createErrorFromResponse({ status: 503 });
      
      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should create generic AppError for other codes', () => {
      const error = createErrorFromResponse({ status: 500 });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await retryOperation(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retryOperation(operation, 3, 10)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });
});
