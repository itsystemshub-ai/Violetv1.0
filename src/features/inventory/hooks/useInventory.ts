import { useCallback } from 'react';
import { Product } from '@/lib/index';
import { toast } from 'sonner';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useInventoryStore } from '@/features/inventory/hooks/useInventoryStore';
import { SyncService } from '@/lib/SyncService';
import { inventarioService } from '@/services/microservices/inventario/InventarioService';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import type { ProductDB, SyncMutationResult, CrudResponse } from '@/types/database.types';

/**
 * Hook personalizado para gestionar el inventario de productos en Violet ERP.
 * 
 * Proporciona operaciones CRUD completas para productos con:
 * - Sincronización automática con Supabase
 * - Mapeo bidireccional entre frontend y base de datos
 * - Gestión de stock y almacenes
 * - Importación masiva con lógica de Upsert
 * - Notificaciones automáticas
 * 
 * @returns {Object} Objeto con funciones y estado del inventario
 * @returns {Product[]} products - Lista de productos del tenant activo
 * @returns {boolean} isLoading - Estado de carga
 * @returns {Function} fetchProducts - Carga productos del tenant activo
 * @returns {Function} addProduct - Añade un nuevo producto
 * @returns {Function} addProductsBulk - Importación masiva de productos
 * @returns {Function} updateProduct - Actualiza un producto existente
 * @returns {Function} deleteProduct - Elimina un producto
 * @returns {string | null} activeTenantId - ID del tenant activo
 * 
 * @example
 * ```typescript
 * const { products, addProduct, updateProduct, isLoading } = useInventory();
 * 
 * // Añadir producto
 * const result = await addProduct({
 *   name: 'Manguera Hidráulica',
 *   price: 25.50,
 *   cost: 15.00,
 *   stock: 100,
 *   category: 'Mangueras'
 * });
 * 
 * // Actualizar stock
 * await updateProduct('product-id', { stock: 150 });
 * 
 * // Importación masiva
 * await addProductsBulk(arrayDeProductos);
 * ```
 * 
 * @architecture
 * - Usa arquitectura horizontal con microservicio de inventario
 * - Sincronización automática con SyncService
 * - Mapeo snake_case (DB) <-> camelCase (Frontend)
 * - Notificaciones centralizadas con useNotificationStore
 */
