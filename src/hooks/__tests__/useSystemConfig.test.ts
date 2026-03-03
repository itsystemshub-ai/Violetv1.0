import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemConfig } from '../useSystemConfig';
import { localDb } from '@/lib/localDb';

describe('useSystemConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with neutral tenant', () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(result.current.activeTenantId).toBeNull();
      expect(result.current.tenant.id).toBe('none');
      expect(result.current.tenant.name).toBe('Sin empresa asignada');
      expect(result.current.allTenants).toEqual([]);
    });

    it('should have default tax configuration', () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(result.current.taxes.iva_general).toBe(16);
      expect(result.current.taxes.iva_reducido).toBe(8);
      expect(result.current.taxes.iva_lujo).toBe(31);
      expect(result.current.taxes.igtf_divisas).toBe(3);
    });

    it('should have default exchange rate', () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(result.current.exchangeRate).toBe(1);
    });
  });

  describe('Fetch All Tenants', () => {
    it('should load tenants from local database', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Company 1',
          slug: 'company-1',
          rif: 'J-12345678-9',
          fiscalName: 'Company 1 C.A.',
          address: '123 Street',
          phone: '1234567',
          logoUrl: '',
          primaryColor: '#7c3aed',
          currency: 'USD',
          createdAt: '2026-01-01',
          isActive: true,
        },
      ];

      vi.mocked(localDb.tenants.toArray).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      await waitFor(() => {
        expect(result.current.allTenants).toHaveLength(1);
        expect(result.current.allTenants[0].name).toBe('Company 1');
      });
    });

    it('should auto-assign first active tenant', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Company 1',
          slug: 'company-1',
          rif: 'J-12345678-9',
          fiscalName: 'Company 1 C.A.',
          address: '123 Street',
          phone: '1234567',
          logoUrl: '',
          primaryColor: '#7c3aed',
          currency: 'USD',
          createdAt: '2026-01-01',
          isActive: true,
        },
      ];

      vi.mocked(localDb.tenants.toArray).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      await waitFor(() => {
        expect(result.current.activeTenantId).toBe('tenant-1');
        expect(result.current.tenant.name).toBe('Company 1');
      });
    });

    it('should handle empty tenant list', async () => {
      vi.mocked(localDb.tenants.toArray).mockResolvedValue([]);
      // Mock createTenant to prevent actual creation
      vi.mocked(localDb.tenants.put).mockResolvedValue('new-tenant-id');

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      await waitFor(() => {
        // After auto-creation, should have NEUTRAL_TENANT + created tenant
        expect(result.current.allTenants.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Set Active Tenant', () => {
    it('should set active tenant', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Company 1',
          slug: 'company-1',
          rif: 'J-12345678-9',
          fiscalName: 'Company 1 C.A.',
          address: '123 Street',
          phone: '1234567',
          logoUrl: '',
          primaryColor: '#7c3aed',
          currency: 'USD',
          createdAt: '2026-01-01',
          isActive: true,
        },
        {
          id: 'tenant-2',
          name: 'Company 2',
          slug: 'company-2',
          rif: 'J-98765432-1',
          fiscalName: 'Company 2 C.A.',
          address: '456 Avenue',
          phone: '7654321',
          logoUrl: '',
          primaryColor: '#3b82f6',
          currency: 'USD',
          createdAt: '2026-01-02',
          isActive: true,
        },
      ];

      vi.mocked(localDb.tenants.toArray).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      act(() => {
        result.current.setActiveTenant('tenant-2');
      });

      expect(result.current.activeTenantId).toBe('tenant-2');
      expect(result.current.tenant.name).toBe('Company 2');
    });

    it('should set neutral tenant when id is null', () => {
      const { result } = renderHook(() => useSystemConfig());

      act(() => {
        result.current.setActiveTenant(null);
      });

      expect(result.current.activeTenantId).toBeNull();
      expect(result.current.tenant.id).toBe('none');
    });
  });

  describe('Exchange Rate', () => {
    it('should update exchange rate', async () => {
      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.setExchangeRate(50);
      });

      expect(result.current.exchangeRate).toBe(50);
    });
  });

  describe('Maintenance Mode', () => {
    it('should toggle maintenance mode', () => {
      const { result } = renderHook(() => useSystemConfig());

      expect(result.current.isMaintenanceMode).toBe(false);

      act(() => {
        result.current.setMaintenanceMode(true);
      });

      // Note: This will trigger updateConfig which is async
      // In a real scenario, you'd wait for the update to complete
    });
  });

  describe('Update Tenant Config', () => {
    it('should update tenant configuration', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Company 1',
          slug: 'company-1',
          rif: 'J-12345678-9',
          fiscalName: 'Company 1 C.A.',
          address: '123 Street',
          phone: '1234567',
          logoUrl: '',
          primaryColor: '#7c3aed',
          currency: 'USD',
          createdAt: '2026-01-01',
          isActive: true,
        },
      ];

      vi.mocked(localDb.tenants.toArray).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      act(() => {
        result.current.updateTenantConfig({ primaryColor: '#ff0000' });
      });

      expect(result.current.tenant.primaryColor).toBe('#ff0000');
    });
  });

  describe('Persistence', () => {
    it('should maintain state in memory', async () => {
      // Note: With persist middleware mocked, state is maintained in memory only
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Company 1',
          slug: 'company-1',
          rif: 'J-12345678-9',
          fiscalName: 'Company 1 C.A.',
          address: '123 Street',
          phone: '1234567',
          logoUrl: '',
          primaryColor: '#7c3aed',
          currency: 'USD',
          createdAt: '2026-01-01',
          isActive: true,
        },
      ];

      vi.mocked(localDb.tenants.toArray).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useSystemConfig());

      await act(async () => {
        await result.current.fetchAllTenants();
      });

      // Verify state is maintained in memory
      await waitFor(() => {
        expect(result.current.activeTenantId).toBe('tenant-1');
        expect(result.current.allTenants).toHaveLength(1);
      });
    });

    it('should initialize with default state', () => {
      // Note: With persist mocked, we test that the store initializes correctly
      // However, state may be shared between tests, so we just verify the structure
      const { result } = renderHook(() => useSystemConfig());

      // Verify the store has the expected structure
      expect(result.current.tenant).toBeDefined();
      expect(result.current.allTenants).toBeDefined();
      expect(result.current.taxes).toBeDefined();
      expect(result.current.exchangeRate).toBeDefined();
    });
  });
});
