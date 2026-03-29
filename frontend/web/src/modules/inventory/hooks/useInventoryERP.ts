/**
 * useInventoryERP - Hook para gestión de inventario con integración ERP
 * 
 * Este hook usa inventoryERPService para registrar movimientos y ajustes
 * de inventario a través del Transaction Engine del ERP.
 * 
 * @module inventory/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  inventoryERPService, 
  type InventoryMovement, 
  type InventoryAdjustment,
  type InventoryERPResult,
  type InventoryMovementType 
} from '../services/InventoryERPService';
import { localDb } from '@/core/database/localDb';

export interface ProductStock {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location?: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  type: 'low' | 'critical' | 'excess';
}

export const useInventoryERP = () => {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar productos desde IndexedDB
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const dbProducts = await localDb.products?.toArray() || [];
      const mappedProducts: ProductStock[] = dbProducts.map((prod: any) => ({
        id: prod.id,
        sku: prod.sku || prod.codigo || '',
        name: prod.name || prod.nombre || '',
        currentStock: prod.stock_actual || prod.currentStock || prod.stock || 0,
        minStock: prod.stock_minimo || prod.minStock || 0,
        maxStock: prod.stock_maximo || prod.maxStock || 0,
        location: prod.ubicacion || prod.location,
      }));
      setProducts(mappedProducts);
      
      // Generar alertas de stock
      const newAlerts: StockAlert[] = [];
      mappedProducts.forEach(prod => {
        if (prod.currentStock <= prod.minStock) {
          newAlerts.push({
            productId: prod.id,
            productName: prod.name,
            currentStock: prod.currentStock,
            minStock: prod.minStock,
            type: prod.currentStock <= prod.minStock * 0.5 ? 'critical' : 'low',
          });
        } else if (prod.currentStock > prod.maxStock) {
          newAlerts.push({
            productId: prod.id,
            productName: prod.name,
            currentStock: prod.currentStock,
            minStock: prod.maxStock,
            type: 'excess',
          });
        }
      });
      setAlerts(newAlerts);
    } catch (error) {
      console.error('[useInventoryERP] Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar movimientos
  const loadMovements = useCallback(async () => {
    try {
      const dbMovements = await localDb.inventory_movements?.toArray() || [];
      const mappedMovements: InventoryMovement[] = dbMovements.map((mov: any) => ({
        id: mov.id,
        productId: mov.product_id || mov.productId,
        productName: mov.product_name || mov.productName || '',
        type: (mov.type || 'IN') as InventoryMovementType,
        quantity: mov.quantity || 0,
        reason: mov.reason || '',
        reference: mov.reference,
        date: mov.date || mov.created_at || new Date().toISOString(),
        createdBy: mov.user_id || mov.createdBy,
      }));
      setMovements(mappedMovements);
    } catch (error) {
      console.error('[useInventoryERP] Error cargando movimientos:', error);
    }
  }, []);

  // Cargar ajustes
  const loadAdjustments = useCallback(async () => {
    try {
      const dbAdjustments = await localDb.inventory_adjustments?.toArray() || [];
      const mappedAdjustments: InventoryAdjustment[] = dbAdjustments.map((adj: any) => ({
        id: adj.id,
        productId: adj.product_id || adj.productId,
        productName: adj.product_name || adj.productName || '',
        currentStock: adj.current_stock || adj.currentStock || 0,
        newStock: adj.new_stock || adj.newStock || 0,
        difference: adj.difference || adj.newStock - (adj.currentStock || 0),
        reason: adj.reason || '',
        type: (adj.type || 'INCREASE') as 'INCREASE' | 'DECREASE',
        date: adj.date || adj.created_at || new Date().toISOString(),
        approvedBy: adj.approved_by || adj.approvedBy,
      }));
      setAdjustments(mappedAdjustments);
    } catch (error) {
      console.error('[useInventoryERP] Error cargando ajustes:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadMovements();
    loadAdjustments();
  }, [loadProducts, loadMovements, loadAdjustments]);

  // Filtrar productos
  const filteredProducts = products.filter(prod => 
    !searchQuery || 
    prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estadísticas
  const stats = {
    totalProducts: products.length,
    lowStock: alerts.filter(a => a.type === 'low').length,
    criticalStock: alerts.filter(a => a.type === 'critical').length,
    excessStock: alerts.filter(a => a.type === 'excess').length,
    totalMovements: movements.length,
    pendingAdjustments: adjustments.filter(a => !a.approvedBy).length,
  };

  /**
   * Registrar movimiento de inventario con integración ERP
   */
  const registerMovement = async (
    productId: string,
    type: InventoryMovementType,
    quantity: number,
    reason: string,
    reference?: string
  ): Promise<{ success: boolean; movementId?: string; error?: string }> => {
    try {
      // Obtener nombre del producto
      const product = products.find(p => p.id === productId);
      const productName = product?.name || 'Producto desconocido';

      const movementData: Omit<InventoryMovement, 'id'> = {
        productId,
        productName,
        type,
        quantity,
        reason,
        reference,
        date: new Date().toISOString(),
      };

      const result: InventoryERPResult = await inventoryERPService.registerMovement(movementData);

      if (result.success) {
        await loadProducts();
        await loadMovements();
        return { success: true, movementId: result.movement?.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[useInventoryERP] Error registrando movimiento:', error);
      return { success: false, error: String(error) };
    }
  };

  /**
   * Registrar ajuste de inventario
   */
  const registerAdjustment = async (
    productId: string,
    newStock: number,
    reason: string
  ): Promise<{ success: boolean; adjustmentId?: string; error?: string }> => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        return { success: false, error: 'Producto no encontrado' };
      }

      const currentStock = product.currentStock;
      const difference = newStock - currentStock;

      const adjustmentData: Omit<InventoryAdjustment, 'id'> = {
        productId,
        productName: product.name,
        currentStock,
        newStock,
        difference,
        reason,
        type: difference > 0 ? 'INCREASE' : 'DECREASE',
        date: new Date().toISOString(),
      };

      const result: InventoryERPResult = await inventoryERPService.registerAdjustment(adjustmentData);

      if (result.success) {
        await loadAdjustments();
        return { success: true, adjustmentId: result.adjustment?.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[useInventoryERP] Error registrando ajuste:', error);
      return { success: false, error: String(error) };
    }
  };

  /**
   * Aprobar ajuste de inventario
   */
  const approveAdjustment = async (adjustmentId: string, approverId: string = 'system'): Promise<boolean> => {
    try {
      const result = await inventoryERPService.approveAdjustment(adjustmentId, approverId);
      if (result.success) {
        await loadAdjustments();
        await loadProducts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useInventoryERP] Error aprobando ajuste:', error);
      return false;
    }
  };

  /**
   * Obtener movimientos de un producto
   */
  const getProductMovements = async (productId: string): Promise<InventoryMovement[]> => {
    try {
      return await inventoryERPService.getMovementsByProduct(productId);
    } catch (error) {
      console.error('[useInventoryERP] Error obteniendo movimientos:', error);
      return [];
    }
  };

  /**
   * Entrada de inventario (compra recibida)
   */
  const stockIn = async (
    productId: string,
    quantity: number,
    purchaseOrderId?: string
  ): Promise<boolean> => {
    const result = await registerMovement(
      productId,
      'IN',
      quantity,
      'Entrada por compra',
      purchaseOrderId
    );
    return result.success;
  };

  /**
   * Salida de inventario (venta)
   */
  const stockOut = async (
    productId: string,
    quantity: number,
    invoiceId?: string
  ): Promise<boolean> => {
    const result = await registerMovement(
      productId,
      'OUT',
      quantity,
      'Salida por venta',
      invoiceId
    );
    return result.success;
  };

  /**
   * Transferencia de inventario
   */
  const transfer = async (
    productId: string,
    quantity: number,
    fromLocation: string,
    toLocation: string
  ): Promise<boolean> => {
    // Salida de ubicación origen
    const outResult = await registerMovement(
      productId,
      'OUT',
      quantity,
      `Transferencia a ${toLocation}`,
      `FROM:${fromLocation}`
    );
    if (!outResult.success) return false;

    // Entrada a ubicación destino
    const inResult = await registerMovement(
      productId,
      'IN',
      quantity,
      `Transferencia desde ${fromLocation}`,
      `TO:${toLocation}`
    );
    return inResult.success;
  };

  return {
    products: filteredProducts,
    allProducts: products,
    movements,
    adjustments,
    alerts,
    loading,
    searchQuery,
    setSearchQuery,
    stats,
    registerMovement,
    registerAdjustment,
    approveAdjustment,
    getProductMovements,
    stockIn,
    stockOut,
    transfer,
    refresh: loadProducts,
  };
};

export default useInventoryERP;