export const useInventory = () => {
  const { products, isLoading, fetchProducts: storeFetch } = useInventoryStore();
  const { activeTenantId } = useSystemConfig();

  /**
   * Mapea un producto de la base de datos (snake_case) al formato del frontend (camelCase).
   * 
   * Convierte campos como:
   * - image_url -> images (array)
   * - min_stock -> minStock
   * - warehouse_id -> warehouseId
   * - precio_fca -> precioFCA
   * - is_combo -> isCombo
   * 
   * @param {ProductDB} dbItem - Producto en formato de base de datos
   * @returns {Product} Producto en formato del frontend
   * 
   * @private
   */
  const mapFromDB = (dbItem: ProductDB): Product => {
    let images: string[] = [];
    if (dbItem.image_urls && Array.isArray(dbItem.image_urls)) {
      images = dbItem.image_urls;
      console.log("mapFromDB - Cargando imágenes desde image_urls:", images.length);
    } else if (dbItem.image_url) {
      images = [dbItem.image_url];
      console.log("mapFromDB - Cargando imagen desde image_url");
    } else {
      console.log("mapFromDB - No hay imágenes en la BD para producto:", dbItem.cauplas);
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
      warehouseId: dbItem.warehouse_id,
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
      status: dbItem.status,
      isCombo: dbItem.is_combo,
      components: dbItem.components,
      warehouseStocks: dbItem.warehouse_stocks,
    };
  };

  /**
   * Mapea un producto del frontend al formato de la base de datos (snake_case).
   * 
   * Convierte campos como:
   * - images -> image_url (primer elemento) + image_urls (array completo)
   * - minStock -> min_stock
   * - warehouseId -> warehouse_id
   * - precioFCA -> precio_fca
   * - isCombo -> is_combo
   * 
   * @param {Partial<Product>} product - Producto en formato del frontend
   * @returns {Partial<ProductDB>} Producto en formato de base de datos
   * 
   * @private
   */
  const mapToDB = (product: Partial<Product>): Partial<ProductDB> => {
    const dbItem: Partial<ProductDB> = {
      tenant_id: activeTenantId,
      sku: product.cauplas || 'PENDING', 
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      min_stock: product.minStock,
      unit: product.unit,
      category: product.category,
      warehouse_id: product.warehouseId,
      cauplas: product.cauplas,
      torflex: product.torflex,
      indomax: product.indomax,
      oem: product.oem,
      aplicacion: product.aplicacion,
      descripcion_manguera: product.descripcionManguera,
      aplicaciones_diesel: product.aplicacionesDiesel,
      is_nuevo: product.isNuevo,
      ventas_history: product.ventasHistory,
      ranking_history: product.rankingHistory,
      precio_fca: product.precioFCA,
      status: product.status,
      is_combo: product.isCombo,
      components: product.components,
      warehouse_stocks: product.warehouseStocks,
      updated_at: new Date().toISOString(),
    };

    if (product.images && product.images.length > 0) {
      console.log("mapToDB - Guardando imágenes:", product.images.length);
      dbItem.image_url = product.images[0];
      dbItem.image_urls = product.images;
    } else {
      console.log("mapToDB - No hay imágenes para guardar");
    }

    return dbItem;
  };

  const fetchProducts = useCallback(async () => {
    if (activeTenantId) {
      await storeFetch(activeTenantId);
    }
  }, [activeTenantId, storeFetch]);

  /**
   * Añade un nuevo producto al inventario.
   * 
   * Proceso:
   * 1. Mapea producto a formato de base de datos
   * 2. Genera ID temporal único
   * 3. Inserta en base de datos vía SyncService
   * 4. Muestra notificación de éxito/error
   * 5. Notifica al sistema central
   * 
   * @param {Partial<Product>} product - Datos del producto a añadir
   * @returns {Promise<CrudResponse<Product>>} Respuesta con producto creado o error
   * 
   * @example
   * ```typescript
   * const result = await addProduct({
   *   name: 'Manguera SAE 100R2',
   *   price: 45.00,
   *   cost: 30.00,
   *   stock: 50,
   *   minStock: 10,
   *   category: 'Mangueras',
   *   unit: 'metro'
   * });
   * 
   * if (result.success) {
   *   console.log('Producto creado:', result.data);
   * }
   * ```
   * 
   * @throws {Error} Si hay error al guardar en base de datos
   */
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

      // Notificar al sistema
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

  /**
   * Actualiza un producto existente en el inventario.
   * 
   * Proceso:
   * 1. Mapea actualizaciones a formato de base de datos
   * 2. Si se actualiza stock, usa microservicio de inventario
   * 3. Actualiza en base de datos vía SyncService
   * 4. Muestra notificación de éxito/error
   * 5. Notifica al sistema central
   * 
   * @param {string} id - ID del producto a actualizar
   * @param {Partial<Product>} updates - Campos a actualizar
   * @returns {Promise<CrudResponse<Product>>} Respuesta con producto actualizado o error
   * 
   * @example
   * ```typescript
   * // Actualizar precio
   * await updateProduct('prod-123', { price: 50.00 });
   * 
   * // Actualizar stock (usa microservicio)
   * await updateProduct('prod-123', { stock: 75 });
   * 
   * // Actualizar múltiples campos
   * await updateProduct('prod-123', {
   *   price: 50.00,
   *   stock: 75,
   *   minStock: 15
   * });
   * ```
   * 
   * @architecture
   * - Usa arquitectura horizontal: stock se actualiza vía microservicio
   * - Otros campos se actualizan directamente en tabla
   * 
   * @throws {Error} Si hay error al actualizar en base de datos
   */
  const updateProduct = async (id: string, updates: Partial<Product>): Promise<CrudResponse<Product>> => {
    try {
      const dbItem = mapToDB(updates);
      
      // Horizontal Architecture: Update stock using the dedicated Inventory MS orchestrator
      if (updates.stock !== undefined) {
         await inventarioService.updateStock(id, updates.stock, activeTenantId!);
      }

      // Allow basic table mutate for generic properties
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

      // Notificar al sistema
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

  /**
   * Elimina un producto del inventario.
   * 
   * Proceso:
   * 1. Elimina de base de datos vía SyncService
   * 2. Muestra notificación de éxito/error
   * 
   * @param {string} id - ID del producto a eliminar
   * @returns {Promise<CrudResponse<void>>} Respuesta de éxito o error
   * 
   * @example
   * ```typescript
   * const result = await deleteProduct('prod-123');
   * if (result.success) {
   *   console.log('Producto eliminado');
   * }
   * ```
   * 
   * @warning
   * - No verifica si el producto tiene ventas asociadas
   * - No verifica si el producto está en facturas pendientes
   * - Considerar soft delete en producción
   * 
   * @throws {Error} Si hay error al eliminar de base de datos
   */
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

  /**
   * Añade múltiples productos de forma masiva con lógica de Upsert.
   * 
   * Proceso:
   * 1. Valida que haya tenant activo
   * 2. Usa microservicio de inventario para procesar lote
   * 3. Implementa lógica de Upsert (Insert o Update según exista)
   * 4. Muestra notificación con cantidad procesada
   * 5. Notifica al sistema central
   * 
   * @param {Partial<Product>[]} newProducts - Array de productos a importar
   * @returns {Promise<CrudResponse<void>>} Respuesta de éxito o error
   * 
   * @example
   * ```typescript
   * const productos = [
   *   { name: 'Producto 1', price: 10, stock: 100 },
   *   { name: 'Producto 2', price: 20, stock: 200 },
   *   { name: 'Producto 3', price: 30, stock: 300 }
   * ];
   * 
   * const result = await addProductsBulk(productos);
   * if (result.success) {
   *   console.log('Importación completada');
   * }
   * ```
   * 
   * @performance
   * - Procesa en lotes para evitar timeouts
   * - Usa transacciones para garantizar consistencia
   * - Evita duplicados con lógica de Upsert
   * 
   * @throws {Error} Si no hay tenant activo o error en importación
   */
  const addProductsBulk = async (newProducts: Partial<Product>[]): Promise<CrudResponse<void>> => {
    if (!activeTenantId || activeTenantId === 'none') {
      toast.error('No hay una empresa activa seleccionada.');
      return { success: false, error: new Error('No hay una empresa activa seleccionada.') };
    }

    try {
      // Usar el servicio de inventario para manejar la lógica de Upsert (evitar duplicados)
      await inventarioService.syncBulkProducts(newProducts, activeTenantId);
      
      toast.success(`${newProducts.length} productos procesados (Insert/Update).`);

      // Notificar al sistema
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
