/**
 * AdvancedSearchBar - Barra de búsqueda avanzada con autocomplete
 * Características:
 * - Autocomplete inteligente
 * - Historial de búsquedas
 * - Resaltado de términos
 * - Sugerencias en tiempo real
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, X, TrendingUp } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/core/shared/utils/utils';

interface Product {
  id: string;
  CAUPLAS?: string;
  DESCRIPCION?: string;
  MARCA?: string;
  MODELO?: string;
  PRECIO?: number;
  [key: string]: any;
}

interface AdvancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  products: Product[];
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

const SEARCH_HISTORY_KEY = 'pos_search_history';
const MAX_HISTORY_ITEMS = 10;
const MAX_SUGGESTIONS = 8;

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  value,
  onChange,
  products,
  onProductSelect,
  placeholder = 'Buscar productos...',
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar historial desde localStorage
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Guardar búsqueda en historial
  const saveToHistory = (query: string) => {
    if (!query.trim() || query.length < 2) return;

    const newHistory = [
      query,
      ...searchHistory.filter(item => item !== query)
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Generar sugerencias inteligentes
  const suggestions = useMemo(() => {
    if (!value.trim()) {
      // Mostrar historial cuando no hay búsqueda
      return searchHistory.map(query => ({
        type: 'history' as const,
        text: query,
        product: null,
      }));
    }

    const query = value.toLowerCase().trim();
    const matchedProducts = new Map<string, Product>();
    const scores = new Map<string, number>();

    // Buscar en productos
    products.forEach(product => {
      let score = 0;
      const searchableFields = [
        product.CAUPLAS,
        product.DESCRIPCION,
        product.MARCA,
        product.MODELO,
        product.PRECIO?.toString(),
      ].filter(Boolean);

      searchableFields.forEach((field, index) => {
        const fieldValue = field?.toString().toLowerCase() || '';
        
        // Coincidencia exacta al inicio (mayor peso)
        if (fieldValue.startsWith(query)) {
          score += 100 - (index * 10);
        }
        // Coincidencia en cualquier parte
        else if (fieldValue.includes(query)) {
          score += 50 - (index * 5);
        }
        // Coincidencia de palabras
        else if (query.split(' ').some(word => fieldValue.includes(word))) {
          score += 25 - (index * 2);
        }
      });

      if (score > 0) {
        matchedProducts.set(product.id, product);
        scores.set(product.id, score);
      }
    });

    // Ordenar por score y limitar resultados
    return Array.from(matchedProducts.values())
      .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
      .slice(0, MAX_SUGGESTIONS)
      .map(product => ({
        type: 'product' as const,
        text: product.DESCRIPCION || product.CAUPLAS || '',
        product,
      }));
  }, [value, products, searchHistory]);

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (suggestion: typeof suggestions[0]) => {
    if (suggestion.type === 'history') {
      onChange(suggestion.text);
      saveToHistory(suggestion.text);
    } else if (suggestion.product) {
      onChange(suggestion.text);
      saveToHistory(suggestion.text);
      onProductSelect?.(suggestion.product);
    }
    setIsFocused(false);
    setSelectedIndex(-1);
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (value.trim()) {
          saveToHistory(value);
          setIsFocused(false);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar búsqueda
  const handleClear = () => {
    onChange('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Eliminar item del historial
  const removeFromHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item !== query);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Resaltar términos de búsqueda
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const showDropdown = isFocused && suggestions.length > 0;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3',
                selectedIndex === index && 'bg-accent'
              )}
            >
              {/* Icono */}
              <div className="shrink-0 mt-0.5">
                {suggestion.type === 'history' ? (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-primary" />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                {suggestion.type === 'history' ? (
                  <div className="text-sm">
                    {highlightText(suggestion.text, value)}
                  </div>
                ) : suggestion.product ? (
                  <>
                    <div className="text-sm font-medium">
                      {highlightText(
                        suggestion.product.DESCRIPCION || suggestion.product.CAUPLAS || '',
                        value
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      {suggestion.product.CAUPLAS && (
                        <span>
                          {highlightText(suggestion.product.CAUPLAS, value)}
                        </span>
                      )}
                      {suggestion.product.MARCA && (
                        <>
                          <span>•</span>
                          <span>
                            {highlightText(suggestion.product.MARCA, value)}
                          </span>
                        </>
                      )}
                      {suggestion.product.PRECIO && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            ${suggestion.product.PRECIO.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Botón eliminar historial */}
              {suggestion.type === 'history' && (
                <button
                  onClick={(e) => removeFromHistory(suggestion.text, e)}
                  className="shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
