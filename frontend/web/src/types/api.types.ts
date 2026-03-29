/**
 * Tipos para respuestas de API y operaciones
 */

/**
 * Respuesta estándar de API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | Error;
  message?: string;
}

/**
 * Respuesta de operación CRUD
 */
export interface CrudResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error | { message: string };
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Parámetros de búsqueda
 */
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: PaginationParams;
}
