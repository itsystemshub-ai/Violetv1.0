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
    const mockOrders: Order[] = [
      {
        id: 'PED-001',
        client: 'Empresa ABC',
        clientId: 'CLI-001',
        date: '2026-03-06',
        deliveryDate: '2026-03-10',
        amount: 15000,
        tax: 2400,
        total: 17400,
        status: 'processing',
        items: [
          { id: '1', productId: 'P001', productName: 'Producto A', quantity: 10, price: 1000, discount: 0, subtotal: 10000 },
          { id: '2', productId: 'P002', productName: 'Producto B', quantity: 5, price: 1000, discount: 0, subtotal: 5000 },
        ],
        shippingAddress: 'Calle Principal 123, Ciudad',
        notes: 'Entrega en horario de oficina',
      },
      {
        id: 'PED-002',
        client: 'Comercial XYZ',
        clientId: 'CLI-002',
        date: '2026-03-05',
        deliveryDate: '2026-03-08',
        amount: 8500,
        tax: 1360,
        total: 9860,
        status: 'shipped',
        items: [
          { id: '1', productId: 'P003', productName: 'Producto C', quantity: 17, price: 500, discount: 0, subtotal: 8500 },
        ],
        shippingAddress: 'Av. Comercial 456, Ciudad',
        trackingNumber: 'TRK-2026-001',
      },
      {
        id: 'PED-003',
        client: 'Distribuidora 123',
        clientId: 'CLI-003',
        date: '2026-03-04',
        deliveryDate: '2026-03-07',
        amount: 22000,
        tax: 3520,
        total: 25520,
        status: 'delivered',
        items: [
          { id: '1', productId: 'P004', productName: 'Producto D', quantity: 20, price: 1100, discount: 0, subtotal: 22000 },
        ],
        shippingAddress: 'Zona Industrial 789, Ciudad',
        trackingNumber: 'TRK-2026-002',
      },
      {
        id: 'PED-004',
        client: 'Tienda DEF',
        clientId: 'CLI-004',
        date: '2026-03-03',
        deliveryDate: '2026-03-09',
        amount: 12500,
        tax: 2000,
        total: 14500,
        status: 'pending',
        items: [
          { id: '1', productId: 'P005', productName: 'Producto E', quantity: 25, price: 500, discount: 0, subtotal: 12500 },
        ],
        shippingAddress: 'Centro Comercial, Local 10',
      },
      {
        id: 'PED-005',
        client: 'Empresa ABC',
        clientId: 'CLI-001',
        date: '2026-03-02',
        deliveryDate: '2026-03-06',
        amount: 18000,
        tax: 2880,
        total: 20880,
        status: 'shipped',
        items: [
          { id: '1', productId: 'P001', productName: 'Producto A', quantity: 18, price: 1000, discount: 0, subtotal: 18000 },
        ],
        shippingAddress: 'Calle Principal 123, Ciudad',
        trackingNumber: 'TRK-2026-003',
      },
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
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
