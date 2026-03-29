import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncEngine } from '../SyncEngine';
import { localDb } from '../localDb';

// Mock localDb
vi.mock('../localDb', () => ({
  localDb: {
    sync_logs: {
      add: vi.fn(),
      where: vi.fn(),
      bulkAdd: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    products: {
      put: vi.fn(),
      delete: vi.fn(),
      bulkPut: vi.fn(),
      bulkDelete: vi.fn(),
    },
  },
}));

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn() })),
    })),
  },
}));

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isElectron', () => {
    it('should return false when electronAPI is not available', () => {
      expect(SyncEngine.isElectron()).toBe(false);
    });

    it('should return true when electronAPI is available', () => {
      (window as any).electronAPI = {};
      expect(SyncEngine.isElectron()).toBe(true);
      delete (window as any).electronAPI;
    });
  });

  describe('mutate - Web Mode', () => {
    it('should save to local DB when online', async () => {
      const payload = { name: 'Test Product', price: 100 };
      const recordId = 'test-id-123';

      const result = await SyncEngine.mutate(
        'products',
        'INSERT',
        payload,
        recordId
      );

      expect(result.success).toBe(true);
      expect(localDb.products.put).toHaveBeenCalledWith({
        ...payload,
        id: recordId,
      });
    });

    it('should queue for sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const payload = { name: 'Test Product', price: 100 };
      const recordId = 'test-id-123';

      const result = await SyncEngine.mutate(
        'products',
        'INSERT',
        payload,
        recordId
      );

      expect(result.success).toBe(true);
      expect(result.offline).toBe(true);
      expect(localDb.sync_logs.add).toHaveBeenCalled();
    });

    it('should handle DELETE action', async () => {
      const recordId = 'test-id-123';

      const result = await SyncEngine.mutate(
        'products',
        'DELETE',
        null,
        recordId
      );

      expect(result.success).toBe(true);
      expect(localDb.products.delete).toHaveBeenCalledWith(recordId);
    });

    it('should handle UPDATE action', async () => {
      const payload = { name: 'Updated Product', price: 150 };
      const recordId = 'test-id-123';

      const result = await SyncEngine.mutate(
        'products',
        'UPDATE',
        payload,
        recordId
      );

      expect(result.success).toBe(true);
      expect(localDb.products.put).toHaveBeenCalledWith({
        ...payload,
        id: recordId,
      });
    });
  });

  describe('mutateBulk - Web Mode', () => {
    it('should save multiple records to local DB', async () => {
      const payloads = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      const result = await SyncEngine.mutateBulk(
        'products',
        'INSERT',
        payloads
      );

      expect(result.success).toBe(true);
      expect(localDb.products.bulkPut).toHaveBeenCalledWith(payloads);
    });

    it('should queue multiple records when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const payloads = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      const result = await SyncEngine.mutateBulk(
        'products',
        'INSERT',
        payloads
      );

      expect(result.success).toBe(true);
      expect(result.offline).toBe(true);
      expect(localDb.sync_logs.bulkAdd).toHaveBeenCalled();
    });

    it('should handle bulk DELETE', async () => {
      const payloads = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      const result = await SyncEngine.mutateBulk(
        'products',
        'DELETE',
        payloads
      );

      expect(result.success).toBe(true);
      expect(localDb.products.bulkDelete).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('syncPending', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      await SyncEngine.syncPending();

      expect(localDb.sync_logs.where).not.toHaveBeenCalled();
    });

    it('should sync pending logs when online', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          table_name: 'products',
          record_id: 'prod-1',
          action: 'INSERT',
          payload: JSON.stringify({ name: 'Test', price: 100 }),
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
        },
      ];

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockLogs),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.syncPending();

      expect(localDb.sync_logs.where).toHaveBeenCalledWith('sync_status');
      expect(mockWhere.equals).toHaveBeenCalledWith('PENDING');
    });

    it('should mark logs as COMPLETED after successful sync', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          table_name: 'products',
          record_id: 'prod-1',
          action: 'INSERT',
          payload: JSON.stringify({ name: 'Test', price: 100 }),
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
          attempts: 0,
        },
      ];

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockLogs),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.syncPending();

      expect(localDb.sync_logs.update).toHaveBeenCalledWith('log-1', {
        sync_status: 'COMPLETED',
      });
    });

    it('should increment attempts on failure', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          table_name: 'products',
          record_id: 'prod-1',
          action: 'INSERT',
          payload: 'invalid-json', // Will cause parse error
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
          attempts: 0,
        },
      ];

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockLogs),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.syncPending();

      expect(localDb.sync_logs.update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          attempts: 1,
          last_error: expect.any(String),
        })
      );
    });

    it('should mark as FAILED after max attempts', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          table_name: 'products',
          record_id: 'prod-1',
          action: 'INSERT',
          payload: 'invalid-json',
          sync_status: 'PENDING',
          created_at: new Date().toISOString(),
          attempts: 4, // One more attempt will reach max (5)
        },
      ];

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockLogs),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.syncPending();

      expect(localDb.sync_logs.update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          sync_status: 'FAILED',
          attempts: 5,
        })
      );
    });
  });

  describe('retryFailed', () => {
    it('should reset failed logs to pending', async () => {
      const mockFailedLogs = [
        {
          id: 'log-1',
          table_name: 'products',
          record_id: 'prod-1',
          action: 'INSERT',
          payload: JSON.stringify({ name: 'Test' }),
          sync_status: 'FAILED',
          created_at: new Date().toISOString(),
          attempts: 5,
          last_error: 'Some error',
        },
      ];

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockFailedLogs),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.retryFailed();

      expect(localDb.sync_logs.update).toHaveBeenCalledWith('log-1', {
        sync_status: 'PENDING',
        attempts: 0,
        last_error: undefined,
      });
    });

    it('should not do anything if no failed logs', async () => {
      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      await SyncEngine.retryFailed();

      expect(localDb.sync_logs.update).not.toHaveBeenCalled();
    });
  });

  describe('clearOldLogs', () => {
    it('should delete completed logs older than specified days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          and: vi.fn().mockReturnValue({
            delete: vi.fn().mockResolvedValue(5), // 5 logs deleted
          }),
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      const deleted = await SyncEngine.clearOldLogs(7);

      expect(deleted).toBe(5);
      expect(localDb.sync_logs.where).toHaveBeenCalledWith('sync_status');
    });
  });

  describe('getStats', () => {
    it('should return sync statistics', async () => {
      const mockCount = vi.fn()
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(100) // completed
        .mockResolvedValueOnce(2);  // failed

      const mockWhere = {
        equals: vi.fn().mockReturnValue({
          count: mockCount,
        }),
      };

      (localDb.sync_logs.where as any).mockReturnValue(mockWhere);

      const stats = await SyncEngine.getStats();

      expect(stats).toEqual({
        pending: 5,
        completed: 100,
        failed: 2,
        total: 107,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in mutate', async () => {
      (localDb.products.put as any).mockRejectedValue(new Error('DB Error'));

      const result = await SyncEngine.mutate(
        'products',
        'INSERT',
        { name: 'Test' },
        'test-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle errors gracefully in mutateBulk', async () => {
      (localDb.products.bulkPut as any).mockRejectedValue(new Error('DB Error'));

      const result = await SyncEngine.mutateBulk(
        'products',
        'INSERT',
        [{ id: '1', name: 'Test' }]
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
