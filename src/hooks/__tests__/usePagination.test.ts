import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.state.currentPage).toBe(1);
      expect(result.current.state.pageSize).toBe(50);
      expect(result.current.state.totalItems).toBe(0);
      expect(result.current.state.totalPages).toBe(1);
      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(50);
    });

    it('should initialize with custom values', () => {
      const { result } = renderHook(() =>
        usePagination({
          initialPage: 2,
          initialPageSize: 25,
        })
      );

      expect(result.current.state.currentPage).toBe(2);
      expect(result.current.state.pageSize).toBe(25);
    });
  });

  describe('setTotalItems', () => {
    it('should update total items and calculate total pages', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      expect(result.current.state.totalItems).toBe(100);
      expect(result.current.state.totalPages).toBe(2); // 100 items / 50 per page
    });

    it('should calculate correct total pages for different page sizes', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPageSize: 25 })
      );

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      expect(result.current.state.totalPages).toBe(4); // 100 items / 25 per page
    });
  });

  describe('navigation', () => {
    it('should navigate to next page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      act(() => {
        result.current.actions.nextPage();
      });

      expect(result.current.state.currentPage).toBe(2);
      expect(result.current.offset).toBe(50);
    });

    it('should navigate to previous page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
        result.current.actions.setPage(2);
      });

      act(() => {
        result.current.actions.prevPage();
      });

      expect(result.current.state.currentPage).toBe(1);
      expect(result.current.offset).toBe(0);
    });

    it('should not go beyond last page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
        result.current.actions.setPage(2); // Last page
      });

      act(() => {
        result.current.actions.nextPage();
      });

      expect(result.current.state.currentPage).toBe(2);
    });

    it('should not go below first page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.prevPage();
      });

      expect(result.current.state.currentPage).toBe(1);
    });

    it('should go to first page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
        result.current.actions.setPage(2);
      });

      act(() => {
        result.current.actions.goToFirstPage();
      });

      expect(result.current.state.currentPage).toBe(1);
    });

    it('should go to last page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      act(() => {
        result.current.actions.goToLastPage();
      });

      expect(result.current.state.currentPage).toBe(2);
    });

    it('should set specific page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(200);
      });

      act(() => {
        result.current.actions.setPage(3);
      });

      expect(result.current.state.currentPage).toBe(3);
      expect(result.current.offset).toBe(100);
    });
  });

  describe('page size', () => {
    it('should change page size', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setPageSize(100);
      });

      expect(result.current.state.pageSize).toBe(100);
      expect(result.current.limit).toBe(100);
    });

    it('should reset to first page when changing page size', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(200);
        result.current.actions.setPage(3);
      });

      act(() => {
        result.current.actions.setPageSize(100);
      });

      expect(result.current.state.currentPage).toBe(1);
    });

    it('should recalculate total pages when changing page size', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      expect(result.current.state.totalPages).toBe(2); // 100 / 50

      act(() => {
        result.current.actions.setPageSize(25);
      });

      expect(result.current.state.totalPages).toBe(4); // 100 / 25
    });
  });

  describe('hasNextPage and hasPrevPage', () => {
    it('should correctly indicate if there is a next page', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.actions.setPage(2);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it('should correctly indicate if there is a previous page', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.hasPrevPage).toBe(false);

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      act(() => {
        result.current.actions.setPage(2);
      });

      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe('offset calculation', () => {
    it('should calculate correct offset for different pages', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(200);
      });

      // Page 1
      expect(result.current.offset).toBe(0);

      // Page 2
      act(() => {
        result.current.actions.setPage(2);
      });
      expect(result.current.offset).toBe(50);

      // Page 3
      act(() => {
        result.current.actions.setPage(3);
      });
      expect(result.current.offset).toBe(100);
    });

    it('should calculate correct offset with custom page size', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPageSize: 25 })
      );

      act(() => {
        result.current.actions.setTotalItems(200);
      });

      act(() => {
        result.current.actions.setPage(3);
      });

      expect(result.current.offset).toBe(50); // (3-1) * 25
    });
  });

  describe('edge cases', () => {
    it('should handle zero total items', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(0);
      });

      expect(result.current.state.totalPages).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should handle page number beyond total pages', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setTotalItems(100);
      });

      act(() => {
        result.current.actions.setPage(10); // Beyond total pages
      });

      expect(result.current.state.currentPage).toBe(2); // Should clamp to last page
    });

    it('should handle negative page number', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.actions.setPage(-1);
      });

      expect(result.current.state.currentPage).toBe(1); // Should clamp to first page
    });
  });
});
