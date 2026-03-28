/**
 * Tipos comunes para todos los módulos
 */

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface AuditFields {
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface StatusEntity {
  estatus: 'A' | 'I'; // Activo / Inactivo
}

export interface DocumentEntity {
  documento: string;
  tipo_documento: string;
  fecha: string;
}

export interface MonetaryEntity {
  moneda: string;
  factor_cambio: number;
}

export interface TotalFields {
  total_bruto: number;
  total_descuento: number;
  total_neto: number;
  total_impuesto: number;
  total_operacion: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
