import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { toast } from 'sonner';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  supplierId: string;
  deliveryDate: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  paymentTerms: number;
  warehouse: string;
  warehouseId: string;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  receivedDate?: string;
  notes?: string;
  tenant_id: string;
}

export const usePurchaseOrders = () => {
  const { tenant } = useSystemConfig();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    if (!tenant.id || tenant.id === 'none') {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await localDb.compras_maestro
        .where('tenant_id')
        .equals(tenant.id)
        .toArray();
      
      const fullOrders = await Promise.all(
        data.map(async (o) => {
          const items = await localDb.compras_detalle
            .where('compra_id')
            .equals(o.id)
            .toArray();
          return {
            ...o,
            items: items.map(i => ({
              id: i.id,
              productId: i.producto_id,
              productName: i.product_name,
              sku: i.sku,
              quantity: i.cantidad,
              price: i.precio_unitario,
              subtotal: i.subtotal
            }))
          };
        })
      );

      setOrders(fullOrders as unknown as PurchaseOrder[]);
    } catch (error) {
      console.error("[usePurchaseOrders] Error fetching orders:", error);
      toast.error("Error al cargar órdenes de compra.");
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    approvedOrders: orders.filter(o => o.status === 'approved').length,
    receivedOrders: orders.filter(o => o.status === 'received').length,
    totalAmount: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    totalPending: orders.filter(o => o.status === 'pending' || o.status === 'approved').reduce((sum, o) => sum + o.total, 0),
    thisMonthCount: orders.filter(o => {
      const orderDate = new Date(o.date);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const createOrder = async (data: Omit<PurchaseOrder, 'id' | 'tenant_id'>) => {
    if (!tenant.id) return;

    const id = crypto.randomUUID();
    const newOrder: PurchaseOrder = {
      ...data,
      id,
      tenant_id: tenant.id,
    };

    try {
      // Guardar maestro
      await localDb.compras_maestro.add({
        id,
        tenant_id: tenant.id,
        date: newOrder.date,
        supplier_id: newOrder.supplierId,
        supplier_name: newOrder.supplier,
        num_factura: id, // O un correlativo
        total: newOrder.total,
        status: newOrder.status,
        created_at: new Date().toISOString()
      });

      // Guardar detalles
      const details = newOrder.items.map(item => ({
        id: crypto.randomUUID(),
        compra_id: id,
        tenant_id: tenant.id!,
        producto_id: item.productId,
        product_name: item.productName,
        sku: item.sku,
        cantidad: item.quantity,
        precio_unitario: item.price,
        subtotal: item.subtotal
      }));
      await localDb.compras_detalle.bulkAdd(details);

      setOrders([newOrder, ...orders]);
      toast.success("Orden de compra creada.");
    } catch (error) {
      console.error("[usePurchaseOrders] Error creating order:", error);
      toast.error("Error al crear la orden.");
    }
  };

  const updateOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    try {
      await localDb.compras_maestro.update(id, updates);
      setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
    } catch (error) {
       console.error("[usePurchaseOrders] Error updating order:", error);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await localDb.compras_maestro.delete(id);
      await localDb.compras_detalle.where('compra_id').equals(id).delete();
      setOrders(orders.filter(o => o.id !== id));
      toast.success("Orden eliminada.");
    } catch (error) {
      console.error("[usePurchaseOrders] Error deleting order:", error);
    }
  };

  const approveOrder = (id: string, approvedBy: string) => {
    updateOrder(id, { 
      status: 'approved',
      approvedBy,
      approvedDate: new Date().toISOString().split('T')[0],
    });
  };

  const receiveOrder = (id: string) => {
    updateOrder(id, { 
      status: 'received',
      receivedDate: new Date().toISOString().split('T')[0],
    });
  };

  const cancelOrder = (id: string) => {
    updateOrder(id, { status: 'cancelled' });
  };

  const submitForApproval = (id: string) => {
    updateOrder(id, { status: 'pending' });
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
    updateOrder,
    deleteOrder,
    approveOrder,
    receiveOrder,
    cancelOrder,
    submitForApproval,
  };
};
