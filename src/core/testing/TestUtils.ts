/**
 * TestUtils - Utilidades para testing de componentes y lógica de negocio
 * Incluye: mocks, test helpers, assertions, setup/teardown
 */

// ===== MOCKS Y STUBS =====

export interface MockConfig {
  delay?: number;
  shouldFail?: boolean;
  failWith?: Error;
  returnValue?: any;
}

export class MockService {
  private calls: Array<{ method: string; args: any[]; timestamp: number }> = [];
  private configs: Map<string, MockConfig> = new Map();

  constructor(private serviceName: string) {}

  public mockMethod(methodName: string, config: MockConfig = {}): jest.Mock {
    const mock = jest.fn(async (...args: any[]) => {
      // Registrar llamada
      this.calls.push({
        method: methodName,
        args,
        timestamp: Date.now()
      });

      // Aplicar delay si está configurado
      if (config.delay) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }

      // Fallar si está configurado
      if (config.shouldFail) {
        throw config.failWith || new Error(`Mock error in ${this.serviceName}.${methodName}`);
      }

      // Retornar valor configurado o args
      return config.returnValue !== undefined ? config.returnValue : args;
    });

    this.configs.set(methodName, config);
    return mock;
  }

  public getCalls(methodName?: string): Array<{ method: string; args: any[]; timestamp: number }> {
    if (methodName) {
      return this.calls.filter(call => call.method === methodName);
    }
    return [...this.calls];
  }

  public clearCalls(): void {
    this.calls = [];
  }

  public wasCalled(methodName: string, times?: number): boolean {
    const calls = this.getCalls(methodName);
    if (times !== undefined) {
      return calls.length === times;
    }
    return calls.length > 0;
  }

  public wasCalledWith(methodName: string, ...args: any[]): boolean {
    const calls = this.getCalls(methodName);
    return calls.some(call => this.deepEqual(call.args, args));
  }

  private deepEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

// ===== TEST HELPERS =====

