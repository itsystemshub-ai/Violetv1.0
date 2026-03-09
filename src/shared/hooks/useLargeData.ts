/**
 * Hook para manejar grandes conjuntos de datos con optimizaciones de rendimiento
 * Incluye: virtualización, paginación, caché y lazy loading
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export interface LargeDataOptions<T> {
  data: T[];
  pageSize?: number;
  virtualized?: boolean;
  cacheSize?: number;
  filterFn?: (item: T, query: string) => boolean;
  sortFn?: (a: T, b: T) => number;
}

export interface LargeDataResult<T> {
  // Datos procesados
  currentPage: T[];
  totalPages: number;
  currentPageIndex: number;
  totalItems: number;
  
  // Control de paginación
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Búsqueda y filtrado
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: T[];
  
  // Rendimiento
  isLoading: boolean;
  estimatedRenderTime: number;
  memoryUsage: number;
  
  // Utilidades
  clearCache: () => void;
  exportToCSV: () => string;
}

export function useLargeData<T>({
  data,
  pageSize = 200,
  virtualized = false,
  cacheSize = 1000,
  filterFn,
  sortFn
}: LargeDataOptions<T>): LargeDataResult<T> {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cache, setCache] = useState<Map<number, T[]>>(new Map());
  const renderStartTime = useRef<number>(0);
  const renderEndTime = useRef<number>(0);

  // Filtrar datos basados en la búsqueda
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !filterFn) {
      return data;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return data.filter(item => filterFn(item, query));
  }, [data, searchQuery, filterFn]);

  // Ordenar datos si se proporciona una función de ordenación
  const sortedData = useMemo(() => {
    if (!sortFn) {
      return filteredData;
    }
    
    return [...filteredData].sort(sortFn);
  }, [filteredData, sortFn]);

  // Calcular total de páginas
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const totalItems = sortedData.length;

  // Obtener página actual (con caché)
  const currentPage = useMemo(() => {
    if (currentPageIndex < 0 || currentPageIndex >= totalPages) {
      return [];
    }

    // Verificar caché
    if (cache.has(currentPageIndex)) {
      return cache.get(currentPageIndex)!;
    }

    // Calcular página
    const start = currentPageIndex * pageSize;
    const end = start + pageSize;
    const pageData = sortedData.slice(start, end);

    // Actualizar caché (LRU)
    if (cache.size >= cacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(currentPageIndex, pageData);
    setCache(new Map(cache));

    return pageData;
  }, [currentPageIndex, sortedData, pageSize, totalPages, cache, cacheSize]);

  // Control de navegación
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(0, Math.min(totalPages - 1, page));
    setCurrentPageIndex(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  }, [currentPageIndex]);

  const firstPage = useCallback(() => {
    setCurrentPageIndex(0);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPageIndex(totalPages - 1);
  }, [totalPages]);

  // Medir tiempo de renderizado
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      renderEndTime.current = performance.now();
    };
  }, [currentPage]);

  const estimatedRenderTime = renderEndTime.current - renderStartTime.current;

  // Calcular uso de memoria aproximado
  const memoryUsage = useMemo(() => {
    try {
      const dataSize = JSON.stringify(sortedData).length * 2; // Aproximación en bytes
      const cacheSizeBytes = Array.from(cache.values())
        .reduce((acc, page) => acc + JSON.stringify(page).length * 2, 0);
      
      return Math.round((dataSize + cacheSizeBytes) / 1024); // KB
    } catch {
      return 0;
    }
  }, [sortedData, cache]);

  // Utilidades
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const exportToCSV = useCallback(() => {
    if (sortedData.length === 0) {
      return '';
    }

    const headers = Object.keys(sortedData[0] as any).join(',');
    const rows = sortedData.map(item => 
      Object.values(item as any).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }, [sortedData]);

  return {
    currentPage,
    totalPages,
    currentPageIndex,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    searchQuery,
    setSearchQuery,
    filteredData: sortedData,
    isLoading,
    estimatedRenderTime,
    memoryUsage,
    clearCache,
    exportToCSV
  };
}

// Hook especializado para productos
export function useProductData(products: any[], pageSize = 200) {
  const filterFn = useCallback((product: any, query: string) => {
    const searchableFields = [
      'codigo', 'nombre', 'categoria', 'descripcionManguera',
      'aplicacion', 'aplicacionesDiesel', 'cauplas', 'torflex',
      'indomax', 'oem', 'supplier', 'components'
    ];

    return searchableFields.some(field => {
      const value = product[field];
      return value && String(value).toLowerCase().includes(query);
    });
  }, []);

  return useLargeData({
    data: products,
    pageSize,
    filterFn
  });
}