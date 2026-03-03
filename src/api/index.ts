/**
 * API Client for Violet ERP
 * Centralizes all API calls and provides type-safe interfaces
 */

import { User, Product, Invoice, Employee, Tenant, FinancialAccount } from '@/lib';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('auth_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Authentication API
 */
export const authApi = {
  login: async (username: string, password: string) => {
    return apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
  },

  register: async (userData: Partial<User> & { password: string }) => {
    return apiFetch<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  },

  refresh: async (refreshToken: string) => {
    return apiFetch<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    );
  },

  logout: async () => {
    return apiFetch('/auth/logout', {
      method: 'POST',
    });
  },
};

/**
 * Products API
 */
export const productsApi = {
  getAll: async (tenantId: string) => {
    return apiFetch<Product[]>(`/products?tenantId=${tenantId}`);
  },

  getById: async (id: string) => {
    return apiFetch<Product>(`/products/${id}`);
  },

  create: async (product: Omit<Product, 'id'>) => {
    return apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  update: async (id: string, product: Partial<Product>) => {
    return apiFetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  search: async (query: string, tenantId: string) => {
    return apiFetch<Product[]>(
      `/products/search?q=${encodeURIComponent(query)}&tenantId=${tenantId}`
    );
  },
};

/**
 * Invoices API
 */
export const invoicesApi = {
  getAll: async (tenantId: string, type?: Invoice['type']) => {
    const params = new URLSearchParams({ tenantId });
    if (type) params.append('type', type);
    return apiFetch<Invoice[]>(`/invoices?${params}`);
  },

  getById: async (id: string) => {
    return apiFetch<Invoice>(`/invoices/${id}`);
  },

  create: async (invoice: Omit<Invoice, 'id'>) => {
    return apiFetch<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  },

  update: async (id: string, invoice: Partial<Invoice>) => {
    return apiFetch<Invoice>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  convertToOrder: async (quoteId: string) => {
    return apiFetch<Invoice>(`/invoices/${quoteId}/convert-to-order`, {
      method: 'POST',
    });
  },
};

/**
 * Employees API
 */
export const employeesApi = {
  getAll: async (tenantId: string) => {
    return apiFetch<Employee[]>(`/employees?tenantId=${tenantId}`);
  },

  getById: async (id: string) => {
    return apiFetch<Employee>(`/employees/${id}`);
  },

  create: async (employee: Omit<Employee, 'id'>) => {
    return apiFetch<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  update: async (id: string, employee: Partial<Employee>) => {
    return apiFetch<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Tenants API
 */
export const tenantsApi = {
  getAll: async () => {
    return apiFetch<Tenant[]>('/tenants');
  },

  getById: async (id: string) => {
    return apiFetch<Tenant>(`/tenants/${id}`);
  },

  create: async (tenant: Omit<Tenant, 'id'>) => {
    return apiFetch<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(tenant),
    });
  },

  update: async (id: string, tenant: Partial<Tenant>) => {
    return apiFetch<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tenant),
    });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/tenants/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Financial Accounts API
 */
export const accountsApi = {
  getAll: async (tenantId: string) => {
    return apiFetch<FinancialAccount[]>(`/accounts?tenantId=${tenantId}`);
  },

  getById: async (id: string) => {
    return apiFetch<FinancialAccount>(`/accounts/${id}`);
  },

  create: async (account: Omit<FinancialAccount, 'id'>) => {
    return apiFetch<FinancialAccount>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  },

  update: async (id: string, account: Partial<FinancialAccount>) => {
    return apiFetch<FinancialAccount>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  },

  delete: async (id: string) => {
    return apiFetch<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  getBalance: async (accountId: string) => {
    return apiFetch<{ balance: number }>(`/accounts/${accountId}/balance`);
  },
};

/**
 * Export all APIs
 */
export const api = {
  auth: authApi,
  products: productsApi,
  invoices: invoicesApi,
  employees: employeesApi,
  tenants: tenantsApi,
  accounts: accountsApi,
};

export default api;
