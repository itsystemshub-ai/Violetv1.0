/**
 * useCategories - Hook para gestión de categorías derivadas de productos reales
 * Las categorías se generan automáticamente a partir de los productos importados
 */

import { useState, useMemo } from 'react';
import { useInventoryStore } from './useInventoryStore';

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  level: number;
  productCount: number;
  status: 'active' | 'inactive';
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Colores para asignar automáticamente a categorías
const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#D946EF', '#0EA5E9', '#A855F7', '#22C55E',
];

export const useCategories = () => {
  const { products } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Derivar categorías automáticamente de los productos reales
  const categories: Category[] = useMemo(() => {
    const catMap = new Map<string, { count: number; products: typeof products }>();

    products.forEach(p => {
      const cat = p.category || 'General';
      if (!catMap.has(cat)) {
        catMap.set(cat, { count: 0, products: [] });
      }
      const entry = catMap.get(cat)!;
      entry.count++;
      entry.products.push(p);
    });

    let index = 0;
    return Array.from(catMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, data]) => {
        const cat: Category = {
          id: `CAT-${String(index + 1).padStart(3, '0')}`,
          code: name.substring(0, 4).toUpperCase().replace(/\s/g, ''),
          name,
          description: `${data.count} producto${data.count !== 1 ? 's' : ''} en esta categoría`,
          level: 1,
          productCount: data.count,
          status: data.count > 0 ? 'active' : 'inactive',
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        index++;
        return cat;
      });
  }, [products]);

  const loading = false; // Categories are derived, no async loading needed

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCategories: categories.length,
    activeCategories: categories.filter(c => c.status === 'active').length,
    inactiveCategories: categories.filter(c => c.status === 'inactive').length,
    totalProducts: categories.reduce((sum, c) => sum + c.productCount, 0),
    parentCategories: categories.filter(c => c.level === 1).length,
    subCategories: categories.filter(c => c.level > 1).length,
  };

  const createCategory = (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>) => {
    // Categories are now derived from products - this is a no-op
    console.log('[useCategories] Categories are auto-derived from products. To add a category, import products with that category.');
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    console.log('[useCategories] Categories are auto-derived from products.');
  };

  const deleteCategory = (id: string) => {
    console.log('[useCategories] Categories are auto-derived from products.');
  };

  const activateCategory = (id: string) => {
    console.log('[useCategories] Categories are auto-derived from products.');
  };

  const deactivateCategory = (id: string) => {
    console.log('[useCategories] Categories are auto-derived from products.');
  };

  return {
    categories: filteredCategories,
    allCategories: categories,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createCategory,
    updateCategory,
    deleteCategory,
    activateCategory,
    deactivateCategory,
  };
};
