import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        {children}
      </HashRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper to wait for async updates
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  name: 'Test User',
  role: 'admin' as const,
  tenantId: 'test-tenant-id',
  avatarUrl: 'https://example.com/avatar.png',
  is2FAEnabled: false,
  permissions: ['view:dashboard', 'view:inventory', 'inventory:read'],
  isSuperAdmin: false,
};

// Mock super admin user
export const mockSuperAdmin = {
  ...mockUser,
  id: 'super-admin-id',
  username: 'superadmin',
  name: 'Super Administrator',
  role: 'super_admin' as const,
  isSuperAdmin: true,
  permissions: [
    'view:dashboard',
    'view:finance',
    'view:inventory',
    'view:sales',
    'view:purchases',
    'view:hr',
    'view:settings',
    'finance:read',
    'finance:create',
    'finance:edit',
    'finance:delete',
    'inventory:read',
    'inventory:create',
    'inventory:edit',
    'inventory:delete',
    'sales:read',
    'sales:create',
    'sales:edit',
    'sales:delete',
    'system:superadmin',
  ],
};

// Mock tenant data
export const mockTenant = {
  id: 'test-tenant-id',
  name: 'Test Company',
  slug: 'test-company',
  rif: 'J-12345678-9',
  fiscalName: 'Test Company C.A.',
  address: '123 Test Street',
  phone: '+58 212 1234567',
  email: 'test@company.com',
  logoUrl: 'https://example.com/logo.png',
  primaryColor: '#7c3aed',
  currency: 'USD',
  createdAt: '2026-01-01T00:00:00.000Z',
  isActive: true,
};

// Mock product data
export const mockProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  description: 'A test product',
  price: 100,
  cost: 50,
  stock: 10,
  minStock: 5,
  unit: 'unidad',
  category: 'Test Category',
  warehouseId: 'test-warehouse-id',
  status: 'disponible' as const,
  tenant_id: 'test-tenant-id',
  images: [],
  updated_at: '2026-01-01T00:00:00.000Z',
};

// Mock invoice data
export const mockInvoice = {
  id: 'test-invoice-id',
  tenant_id: 'test-tenant-id',
  number: 'INV-001',
  customerName: 'Test Customer',
  customerRif: 'V-12345678',
  date: '2026-01-01',
  subtotal: 100,
  taxTotal: 16,
  total: 116,
  status: 'pagada' as const,
  type: 'venta' as const,
  items: [
    {
      productId: 'test-product-id',
      name: 'Test Product',
      quantity: 1,
      price: 100,
      tax: 16,
      total: 116,
    },
  ],
};

// Helper to mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
};

// Helper to setup auth state
export const setupAuthState = (user = mockUser) => {
  const authState = {
    state: {
      user,
      isAuthenticated: true,
      sessionToken: 'test-token',
    },
    version: 0,
  };
  localStorage.setItem('violet-auth-context', JSON.stringify(authState));
};

// Helper to setup system config state
export const setupSystemConfigState = (tenant = mockTenant) => {
  const configState = {
    state: {
      activeTenantId: tenant.id,
      tenant,
      allTenants: [tenant],
    },
    version: 0,
  };
  localStorage.setItem('violet-system-config', JSON.stringify(configState));
};
