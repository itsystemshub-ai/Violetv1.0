/**
 * usePurchaseOrders - Hook para gestión de órdenes de compra (Modular)
 */

import { useState, useEffect } from 'react';

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
}

export const usePurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mockOrders: PurchaseOrder[] = [
      {
        id: 'PO-001',
        date: '2026-03-06',
        supplier: 'Dell Inc.',
        supplierId: 'SUP-001',
        deliveryDate: '2026-03-20',
        items: [
          {
            id: 'ITEM-001',
            productId: 'PROD-001',
            productName: 'Laptop Dell Inspiron 15',
            sku: 'SKU-001',
            quantity: 20,
            price: 12000,
            subtotal: 240000,
          },
          {
            id: 'ITEM-002',
            productId: 'PROD-003',
            productName: 'Monitor Samsung 27" 4K',
            sku: 'SKU-003',
            quantity: 10,
            price: 6500,
            subtotal: 65000,
          },
        ],
        subtotal: 305000,
        tax: 48800,
        total: 353800,
        status: 'approved',
        paymentTerms: 30,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        createdBy: 'Juan Pérez',
        approvedBy: 'Director de Compras',
        approvedDate: '2026-03-06',
        notes: 'Orden urgente para reabastecimiento',
      },
      // ... (rest of mock data can be truncated for brevity or kept)
    ];

    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);

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

  const createOrder = (order: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: `PO-${String(orders.length + 1).padStart(3, '0')}`,
    };
    setOrders([newOrder, ...orders]);
  };

  const updateOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setOrders(orders.map(o => 
      o.id === id ? { ...o, ...updates } : o
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
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
