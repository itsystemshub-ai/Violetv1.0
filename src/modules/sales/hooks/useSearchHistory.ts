/**
 * useSearchHistory - Hook para gestionar historial de búsquedas
 * Características:
 * - Persistencia en localStorage
 * - Límite configurable de items
 * - Búsquedas frecuentes
 * - Limpieza automática
 */

import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number; // Número de veces buscado
}

interface UseSearchHistoryOptions {
  key?: string;
  maxItems?: number;
  expirationDays?: number;
}

export const useSearchHistory = (options: UseSearchHistoryOptions = {}) => {
  const {
    key = 'search_history',
    maxItems = 10,
    expirationDays = 30,
  } = options;

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: SearchHistoryItem[] = JSON.parse(stored);
        
        // Filtrar items expirados
        const now = Date.now();
        const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
        const valid = parsed.filter(
          item => now - item.timestamp < expirationMs
        );
        
        setHistory(valid);
        
        // Actualizar localStorage si se eliminaron items
        if (valid.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(valid));
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, [key, expirationDays]);

  // Agregar búsqueda al historial
  const addSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;

    setHistory(prev => {
      // Buscar si ya existe
      const existingIndex = prev.findIndex(
        item => item.query.toLowerCase() === query.toLowerCase()
      );

      let newHistory: SearchHistoryItem[];

      if (existingIndex >= 0) {
        // Actualizar existente (incrementar count y timestamp)
        newHistory = [...prev];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          timestamp: Date.now(),
          count: newHistory[existingIndex].count + 1,
        };
      } else {
        // Agregar nuevo
        newHistory = [
          {
            query,
            timestamp: Date.now(),
            count: 1,
          },
          ...prev,
        ];
      }

      // Ordenar por frecuencia y recencia
      newHistory.sort((a, b) => {
        // Primero por count (más frecuente)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Luego por timestamp (más reciente)
        return b.timestamp - a.timestamp;
      });

      // Limitar cantidad
      newHistory = newHistory.slice(0, maxItems);

      // Guardar en localStorage
      try {
        localStorage.setItem(key, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }

      return newHistory;
    });
  }, [key, maxItems]);

  // Eliminar búsqueda del historial
  const removeSearch = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(
        item => item.query.toLowerCase() !== query.toLowerCase()
      );
      
      try {
        localStorage.setItem(key, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Error removing from search history:', error);
      }
      
      return newHistory;
    });
  }, [key]);

  // Limpiar todo el historial
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [key]);

  // Obtener búsquedas más frecuentes
  const getTopSearches = useCallback((limit: number = 5) => {
    return [...history]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.query);
  }, [history]);

  // Obtener búsquedas recientes
  const getRecentSearches = useCallback((limit: number = 5) => {
    return [...history]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(item => item.query);
  }, [history]);

  return {
    history: history.map(item => item.query),
    historyWithMetadata: history,
    addSearch,
    removeSearch,
    clearHistory,
    getTopSearches,
    getRecentSearches,
  };
};
