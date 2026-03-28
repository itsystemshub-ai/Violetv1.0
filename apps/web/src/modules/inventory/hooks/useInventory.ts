import { useCallback } from 'react';
import { Product } from '@/lib/index';
import { toast } from 'sonner';
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useInventoryStore } from './useInventoryStore';
import { SyncService } from "@/core/sync/SyncService";
import { inventarioService } from '@/services/microservices/inventario/InventarioService';
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";
import type { ProductDB, SyncMutationResult } from '@/types/database.types';
import type { CrudResponse } from '@/types/api.types';

/**
 * Hook personalizado para gestionar el inventario de productos en Violet ERP.
 */
export const useInventory = () => {
  const { products, isLoading, fetchProducts: storeFetch } = useInventoryStore();
  const { activeTenantId } = useSystemConfig();

  /**
   * Mapea un producto de la base de datos (snake_case) al formato del frontend (camelCase).
   */
  const mapFromDB = (dbItem: ProductDB): Product => {
    let images: string[] = [];
    if (dbItem.image_urls && Array.isArray(dbItem.image_urls)) {
      images = dbItem.image_urls;
    } else if (dbItem.image_url) {
      images = [dbItem.image_url];
    }

    return {
      id: dbItem.id,
      name: dbItem.name,
      description: dbItem.description,
      price: Number(dbItem.price),
      cost: Number(dbItem.cost),
      stock: dbItem.stock,
      minStock: dbItem.min_stock,
      unit: dbItem.unit,
      category: dbItem.category,
      warehouseId: dbItem.warehouse_id || '',
      images,
      cauplas: dbItem.cauplas,
      torflex: dbItem.torflex,
      indomax: dbItem.indomax,
      oem: dbItem.oem,
      aplicacion: dbItem.aplicacion,
      descripcionManguera: dbItem.descripcion_manguera,
      aplicacionesDiesel: dbItem.aplicaciones_diesel,
      isNuevo: dbItem.is_nuevo,
      ventasHistory: dbItem.ventas_history,
      rankingHistory: dbItem.ranking_history,
      precioFCA: Number(dbItem.precio_fca),
      rowNumber: dbItem.row_number,
      status: dbItem.status,
      isCombo: dbItem.is_combo,
      components: dbItem.components,
      warehouseStocks: dbItem.warehouse_stocks,
      deactivationReason: dbItem.deactivation_reason,
    };
  };

  /**
   * Mapea un producto del frontend al formato de la base de datos (snake_case).
   */
  const mapToDB = (product: Partial<Product>): Partial<ProductDB> => {
    const dbItem: Partial<ProductDB> = {
      tenant_id: activeTenantId || '',
      updated_at: new Date().toISOString(),
    };

    if ('cauplas' in product) {
      dbItem.sku = product.cauplas || 'PENDING';
      dbItem.cauplas = product.cauplas;
    }
    if ('name' in product) dbItem.name = product.name;
    if ('description' in product) dbItem.description = product.description;
    if ('price' in product) dbItem.price = product.price;
    if ('cost' in product) dbItem.cost = product.cost;
    if ('stock' in product) dbItem.stock = product.stock;
    if ('minStock' in product) dbItem.min_stock = product.minStock;
    if ('unit' in product) dbItem.unit = product.unit;
    if ('category' in product) dbItem.category = product.category;
    if ('warehouseId' in product) dbItem.warehouse_id = product.warehouseId;
    if ('torflex' in product) dbItem.torflex = product.torflex;
    if ('indomax' in product) dbItem.indomax = product.indomax;
    if ('oem' in product) dbItem.oem = product.oem;
    if ('aplicacion' in product) dbItem.aplicacion = product.aplicacion;
    if ('descripcionManguera' in product) dbItem.descripcion_manguera = product.descripcionManguera;
    if ('aplicacionesDiesel' in product) dbItem.aplicaciones_diesel = product.aplicacionesDiesel;
    if ('isNuevo' in product) dbItem.is_nuevo = product.isNuevo;
    if ('ventasHistory' in product) dbItem.ventas_history = product.ventasHistory;
    if ('rankingHistory' in product) dbItem.ranking_history = product.rankingHistory;
    if ('precioFCA' in product) dbItem.precio_fca = product.precioFCA;
    if ('rowNumber' in product) dbItem.row_number = product.rowNumber;
    if ('status' in product) dbItem.status = product.status;
    if ('isCombo' in product) dbItem.is_combo = product.isCombo;
    if ('components' in product) dbItem.components = product.components;
    if ('warehouseStocks' in product) dbItem.warehouse_stocks = product.warehouseStocks;
    if ('deactivationReason' in product) dbItem.deactivation_reason = product.deactivationReason;

    if (product.images && product.images.length > 0) {
      dbItem.image_url = product.images[0];
      dbItem.image_urls = product.images;
    }

    return dbItem;
  };

  const fetchProducts = useCallback(async () => {
    if (activeTenantId) {
      await storeFetch(activeTenantId);
    }
  }, [activeTenantId, storeFetch]);

  const addProduct = async (product: Partial<Product>): Promise<CrudResponse<Product>> => {
    try {
      const dbItem = mapToDB(product);
      const tempId = crypto.randomUUID();
      
      const result = await SyncService.mutate(
        'products',
        'INSERT',
        { ...dbItem, id: tempId },
        tempId
      ) as SyncMutationResult<ProductDB>;

      if (result.error) throw result.error;
      
      const newProduct = result.data ? mapFromDB(result.data) : { ...product, id: tempId } as Product;
      const productName = newProduct.name || newProduct.cauplas || 'Producto';
      toast.success(`Producto '${productName}' añadido.`);

      useNotificationStore.getState().addNotification({
        module: 'Inventario',
        type: 'success',
        title: 'Producto Registrado',
        message: `Se ha añadido '${productName}' al inventario.`,
      });

      return { success: true, data: newProduct };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto.';
      console.error('Error adding product:', error);
      toast.error(errorMessage);
      return { success: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<CrudResponse<Product>> => {
    try {
      const dbItem = mapToDB(updates);
      
      if (updates.stock !== undefined) {
         await inventarioService.updateStock(id, updates.stock, activeTenantId!);
      }

      const result = await SyncService.mutate(
        'products',
        'UPDATE',
        dbItem,
        id
      ) as SyncMutationResult<ProductDB>;

      if (result.error) throw result.error;
      
      const updatedProduct = result.data ? mapFromDB(result.data) : { ...updates, id } as Product;
      const productName = updatedProduct.name || updatedProduct.cauplas || 'Producto';
      toast.success(`Producto '${productName}' actualizado.`);

      useNotificationStore.getState().addNotification({
        module: 'Inventario',
        type: 'info',
        title: 'Stock Actualizado',
        message: `El producto '${productName}' ha sido actualizado con éxito.`,
      });

      return { success: true, data: updatedProduct };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el producto.';
      console.error('Error updating product:', error);
      toast.error(errorMessage);
      return { success: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const deleteProduct = async (id: string): Promise<CrudResponse<void>> => {
    try {
      const { error } = await SyncService.mutate(
        'products',
        'DELETE',
        null,
        id
      );

      if (error) throw error;
      toast.success('Producto eliminado del inventario.');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el producto.';
      console.error('Error deleting product:', error);
      toast.error(errorMessage);
      return { success: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  const addProductsBulk = async (newProducts: Partial<Product>[]): Promise<CrudResponse<void>> => {
    if (!activeTenantId || activeTenantId === 'none') {
      toast.error('No hay una empresa activa seleccionada.');
      return { success: false, error: new Error('No hay una empresa activa seleccionada.') };
    }

    try {
      await inventarioService.syncBulkProducts(newProducts, activeTenantId);
      
      toast.success(`${newProducts.length} productos procesados (Insert/Update).`);

      useNotificationStore.getState().addNotification({
        module: 'Inventario',
        type: 'success',
        title: 'Importación Masiva',
        message: `Se han procesado ${newProducts.length} productos correctamente.`,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al importar.';
      console.error('Error bulk import:', error);
      toast.error(errorMessage);
      return { success: false, error: error instanceof Error ? error : new Error(errorMessage) };
    }
  };

  return {
    products,
    isLoading,
    fetchProducts,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
    activeTenantId,
  };
};
