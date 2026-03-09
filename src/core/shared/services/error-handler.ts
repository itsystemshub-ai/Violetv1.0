/**
 * Sistema centralizado de manejo de errores para Violet ERP.
 * 
 * Proporciona:
 * - Clases de error personalizadas por tipo
 * - Manejo centralizado de errores
 * - Mensajes amigables para usuarios
 * - Logging estructurado
 * - Retry logic para operaciones fallidas
 * - Integración con sistema de notificaciones
 * 
 * @module errorHandler
 * @category Utilities
 * 
 * @example
 * ```typescript
 * import { 
 *   handleError, 
 *   ValidationError, 
 *   NotFoundError,
 *   handleAsyncError 
 * } from '@/lib/errorHandler';
 * 
 * // Lanzar error personalizado
 * throw new ValidationError('El RIF es inválido', { rif: 'J-123' });
 * 
 * // Manejar error
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error); // Muestra toast automáticamente
 * }
 * 
 * // Wrapper para funciones async
 * const safeFunction = handleAsyncError(async () => {
 *   await riskyOperation();
 * });
 * ```
 */

import { toast } from 'sonner';
import { getUserMessage } from './userMessages';

/**
 * Enumeración de tipos de errores de la aplicación.
 * Permite categorizar errores para manejo específico.
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Clase base para todos los errores de la aplicación.
 * Extiende Error nativo con información adicional.
 * 
 * @extends Error
 * 
 * @property {ErrorType} type - Tipo de error
 * @property {number} statusCode - Código HTTP equivalente
 * @property {boolean} isOperational - Si es error esperado (true) o de programación (false)
 * @property {Date} timestamp - Momento en que ocurrió el error
 * @property {Record<string, any>} context - Contexto adicional del error
 * 
 * @example
 * ```typescript
 * throw new AppError(
 *   'Error al procesar solicitud',
 *   ErrorType.BUSINESS_LOGIC,
 *   422,
 *   true,
 *   { userId: '123', action: 'create_invoice' }
 * );
 * ```
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Error de validación de datos.
 * Usado cuando los datos de entrada no cumplen con los requisitos.
 * 
 * @extends AppError
 * @statusCode 400
 * 
 * @example
 * ```typescript
 * // Validación de formulario
 * if (!validateRIF(rif)) {
 *   throw new ValidationError('RIF inválido', { rif, expected: 'J-NNNNNNNN-N' });
 * }
 * 
 * // Validación de Zod
 * const result = productSchema.safeParse(data);
 * if (!result.success) {
 *   throw new ValidationError('Datos de producto inválidos', { 
 *     errors: result.error.errors 
 *   });
 * }
 * ```
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.VALIDATION, 400, true, context);
  }
}

/**
 * Error de autenticación
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado', context?: Record<string, any>) {
    super(message, ErrorType.AUTHENTICATION, 401, true, context);
  }
}

/**
 * Error de autorización
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No autorizado', context?: Record<string, any>) {
    super(message, ErrorType.AUTHORIZATION, 403, true, context);
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} no encontrado`, ErrorType.NOT_FOUND, 404, true, context);
  }
}

/**
 * Error de conflicto
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.CONFLICT, 409, true, context);
  }
}

/**
 * Error de red
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Error de conexión', context?: Record<string, any>) {
    super(message, ErrorType.NETWORK, 503, true, context);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.DATABASE, 500, true, context);
  }
}

/**
 * Error de lógica de negocio
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.BUSINESS_LOGIC, 422, true, context);
  }
}

/**
 * Maneja errores de forma centralizada y muestra notificaciones apropiadas.
 * 
 * Funcionalidades:
 * - Convierte errores desconocidos a AppError
 * - Registra errores en consola con contexto completo
 * - Muestra notificaciones toast al usuario
 * - Obtiene mensajes amigables según tipo de error
 * - Permite acciones específicas según tipo (ej: redirect a login)
 * 
 * @param {unknown} error - Error a manejar (puede ser cualquier tipo)
 * @param {boolean} [showToast=true] - Si debe mostrar notificación toast
 * @returns {AppError} Error normalizado como AppError
 * 
 * @example
 * ```typescript
 * try {
 *   await createProduct(data);
 * } catch (error) {
 *   const appError = handleError(error);
 *   console.log('Error type:', appError.type);
 *   console.log('Status code:', appError.statusCode);
 * }
 * 
 * // Sin mostrar toast
 * try {
 *   await operation();
 * } catch (error) {
 *   handleError(error, false); // Solo log, sin notificación
 * }
 * ```
 * 
 * @sideEffects
 * - Escribe en console.error
 * - Muestra toast.error si showToast=true
 * - Puede redirigir a login si es AuthenticationError
 */
export const handleError = (error: unknown, showToast: boolean = true): AppError => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      error.message,
      ErrorType.UNKNOWN,
      500,
      false,
      { originalError: error.name }
    );
  } else {
    appError = new AppError(
      'Ha ocurrido un error inesperado',
      ErrorType.UNKNOWN,
      500,
      false
    );
  }

  // Log del error
  console.error('[ErrorHandler]', {
    type: appError.type,
    message: appError.message,
    statusCode: appError.statusCode,
    timestamp: appError.timestamp,
    context: appError.context,
    stack: appError.stack,
  });

  // Mostrar notificación al usuario
  if (showToast) {
    const userMessage = getUserMessage(appError);
    
    toast.error(userMessage.title, { 
      description: userMessage.description,
      action: userMessage.action ? {
        label: userMessage.action,
        onClick: () => {
          // Acciones específicas según el tipo de error
          if (appError.type === ErrorType.AUTHENTICATION) {
            window.location.href = '/#/login';
          }
        }
      } : undefined
    });
  }

  return appError;
};

