/**
 * Violet ERP - Servicios Compartidos
 * 
 * Cliente API, Event Bus, Notificaciones y Servicios en tiempo real.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { io, Socket } from 'socket.io-client';
import type { ApiResponse, ApiError, PaginationParams, PaginatedResponse } from '@violet-erp/types';

// ============================================================================
# CONFIGURACIÓN
// ============================================================================

export interface ApiServiceConfig {
  baseURL: string;
  timeout?: number;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onUnauthorized?: () => void;
}

// ============================================================================
# CLIENTE API HTTP
// ============================================================================

export class ApiService {
  private client: AxiosInstance;
  private config: ApiServiceConfig;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(config: ApiServiceConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.accessToken) {
          config.headers.Authorization = `Bearer ${this.config.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.isRefreshing = false;
            this.refreshSubscribers.forEach((callback) => callback(this.config.accessToken!));
            this.refreshSubscribers = [];
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.config.onUnauthorized?.();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
      refreshToken: this.config.refreshToken,
    });

    const { accessToken, refreshToken } = response.data.data;
    this.config.accessToken = accessToken;
    this.config.refreshToken = refreshToken;
    this.config.onTokenRefresh?.({ accessToken, refreshToken });
  }

  private handleError(error: AxiosError<ApiError>): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      const err = new Error(apiError.message || 'An error occurred');
      (err as any).code = apiError.code;
      (err as any).details = apiError.details;
      return err;
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }
    
    return new Error('Network error. Please check your connection.');
  }

  setAccessToken(token: string): void {
    this.config.accessToken = token;
  }

  // GET
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data!;
  }

  // POST
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  // PUT
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  // PATCH
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  // DELETE
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data!;
  }

  // GET with pagination
  async getPaginated<T>(url: string, params?: PaginationParams): Promise<PaginatedResponse<T>> {
    return this.get(url, { params });
  }
}

// ============================================================================
# EVENT BUS (Pub/Sub)
// ============================================================================

export type EventCallback<T = unknown> = (data: T) => void;

export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    const eventCallbacks = this.events.get(event);
    if (eventCallbacks) {
      eventCallbacks.delete(callback as EventCallback);
      if (eventCallbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit<T>(event: string, data?: T): void {
    const eventCallbacks = this.events.get(event);
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => callback(data as unknown));
    }
  }

  once<T>(event: string, callback: EventCallback<T>): () => void {
    const unsubscribe = this.on(event, (data: T) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }

  clear(): void {
    this.events.clear();
  }

  listeners(event: string): number {
    return this.events.get(event)?.size || 0;
  }
}

// ============================================================================
# SERVICIO DE NOTIFICACIONES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface NotificationOptions {
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export class NotificationService {
  private notifications: Notification[] = [];
  private eventBus: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    callback(this.notifications);
    
    return this.eventBus.on('notifications:change', () => {
      callback(this.notifications);
    });
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private add(notification: Omit<Notification, 'id'>): Notification {
    const notif: Notification = {
      ...notification,
      id: this.generateId(),
    };
    
    this.notifications.push(notif);
    this.eventBus.emit('notifications:change', this.notifications);

    // Auto-dismiss
    if (notification.duration !== 0) {
      setTimeout(() => this.dismiss(notif.id), notification.duration || 5000);
    }

    return notif;
  }

  dismiss(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.eventBus.emit('notifications:change', this.notifications);
  }

  dismissAll(): void {
    this.notifications = [];
    this.eventBus.emit('notifications:change', this.notifications);
  }

  info(title: string, message: string, options?: NotificationOptions): Notification {
    return this.add({ type: 'info', title, message, ...options });
  }

  success(title: string, message: string, options?: NotificationOptions): Notification {
    return this.add({ type: 'success', title, message, ...options });
  }

  warning(title: string, message: string, options?: NotificationOptions): Notification {
    return this.add({ type: 'warning', title, message, ...options });
  }

  error(title: string, message: string, options?: NotificationOptions): Notification {
    return this.add({ type: 'error', title, message, ...options });
  }
}

// ============================================================================
# SERVICIO WEBSOCKET
// ============================================================================

export interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export type WebSocketEventMap = {
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
  message: (data: unknown) => void;
  reconnect: (attempt: number) => void;
  reconnectFailed: () => void;
};

export class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private eventBus: EventBus;
  private shouldReconnect = true;

  constructor(config: WebSocketConfig, eventBus?: EventBus) {
    this.config = {
      autoConnect: true,
      reconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      ...config,
    };
    this.eventBus = eventBus || new EventBus();

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.eventBus.emit<WebSocketEventMap['connect']>('connect');
    });

    this.socket.on('disconnect', (reason: string) => {
      this.eventBus.emit<WebSocketEventMap['disconnect']>('disconnect', reason);
      
      if (this.config.reconnect && this.shouldReconnect && reason !== 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.eventBus.emit<WebSocketEventMap['error']>('error', error);
    });

    this.socket.on('message', (data: unknown) => {
      this.eventBus.emit<WebSocketEventMap['message']>('message', data);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      this.eventBus.emit<WebSocketEventMap['reconnectFailed']>('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    this.eventBus.emit<WebSocketEventMap['reconnect']>('reconnect', this.reconnectAttempts);

    const delay = this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected');
    }
  }

  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.on(event, callback);

    return () => {
      this.socket?.off(event, callback);
    };
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// ============================================================================
# SERVICIO DE ALMACENAMIENTO LOCAL
// ============================================================================

export class StorageService {
  private prefix: string;

  constructor(prefix: string = 'violet_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix));
    keys.forEach((key) => localStorage.removeItem(key));
  }

  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  // Session storage
  getSession<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  setSession<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Session storage set error:', error);
    }
  }
}

// ============================================================================
# EXPORTS
// ============================================================================

export { createDatabase } from '@violet-erp/database';
