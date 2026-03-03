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
 * Payload de mutación para Electron
 */
export interface ElectronMutationPayload {
  tableName: string;
  action: MutationAction;
  payload: Record<string, unknown> | null;
  recordId: string;
}

/**
 * Resultado de mutación de Electron
 */
export interface ElectronMutationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * API de Electron
 */
export interface ElectronAPI {
  mutateRecord: (payload: ElectronMutationPayload) => Promise<ElectronMutationResult>;
  // Agregar más métodos según sea necesario
}

/**
 * Window con Electron API
 */
export interface WindowWithElectron extends Window {
  electronAPI?: ElectronAPI;
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
