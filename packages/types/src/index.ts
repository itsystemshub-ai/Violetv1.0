/**
 * @violet/types
 * Shared TypeScript types for Violet ERP
 */

// Common types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'superadmin' | 'admin' | 'user' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  locale: string;
  fiscalYearStart: string;
}

// Database types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog extends BaseEntity {
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface Config extends BaseEntity {
  key: string;
  value: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Module types
export type ModuleId = 
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'finance'
  | 'hr'
  | 'reports'
  | 'settings'
  | 'crm';

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  icon: string;
  path: string;
  enabled: boolean;
  permissions: string[];
}

// AI types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: 'groq' | 'gemini' | 'huggingface';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
