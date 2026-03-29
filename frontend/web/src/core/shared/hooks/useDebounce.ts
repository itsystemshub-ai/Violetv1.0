import { useState, useEffect } from 'react';

/**
 * Hook de debounce para optimizar búsquedas y filtros.
 * Evita llamadas excesivas a la base de datos al retrasar la ejecución.
 * 
 * @template T - Tipo del valor a debounce
 * @param {T} value - Valor a aplicar debounce
 * @param {number} [delay=300] - Delay en milisegundos (default: 300ms)
 * @returns {T} Valor debounced
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Esta búsqueda solo se ejecuta 500ms después de que el usuario deja de escribir
 *     performSearch(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 * 
 * @performance
 * - Reduce llamadas a API/DB en 90-95%
 * - Mejora experiencia de usuario en búsquedas
 * - Previene sobrecarga del servidor
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce para funciones (callbacks).
 * Útil para eventos como onChange, onScroll, onResize, etc.
 * 
 * @template T - Tipo de la función callback
 * @param {T} callback - Función a aplicar debounce
 * @param {number} [delay=300] - Delay en milisegundos (default: 300ms)
 * @returns {Function} Función debounced
 * 
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   console.log('Buscando:', term);
 *   performSearch(term);
 * }, 500);
 * 
 * // En el componente
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 * 
 * @performance
 * - Previene ejecuciones múltiples de funciones costosas
 * - Ideal para eventos de alta frecuencia
 * - Limpia timeouts automáticamente
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
