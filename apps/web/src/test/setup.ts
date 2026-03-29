import { expect, afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// ============================================================================
// CRITICAL: Mock Zustand persist middleware BEFORE any imports
// This prevents the "storage.setItem is not a function" error
// ============================================================================
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => config, // Bypass persist in tests
  subscribeWithSelector: (config: any) => config, // Bypass subscribeWithSelector
  devtools: (config: any) => config, // Bypass devtools
  createJSONStorage: () => ({
    getItem: (name: string) => {
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: (name: string, value: any) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
      localStorage.removeItem(name);
    },
  }),
}));

// Complete localStorage mock compatible with Zustand
class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  // Make it iterable for Zustand
  [Symbol.iterator]() {
    return this.store[Symbol.iterator]();
  }
}

// Setup before all tests
beforeAll(() => {
  const localStorageMock = new LocalStorageMock();
  const sessionStorageMock = new LocalStorageMock();

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock Dexie/IndexedDB
vi.mock('@/lib/localDb', () => ({
  localDb: {
    products: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      put: vi.fn(() => Promise.resolve()),
      add: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      bulkPut: vi.fn(() => Promise.resolve()),
    },
    invoices: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      put: vi.fn(() => Promise.resolve()),
      add: vi.fn(() => Promise.resolve()),
    },
    tenants: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      put: vi.fn(() => Promise.resolve()),
      add: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      bulkPut: vi.fn(() => Promise.resolve()),
    },
    profiles: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
    },
    employees: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
    },
    financial_accounts: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
    },
    sys_config: {
      toArray: vi.fn(() => Promise.resolve([])),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(() => Promise.resolve([])),
        })),
      })),
      put: vi.fn(() => Promise.resolve()),
      bulkPut: vi.fn(() => Promise.resolve()),
    },
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
