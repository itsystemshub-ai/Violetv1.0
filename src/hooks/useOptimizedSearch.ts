import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Hook optimizado para búsquedas con debounce y filtrado
 * Evita búsquedas excesivas y mejora el rendimiento
 */

export interface SearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
  caseSensitive?: boolean;
}

export function useOptimizedSearch<T>({
  data,
  searchFields,
  debounceMs = 300,
  caseSensitive = false,
}: SearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Memoizar resultados de búsqueda para evitar recálculos
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return data;
    }

    const term = caseSensitive 
      ? debouncedSearchTerm 
      : debouncedSearchTerm.toLowerCase();

    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;

        const stringValue = String(value);
        const searchValue = caseSensitive 
          ? stringValue 
          : stringValue.toLowerCase();

        return searchValue.includes(term);
      });
    });
  }, [data, debouncedSearchTerm, searchFields, caseSensitive]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isSearching: searchTerm !== debouncedSearchTerm,
    resultCount: filteredData.length,
  };
}
