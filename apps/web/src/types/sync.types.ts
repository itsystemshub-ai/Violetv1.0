/**
 * Tipos para el sistema de sincronización
 */

/**
 * Acciones de mutación
 */
export type MutationAction = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Resultado de mutación
 */
export interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error | { message: string };
  offline?: boolean;
  localOnly?: boolean;
}

/**
 * Log de sincronización
 */
export interface SyncLog {
  id: string;
  table_name: string;
  record_id: string;
  action: MutationAction;
  payload: string; // JSON stringified
  sync_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  synced_at?: string;
  attempts?: number;
  last_error?: string;
}

/**
 * Opciones de sincronización
 */
export interface SyncOptions {
  force?: boolean;
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Resultado de sincronización
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: Array<{ recordId: string; error: string }>;
}
