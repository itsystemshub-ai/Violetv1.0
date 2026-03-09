/**
 * useOrders - Hook para gestión de pedidos
 * Conectado con localDb para datos reales
 */

import { useState, useEffect } from 'react';
import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';

export interface Order {
  id: string;
  client: string;
  clientId: string;
  date: string;
  deliveryDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cargar pedidos desde localDb
  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await localDb.orders?.toArray() || [];
      setOrders(ordersData as Order[]);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      toast.error('Error al cargar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalAmount: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newOrder: Order = {
        ...order,
        id: `PED-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await localDb.orders?.add(newOrder as any);
      await loadOrders();
      toast.success('Pedido creado exitosamente');
    } catch (error) {
      console.error('Error creando pedido:', error);
      toast.error('Error al crear pedido');
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      await localDb.orders?.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await loadOrders();
      toast.success('Pedido actualizado');
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      toast.error('Error al actualizar pedido');
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await localDb.orders?.delete(id);
      await loadOrders();
      toast.success('Pedido eliminado');
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      toast.error('Error al eliminar pedido');
    }
  };

  const processOrder = (id: string) => {
    updateOrder(id, { status: 'processing' });
  };

  const shipOrder = (id: string, trackingNumber: string) => {
    updateOrder(id, { status: 'shipped', trackingNumber });
  };

  const deliverOrder = (id: string) => {
    updateOrder(id, { status: 'delivered' });
  };

  const cancelOrder = (id: string) => {
    updateOrder(id, { status: 'cancelled' });
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
    processOrder,
    shipOrder,
    deliverOrder,
    cancelOrder,
    refreshOrders: loadOrders,
  };
};
