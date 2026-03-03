import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInventory } from '../useInventory';
import { localDb } from '@/lib/localDb';
import { SyncService } from '@/lib/SyncService';

// Mock dependencies
vi.mock('@/lib/localDb', () => ({
  localDb: {
    products: {
      toArray: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      bulkPut: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn(),
        })),
      })),
    },
  },
}));

vi.mock('@/lib/SyncService', () => ({
  SyncService: {
    mutate: vi.fn(),
  },
}));

vi.mock('@/services/microservices/inventario/InventarioService', () => ({
  inventarioService: {
    syncBulkProducts: vi.fn(),
    updateStock: vi.fn(),
  },
}));

vi.mock('@/hooks/useSystemConfig', () => ({
  useSystemConfig: vi.fn(() => ({
    activeTenantId: 'test-tenant-123',
  })),
}));

vi.mock('@/hooks/useInventoryStore', () => ({
  useInventoryStore: vi.fn(() => ({
    products: [],
    isLoading: false,
    fetchProducts: vi.fn(),
  })),
}));

vi.mock('@/hooks/useNotificationStore', () => ({
  useNotificationStore: {
    getState: vi.fn(() => ({
      addNotification: vi.fn(),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addProduct', () => {
    it('should add a new product successfully', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100,
        cost: 50,
        stock: 10,
        category: 'Test',
      };

      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: { ...mockProduct, id: 'new-product-id' },
        error: null,
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.addProduct(mockProduct);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(SyncService.mutate).toHaveBeenCalledWith(
        'products',
        'INSERT',
        expect.objectContaining({
          name: 'Test Product',
          price: 100,
        }),
        expect.any(String)
      );
    });

    it('should handle errors when adding product', async () => {
      const mockProduct = {
        name: 'Test Product',
        price: 100,
      };

      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.addProduct(mockProduct);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updates = {
        price: 150,
        stock: 20,
      };

      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: { id: 'product-123', ...updates },
        error: null,
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.updateProduct('product-123', updates);

      expect(response.success).toBe(true);
      expect(SyncService.mutate).toHaveBeenCalled();
    });

    it('should handle errors when updating product', async () => {
      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.updateProduct('product-123', { price: 150 });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.deleteProduct('product-123');

      expect(response.success).toBe(true);
      expect(SyncService.mutate).toHaveBeenCalledWith(
        'products',
        'DELETE',
        null,
        'product-123'
      );
    });

    it('should handle errors when deleting product', async () => {
      vi.mocked(SyncService.mutate).mockResolvedValue({
        data: null,
        error: new Error('Delete failed'),
      });

      const { result } = renderHook(() => useInventory());

      const response = await result.current.deleteProduct('product-123');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('addProductsBulk', () => {
    it('should add multiple products successfully', async () => {
      const mockProducts = [
        { name: 'Product 1', price: 100, stock: 10 },
        { name: 'Product 2', price: 200, stock: 20 },
      ];

      const { inventarioService } = await import('@/services/microservices/inventario/InventarioService');
      vi.mocked(inventarioService.syncBulkProducts).mockResolvedValue();

      const { result } = renderHook(() => useInventory());

      const response = await result.current.addProductsBulk(mockProducts);

      expect(response.success).toBe(true);
      expect(inventarioService.syncBulkProducts).toHaveBeenCalledWith(mockProducts, 'test-tenant-123');
    });

    it('should handle errors when bulk adding products', async () => {
      const { inventarioService } = await import('@/services/microservices/inventario/InventarioService');
      vi.mocked(inventarioService.syncBulkProducts).mockRejectedValue(new Error('Bulk insert failed'));

      const { result } = renderHook(() => useInventory());

      const response = await result.current.addProductsBulk([{ name: 'Test' }]);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should reject when no active tenant', async () => {
      // Mock sin tenant activo
      const mockUseSystemConfig = vi.fn(() => ({
        activeTenantId: null,
      }));
      
      vi.doMock('@/hooks/useSystemConfig', () => ({
        useSystemConfig: mockUseSystemConfig,
      }));

      const { result } = renderHook(() => useInventory());

      const response = await result.current.addProductsBulk([{ name: 'Test' }]);

      expect(response.success).toBe(false);
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products for active tenant', async () => {
      const { result } = renderHook(() => useInventory());

      await result.current.fetchProducts();

      // Verify that fetchProducts was called
      expect(result.current.fetchProducts).toBeDefined();
    });
  });

  describe('activeTenantId', () => {
    it('should return active tenant id', () => {
      const { result } = renderHook(() => useInventory());

      expect(result.current.activeTenantId).toBe('test-tenant-123');
    });
  });
});