/**
 * Obtiene un mensaje amigable para el usuario
 */
const getUserFriendlyMessage = (error: AppError): string => {
  // Mensajes personalizados por tipo de error
  const friendlyMessages: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: error.message,
    [ErrorType.AUTHENTICATION]: 'Por favor, inicia sesión nuevamente',
    [ErrorType.AUTHORIZATION]: 'No tienes permisos para realizar esta acción',
    [ErrorType.NOT_FOUND]: error.message,
    [ErrorType.CONFLICT]: error.message,
    [ErrorType.NETWORK]: 'Verifica tu conexión a internet e intenta nuevamente',
    [ErrorType.DATABASE]: 'Error al procesar la solicitud. Intenta nuevamente',
    [ErrorType.BUSINESS_LOGIC]: error.message,
    [ErrorType.UNKNOWN]: 'Ha ocurrido un error inesperado. Intenta nuevamente',
  };

  return friendlyMessages[error.type] || error.message;
};

/**
 * Wrapper para funciones asíncronas que maneja errores automáticamente.
 * Convierte funciones que lanzan errores en funciones que retornan null en caso de error.
 * 
 * @template T - Tipo de la función asíncrona
 * @param {T} fn - Función asíncrona a envolver
 * @param {boolean} [showToast=true] - Si debe mostrar notificación en caso de error
 * @returns {Function} Función envuelta que retorna resultado o null
 * 
 * @example
 * ```typescript
 * // Función original que puede lanzar errores
 * const fetchUser = async (id: string) => {
 *   const response = await api.get(`/users/${id}`);
 *   return response.data;
 * };
 * 
 * // Función segura que maneja errores
 * const safeFetchUser = handleAsyncError(fetchUser);
 * 
 * // Uso
 * const user = await safeFetchUser('123');
 * if (user) {
 *   console.log('Usuario:', user);
 * } else {
 *   console.log('Error al cargar usuario');
 * }
 * ```
 * 
 * @note
 * - Útil para operaciones donde el error no debe detener la ejecución
 * - Retorna null en caso de error en lugar de lanzar excepción
 * - El error se maneja automáticamente con handleError
 */
export const handleAsyncError = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  showToast: boolean = true
): ((...args: Parameters<T>) => Promise<ReturnType<T> | null>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, showToast);
      return null;
    }
  };
};

/**
 * Verifica si un error es operacional (esperado) o de programación
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Formatea un error para logging
 */
export const formatErrorForLogging = (error: unknown): Record<string, any> => {
  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: String(error),
  };
};

/**
 * Crea un error desde una respuesta de API
 */
export const createErrorFromResponse = (
  response: { status: number; data?: any }
): AppError => {
  const message = response.data?.message || 'Error en la solicitud';
  const context = response.data?.context;

  switch (response.status) {
    case 400:
      return new ValidationError(message, context);
    case 401:
      return new AuthenticationError(message, context);
    case 403:
      return new AuthorizationError(message, context);
    case 404:
      return new NotFoundError(message, context);
    case 409:
      return new ConflictError(message, context);
    case 422:
      return new BusinessLogicError(message, context);
    case 503:
      return new NetworkError(message, context);
    default:
      return new AppError(message, ErrorType.UNKNOWN, response.status, true, context);
  }
};

/**
 * Implementa lógica de reintentos para operaciones que pueden fallar temporalmente.
 * Útil para operaciones de red, sincronización, o acceso a recursos externos.
 * 
 * @template T - Tipo del resultado de la operación
 * @param {Function} operation - Función asíncrona a ejecutar con reintentos
 * @param {number} [maxRetries=3] - Número máximo de intentos
 * @param {number} [delayMs=1000] - Delay base entre intentos en milisegundos
 * @returns {Promise<T>} Resultado de la operación si tiene éxito
 * @throws {AppError} Si falla después de todos los intentos
 * 
 * @example
 * ```typescript
 * // Sincronizar con servidor con reintentos
 * const result = await retryOperation(
 *   async () => {
 *     return await api.post('/sync', data);
 *   },
 *   5,  // 5 intentos
 *   2000 // 2 segundos entre intentos
 * );
 * 
 * // Operación de base de datos con reintentos
 * const user = await retryOperation(
 *   async () => await db.users.get(userId)
 * );
 * ```
 * 
 * @algorithm
 * - Delay incremental: intento 1 = delayMs, intento 2 = delayMs*2, etc.
 * - Registra warnings en consola para cada intento fallido
 * - Lanza AppError con contexto completo si todos los intentos fallan
 * 
 * @performance
 * - Delay total máximo: delayMs * (1 + 2 + 3 + ... + maxRetries)
 * - Para 3 intentos con 1000ms: máximo 6 segundos de delay
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.warn(`[RetryOperation] Intento ${attempt} falló, reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new AppError(
    `Operación falló después de ${maxRetries} intentos: ${lastError!.message}`,
    ErrorType.UNKNOWN,
    500,
    true,
    { originalError: lastError!.name, attempts: maxRetries }
  );
};