export function createTestProduct(overrides: any = {}): any {
  const baseProduct = {
    id: `test-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cauplas: `TEST-${Math.floor(Math.random() * 10000)}`,
    descripcionManguera: 'Producto de prueba para testing',
    precioFCA: 100 + Math.floor(Math.random() * 900),
    stock: 10 + Math.floor(Math.random() * 90),
    categoria: 'TEST',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return { ...baseProduct, ...overrides };
}

export function createTestProducts(count: number, overrides: any = {}): any[] {
  return Array.from({ length: count }, (_, index) => 
    createTestProduct({ 
      ...overrides,
      cauplas: `TEST-${index + 1}`,
      descripcionManguera: `Producto de prueba ${index + 1}`
    })
  );
}

export function createTestOrder(overrides: any = {}): any {
  const baseOrder = {
    id: `test-order-${Date.now()}`,
    customerId: 'test-customer-123',
    customerName: 'Cliente de Prueba',
    items: [
      {
        productId: 'test-product-1',
        productName: 'Producto de Prueba 1',
        quantity: 2,
        price: 100,
        subtotal: 200
      }
    ],
    subtotal: 200,
    tax: 32,
    total: 232,
    status: 'pending' as const,
    paymentMethod: 'cash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return { ...baseOrder, ...overrides };
}

export function createTestUser(overrides: any = {}): any {
  const baseUser = {
    id: `test-user-${Date.now()}`,
    email: 'test@example.com',
    name: 'Usuario de Prueba',
    role: 'user' as const,
    tenantId: 'test-tenant',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  return { ...baseUser, ...overrides };
}

// ===== ASSERTIONS =====

export function assertProductValid(product: any): void {
  expect(product).toBeDefined();
  expect(product.id).toBeDefined();
  expect(product.cauplas).toBeDefined();
  expect(product.descripcionManguera).toBeDefined();
  expect(product.precioFCA).toBeDefined();
  expect(product.stock).toBeDefined();
  expect(product.categoria).toBeDefined();
  expect(product.status).toBeDefined();
  
  // Validaciones específicas
  expect(typeof product.precioFCA).toBe('number');
  expect(product.precioFCA).toBeGreaterThan(0);
  expect(typeof product.stock).toBe('number');
  expect(product.stock).toBeGreaterThanOrEqual(0);
  expect(['active', 'inactive', 'disponible', 'poco_stock', 'agotado', 'descontinuado']).toContain(product.status);
}

export function assertOrderValid(order: any): void {
  expect(order).toBeDefined();
  expect(order.id).toBeDefined();
  expect(order.customerId).toBeDefined();
  expect(order.items).toBeDefined();
  expect(Array.isArray(order.items)).toBe(true);
  expect(order.subtotal).toBeDefined();
  expect(order.tax).toBeDefined();
  expect(order.total).toBeDefined();
  expect(order.status).toBeDefined();
  expect(order.paymentMethod).toBeDefined();
  
  // Validaciones específicas
  expect(typeof order.subtotal).toBe('number');
  expect(order.subtotal).toBeGreaterThanOrEqual(0);
  expect(typeof order.tax).toBe('number');
  expect(order.tax).toBeGreaterThanOrEqual(0);
  expect(typeof order.total).toBe('number');
  expect(order.total).toBeGreaterThanOrEqual(0);
  expect(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).toContain(order.status);
}

export function assertUserValid(user: any): void {
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
  expect(user.email).toBeDefined();
  expect(user.name).toBeDefined();
  expect(user.role).toBeDefined();
  expect(user.tenantId).toBeDefined();
  expect(user.isActive).toBeDefined();
  
  // Validaciones específicas
  expect(typeof user.email).toBe('string');
  expect(user.email).toContain('@');
  expect(['admin', 'user', 'manager', 'viewer']).toContain(user.role);
  expect(typeof user.isActive).toBe('boolean');
}

// ===== SETUP Y TEARDOWN =====

export interface TestContext {
  mocks: Map<string, MockService>;
  testData: Map<string, any[]>;
  cleanupFunctions: Array<() => void | Promise<void>>;
}

export function createTestContext(): TestContext {
  return {
    mocks: new Map(),
    testData: new Map(),
    cleanupFunctions: []
  };
}

export function setupTest(context: TestContext): void {
  // Configurar mocks globales
  setupGlobalMocks(context);
  
  // Configurar localStorage de prueba
  setupTestLocalStorage();
  
  // Configurar fetch mock
  setupFetchMock();
}

export function teardownTest(context: TestContext): void {
  // Ejecutar funciones de cleanup
  context.cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.warn('Error durante cleanup:', error);
    }
  });
  
  // Limpiar localStorage
  clearTestLocalStorage();
  
  // Restaurar fetch original
  restoreFetch();
}

function setupGlobalMocks(context: TestContext): void {
  // Mock de console para tests
  const originalConsole = { ...console };
  const mockConsole = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
  
  Object.assign(console, mockConsole);
  
  context.cleanupFunctions.push(() => {
    Object.assign(console, originalConsole);
  });
}

function setupTestLocalStorage(): void {
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem(key: string): string | null {
      return this.store[key] || null;
    },
    setItem(key: string, value: string): void {
      this.store[key] = value;
    },
    removeItem(key: string): void {
      delete this.store[key];
    },
    clear(): void {
      this.store = {};
    },
    key(index: number): string | null {
      return Object.keys(this.store)[index] || null;
    },
    get length(): number {
      return Object.keys(this.store).length;
    }
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
}

function clearTestLocalStorage(): void {
  if (window.localStorage) {
    window.localStorage.clear();
  }
}

function setupFetchMock(): void {
  const originalFetch = window.fetch;
  
  window.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Mock para endpoints específicos
    if (url.includes('/api/products')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: createTestProducts(10) })
      } as Response);
    }
    
    if (url.includes('/api/orders')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: [createTestOrder()] })
      } as Response);
    }
    
    // Fallback a fetch original
    return originalFetch(input, init);
  });
}

function restoreFetch(): void {
  // @ts-ignore
  if (window.fetch?.mockRestore) {
    // @ts-ignore
    window.fetch.mockRestore();
  }
}

// ===== UTILIDADES PARA COMPONENTES REACT =====

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export interface ComponentTestConfig {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  providers?: Record<string, any>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  config: ComponentTestConfig = {}
) {
  const { wrapper: Wrapper, providers = {} } = config;
  
  let wrappedUi = ui;
  
  // Aplicar providers en orden
  const providerEntries = Object.entries(providers);
  for (const [Provider, value] of providerEntries.reverse()) {
    wrappedUi = React.createElement(
      Provider as any,
      { value },
      wrappedUi
    );
  }
  
  // Aplicar wrapper final si existe
  if (Wrapper) {
    wrappedUi = React.createElement(Wrapper, {}, wrappedUi);
  }
  
  return render(wrappedUi);
}

export async function fillForm(inputs: Record<string, string>): Promise<void> {
  const user = userEvent.setup();
  
  for (const [name, value] of Object.entries(inputs)) {
    const input = screen.getByLabelText(new RegExp(name, 'i')) || 
                  screen.getByPlaceholderText(new RegExp(name, 'i')) ||
                  screen.getByRole('textbox', { name: new RegExp(name, 'i') });
    
    await user.clear(input);
    await user.type(input, value);
  }
}

export async function submitForm(): Promise<void> {
  const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
  const user = userEvent.setup();
  await user.click(submitButton);
}

export function mockRouter(): void {
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/test' }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), jest.fn()]
  }));
}

export function mockAuth(): void {
  jest.mock('@/modules/auth/hooks/useAuth', () => ({
    useAuth: () => ({
      user: createTestUser(),
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    })
  }));
}

export function mockInventory(): void {
  jest.mock('@/modules/inventory/hooks/useInventory', () => ({
    useInventory: () => ({
      products: createTestProducts(50),
      isLoading: false,
      fetchProducts: jest.fn(),
      addProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn()
    })
  }));
}

// ===== UTILIDADES PARA PERFORMANCE TESTING =====

export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  iterations: number = 1
): Promise<{ result: T; averageTime: number; totalTime: number }> {
  const times: number[] = [];
  let result: T;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    result = await (typeof fn === 'function' ? fn() : fn);
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  
  console.log(`⏱️  [Performance Test] ${name}:`);
  console.log(`  Iterations: ${iterations}`);
  console.log(`  Average time: ${averageTime.toFixed(2)}ms`);
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Min time: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`  Max time: ${Math.max(...times).toFixed(2)}ms`);
  
  return { result: result!, averageTime, totalTime };
}

// ===== EXPORTACIONES PRINCIPALES =====

export default {
  // Mocks
  MockService,
  
  // Test data creators
  createTestProduct,
  createTestProducts,
  createTestOrder,
  createTestUser,
  
  // Assertions
  assertProductValid,
  assertOrderValid,
  assertUserValid,
  
  // Test context
  createTestContext,
  setupTest,
  teardownTest,
  
  // React testing
  renderWithProviders,
  fillForm,
  submitForm,
  mockRouter,
  mockAuth,
  mockInventory,
  
  // Performance testing
  measurePerformance
};