/**
 * useProducts - Hook para gestión de productos con persistencia en localDb
 * Los productos se guardan en IndexedDB y se comparten con todos los módulos
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useTenant } from '@/shared/hooks/useTenant';
import { useInventoryStore } from './useInventoryStore';
import { toast } from 'sonner';

export interface Product {
  id: string;
  cauplas: string;
  descripcionManguera: string;
  description?: string;
  category: string;
  categoryId: string;
  precioFCA: number;
  cost: number;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive' | 'discontinued';
  supplier?: string;
  supplierId?: string;
  barcode?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

/** Maps a localDb product to the UI Product shape */
function mapDbToUI(db: any): Product {
  return {
    id: db.id,
    cauplas: db.cauplas || db.id.substring(0, 8),
    descripcionManguera: db.descripcionManguera || db.name || '',
    description: db.description,
    category: db.category || 'General',
    categoryId: db.category || 'general',
    precioFCA: db.precioFCA ?? db.price ?? 0,
    cost: db.cost || 0,
    stock: db.stock || 0,
    minStock: db.minStock || 0,
    status: db.status === 'disponible' || db.status === 'poco_stock' ? 'active'
      : db.status === 'agotado' ? 'active'
      : db.status === 'descontinuado' ? 'discontinued'
      : 'active',
    supplier: undefined,
    barcode: db.oem,
    createdAt: db.created_at || new Date().toISOString(),
    updatedAt: db.updated_at || new Date().toISOString(),
  };
}

export const useProducts = () => {
  const { tenant } = useTenant();
  const { fetchProducts: refreshStore } = useInventoryStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const tenantId = tenant?.id;

  // Load products from localDb
  const loadProducts = useCallback(async () => {
    if (!tenantId || tenantId === 'none') {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const dbProducts = await localDb.products
        .where('tenant_id')
        .equals(tenantId)
        .toArray();

      setProducts(dbProducts.map(mapDbToUI));
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.descripcionManguera.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.cauplas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery));

    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock <= p.minStock && p.stock > 0 && p.status === 'active').length,
    outOfStock: products.filter(p => p.stock === 0 && p.status === 'active').length,
    totalValue: products.reduce((sum, p) => sum + (p.precioFCA * p.stock), 0),
    totalCost: products.reduce((sum, p) => sum + (p.cost * p.stock), 0),
  };

  const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!tenantId) {
      toast.error('No hay tenant activo');
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Determine status based on stock
    let dbStatus: 'disponible' | 'poco_stock' | 'agotado' | 'descontinuado' = 'disponible';
    if (product.stock === 0) dbStatus = 'agotado';
    else if (product.stock <= product.minStock) dbStatus = 'poco_stock';

    const dbProduct: any = {
      id,
      descripcionManguera: product.descripcionManguera,
      name: product.descripcionManguera,
      description: product.description || '',
      precioFCA: product.precioFCA,
      price: product.precioFCA,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      category: product.category,
      warehouseId: 'default',
      images: [],
      cauplas: product.cauplas,
      oem: product.barcode,
      status: dbStatus,
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
    };

    try {
      await localDb.products.put(dbProduct);
      await loadProducts();
      // Also refresh the global inventory store so dashboard picks it up
      refreshStore(tenantId);
      toast.success(`Producto "${product.descripcionManguera}" creado exitosamente`);
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Error al crear el producto');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.descripcionManguera) { dbUpdates.descripcionManguera = updates.descripcionManguera; dbUpdates.name = updates.descripcionManguera; }
      if (updates.precioFCA !== undefined) { dbUpdates.precioFCA = updates.precioFCA; dbUpdates.price = updates.precioFCA; }
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
      if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
      if (updates.minStock !== undefined) dbUpdates.minStock = updates.minStock;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.status === 'discontinued') dbUpdates.status = 'descontinuado';
      if (updates.status === 'inactive') dbUpdates.status = 'agotado';
      if (updates.status === 'active') dbUpdates.status = 'disponible';

      await localDb.products.update(id, dbUpdates);
      await loadProducts();
      if (tenantId) refreshStore(tenantId);
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Error al actualizar el producto');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await localDb.products.delete(id);
      await loadProducts();
      if (tenantId) refreshStore(tenantId);
      toast.success('Producto eliminado');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Error al eliminar el producto');
    }
  };

  const adjustStock = async (id: string, quantity: number, type: 'add' | 'subtract') => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStock = type === 'add' ? product.stock + quantity : product.stock - quantity;
      await updateProduct(id, { stock: Math.max(0, newStock) });
    }
  };

  const activateProduct = (id: string) => updateProduct(id, { status: 'active' });
  const deactivateProduct = (id: string) => updateProduct(id, { status: 'inactive' });

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    stats,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    activateProduct,
    deactivateProduct,
    reloadProducts: loadProducts,
  };
};
