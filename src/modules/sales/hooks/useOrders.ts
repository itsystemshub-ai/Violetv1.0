/**
 * useOrders - Hook para gestión de pedidos
 */

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Cargar pedidos reales de la base de datos
    const loadOrders = async () => {
      try {
        // TODO: Implementar carga desde localDb o API
        // const realOrders = await localDb.orders.toArray();
        // setOrders(realOrders);
        setOrders([]); // Por ahora array vacío hasta que se implementen pedidos reales
        setLoading(false);
      } catch (error) {
        console.error('Error cargando pedidos:', error);
        setOrders([]);
        setLoading(false);
      }
    };

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

  const createOrder = (order: Omit<Order, 'id'>) => {
    const newOrder: Order = {
      ...order,
      id: `PED-${String(orders.length + 1).padStart(3, '0')}`,
    };
    setOrders([newOrder, ...orders]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => 
      o.id === id ? { ...o, ...updates } : o
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
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
  };
};
