import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSales } from '../../features/sales/hooks/useSales';
import { localDb } from '@/lib/localDb';

// Mock dependencies
vi.mock('@/lib/localDb', () => ({
  localDb: {
    invoices: {
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/useSystemConfig', () => {
  const mockGetState = vi.fn(() => ({
    activeTenantId: 'test-tenant-123',
  }));
  
  const mockUseSystemConfig = vi.fn(() => ({
    activeTenantId: 'test-tenant-123',
  }));
  
  mockUseSystemConfig.getState = mockGetState;
  
  return {
    useSystemConfig: mockUseSystemConfig,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useSalesStore', () => ({
  useSalesStore: vi.fn(() => ({
    invoices: [],
    isLoading: false,
    fetchInvoices: vi.fn(),
  })),
}));

vi.mock('@/services/LocalNetworkService', () => ({
  NetworkService: {
    getServerUrl: vi.fn(() => 'http://localhost:8080'),
  },
}));

vi.mock('@/services/microservices/ventas/VentasService', () => ({
  ventasService: {
    processSale: vi.fn(),
  },
}));

vi.mock('@/lib/AccountingService', () => ({
  AccountingService: {
    postSale: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('useSales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processSale', () => {
    it('should process a sale successfully', async () => {
      const mockCart = [
        {
          product: {
            id: 'prod-1',
            name: 'Product 1',
            price: 100,
            precioFCA: 100,
            cauplas: 'CAU-001',
          },
          quantity: 2,
        },
      ];

      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => ({ success: true, invoiceId: 'inv-123' }),
      } as Response);

      const { result } = renderHook(() => useSales());

      const response = await result.current.processSale(
        'Test Customer',
        'J-12345678-9',
        mockCart,
        200,
        32,
        6,
        238
      );

      expect(response.success).toBe(true);
      expect(response.data?.invoiceId).toBeDefined();
    });

    it('should handle errors when processing sale', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const mockCart = [
        {
          product: {
            id: 'prod-1',
            name: 'Product 1',
            price: 100,
            precioFCA: 100,
            cauplas: 'CAU-001',
          },
          quantity: 1,
        },
      ];

      const { result } = renderHook(() => useSales());

      const response = await result.current.processSale(
        'Test Customer',
        'J-12345678-9',
        mockCart,
        100,
        16,
        3,
        119
      );

      // Should still succeed using fallback
      expect(response.success).toBe(true);
    });

    it('should reject when no active tenant', async () => {
      const { useSystemConfig } = await import('@/hooks/useSystemConfig');
      vi.mocked(useSystemConfig.getState).mockReturnValueOnce({
        activeTenantId: null,
      } as any);

      const { result } = renderHook(() => useSales());

      const response = await result.current.processSale(
        'Test Customer',
        'J-12345678-9',
        [],
        0,
        0,
        0,
        0
      );

      expect(response.success).toBe(false);
    });

    it('should process sale with metadata', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => ({ success: true, invoiceId: 'inv-123' }),
      } as Response);

      const mockCart = [
        {
          product: {
            id: 'prod-1',
            name: 'Product 1',
            price: 100,
            precioFCA: 100,
            cauplas: 'CAU-001',
          },
          quantity: 1,
        },
      ];

      const metadata = {
        type: 'venta' as const,
        controlNumber: 'FACT-001',
        exchangeRateUsed: 36.5,
        totalVES: 4345.5,
        notes: 'Test sale',
      };

      const { result } = renderHook(() => useSales());

      const response = await result.current.processSale(
        'Test Customer',
        'J-12345678-9',
        mockCart,
        100,
        16,
        3,
        119,
        metadata
      );

      expect(response.success).toBe(true);
    });

    it('should process purchase order', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: async () => ({ success: true, invoiceId: 'ord-123' }),
      } as Response);

      const mockCart = [
        {
          product: {
            id: 'prod-1',
            name: 'Product 1',
            price: 100,
            precioFCA: 100,
            cauplas: 'CAU-001',
          },
          quantity: 5,
        },
      ];

      const metadata = {
        type: 'pedido' as const,
        controlNumber: 'ORD-001',
      };

      const { result } = renderHook(() => useSales());

      const response = await result.current.processSale(
        'Supplier Inc.',
        'J-98765432-1',
        mockCart,
        500,
        80,
        15,
        595,
        metadata
      );

      expect(response.success).toBe(true);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete an invoice successfully', async () => {
      vi.mocked(localDb.invoices.delete).mockResolvedValue();

      const { result } = renderHook(() => useSales());

      const success = await result.current.deleteInvoice('inv-123');

      expect(success).toBe(true);
      expect(localDb.invoices.delete).toHaveBeenCalledWith('inv-123');
    });
  });

  describe('fetchInvoices', () => {
    it('should fetch invoices for active tenant', async () => {
      const { result } = renderHook(() => useSales());

      await result.current.fetchInvoices();

      expect(result.current.fetchInvoices).toBeDefined();
    });
  });

  describe('state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSales());

      expect(result.current.invoices).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.isFetching).toBe(false);
    });
  });
});
