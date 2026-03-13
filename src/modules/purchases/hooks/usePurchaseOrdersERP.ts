/**
 * usePurchaseOrdersERP - Hook para gestión de órdenes de compra con integración ERP
 * 
 * Este hook usa purchasesERPService para crear transacciones ERP
 * cuando se crean, approve o receipt órdenes de compra.
 * 
 * @module purchases/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { purchasesERPService, type PurchaseDocument, type PurchasesERPResult } from '../services/PurchasesERPService';
import { localDb } from '@/core/database/localDb';

export interface PurchaseOrder {
  id: string;
  supplier: string;
  supplierId: string;
  date: string;
  expectedDate: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  discount?: number;
  subtotal: number;
}

export const usePurchaseOrdersERP = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cargar órdenes desde IndexedDB
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const dbOrders = await localDb.compras_maestro?.toArray() || [];
      const mappedOrders: PurchaseOrder[] = dbOrders.map((ord: any) => ({
        id: ord.id,
        supplier: ord.proveedor_nombre || ord.supplier || '',
        supplierId: ord.proveedor_id || '',
        date: ord.fecha || ord.created_at,
        expectedDate: ord.fecha_entrega || ord.expectedDate,
        items: ord.items ? JSON.parse(ord.items) : [],
        subtotal: ord.subtotal || 0,
        tax: ord.tax || ord.iva || 0,
        total: ord.total || 0,
        status: mapStatus(ord.status),
        notes: ord.notes,
      }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('[usePurchaseOrdersERP] Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mapear status del formato BD al formato UI
  const mapStatus = (status: string): PurchaseOrder['status'] => {
    const statusMap: Record<string, PurchaseOrder['status']> = {
      'draft': 'draft',
      'borrador': 'draft',
      'pending': 'pending',
      'pendiente': 'pending',
      'approved': 'approved',
      'aprobada': 'approved',
      'received': 'received',
      'recibida': 'received',
      'cancelled': 'cancelled',
      'anulada': 'cancelled',
    };
    return statusMap[status?.toLowerCase()] || 'pending';
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filtrar órdenes
  const filteredOrders = orders.filter(ord => {
    const matchesSearch = !searchQuery || 
      ord.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(ord => ord.status === 'pending').length,
    approved: orders.filter(ord => ord.status === 'approved').length,
    received: orders.filter(ord => ord.status === 'received').length,
    cancelled: orders.filter(ord => ord.status === 'cancelled').length,
  };

  /**
   * Crear orden de compra con integración ERP
   */
  const createOrder = async (order: Omit<PurchaseOrder, 'id'>): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    try {
      const purchaseData: Omit<PurchaseDocument, 'id'> = {
        supplier: order.supplier,
        supplierId: order.supplierId,
        supplierRif: '',
        date: order.date,
        expectedDeliveryDate: order.expectedDate,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          discount: 0,
          subtotal: item.subtotal,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        currency: 'VES',
        paymentMethod: 'credit',
        status: 'pending',
        notes: order.notes,
      };

      const result: PurchasesERPResult = await purchasesERPService.createPurchaseOrder(purchaseData);

      if (result.success) {
        await loadOrders();
        return { success: true, orderId: result.purchase?.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[usePurchaseOrdersERP] Error creando orden:', error);
      return { success: false, error: String(error) };
    }
  };

  /**
   * Aprobar orden de compra
   */
  const approveOrder = async (id: string): Promise<boolean> => {
    try {
      const result = await purchasesERPService.approvePurchaseOrder(id);
      if (result.success) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[usePurchaseOrdersERP] Error aprobando orden:', error);
      return false;
    }
  };

  /**
   * Receiving orden de compra (marcar como recibida)
   */
  const receiveOrder = async (id: string): Promise<boolean> => {
    try {
      const order = orders.find(o => o.id === id);
      if (order) {
        const result = await purchasesERPService.receivePurchase(id);
        if (result.success) {
          await loadOrders();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[usePurchaseOrdersERP] Error recibiendo orden:', error);
      return false;
    }
  };

  /**
   * Cancelar orden
   */
  const cancelOrder = async (id: string): Promise<boolean> => {
    try {
      await localDb.compras_maestro?.update(id, { status: 'cancelled' } as any);
      await loadOrders();
      return true;
    } catch (error) {
      console.error('[usePurchaseOrdersERP] Error cancelando orden:', error);
      return false;
    }
  };

  return {
    orders: filteredOrders,
    allOrders: orders,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createOrder,
    approveOrder,
    receiveOrder,
    cancelOrder,
    refresh: loadOrders,
  };
};

export default usePurchaseOrdersERP;
