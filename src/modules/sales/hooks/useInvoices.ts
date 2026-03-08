/**
 * useInvoices - Hook para gestión de facturas
 */

import { useState, useEffect } from 'react';

export interface Invoice {
  id: string;
  client: string;
  clientId: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
  paymentMethod?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - En producción esto vendría de IndexedDB
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: 'INV-001',
        client: 'Empresa ABC',
        clientId: 'CLI-001',
        date: '2026-03-06',
        dueDate: '2026-03-20',
        amount: 15000,
        tax: 2400,
        total: 17400,
        status: 'paid',
        items: [
          { id: '1', productId: 'P001', productName: 'Producto A', quantity: 10, price: 1000, discount: 0, subtotal: 10000 },
          { id: '2', productId: 'P002', productName: 'Producto B', quantity: 5, price: 1000, discount: 0, subtotal: 5000 },
        ],
        paymentMethod: 'Transferencia',
      },
      {
        id: 'INV-002',
        client: 'Comercial XYZ',
        clientId: 'CLI-002',
        date: '2026-03-05',
        dueDate: '2026-03-19',
        amount: 8500,
        tax: 1360,
        total: 9860,
        status: 'pending',
        items: [
          { id: '1', productId: 'P003', productName: 'Producto C', quantity: 17, price: 500, discount: 0, subtotal: 8500 },
        ],
      },
      {
        id: 'INV-003',
        client: 'Distribuidora 123',
        clientId: 'CLI-003',
        date: '2026-03-04',
        dueDate: '2026-03-10',
        amount: 22000,
        tax: 3520,
        total: 25520,
        status: 'overdue',
        items: [
          { id: '1', productId: 'P004', productName: 'Producto D', quantity: 20, price: 1100, discount: 0, subtotal: 22000 },
        ],
      },
      {
        id: 'INV-004',
        client: 'Tienda DEF',
        clientId: 'CLI-004',
        date: '2026-03-03',
        dueDate: '2026-03-17',
        amount: 12500,
        tax: 2000,
        total: 14500,
        status: 'paid',
        items: [
          { id: '1', productId: 'P005', productName: 'Producto E', quantity: 25, price: 500, discount: 0, subtotal: 12500 },
        ],
        paymentMethod: 'Efectivo',
      },
      {
        id: 'INV-005',
        client: 'Empresa ABC',
        clientId: 'CLI-001',
        date: '2026-03-02',
        dueDate: '2026-03-16',
        amount: 18000,
        tax: 2880,
        total: 20880,
        status: 'pending',
        items: [
          { id: '1', productId: 'P001', productName: 'Producto A', quantity: 18, price: 1000, discount: 0, subtotal: 18000 },
        ],
      },
    ];

    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  // Filtrar facturas
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estadísticas
  const stats = {
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalInvoices: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
  };

  // Acciones
  const createInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
    };
    setInvoices([newInvoice, ...invoices]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(invoices.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  const markAsPaid = (id: string, paymentMethod: string) => {
    updateInvoice(id, { status: 'paid', paymentMethod });
  };

  const cancelInvoice = (id: string) => {
    updateInvoice(id, { status: 'cancelled' });
  };

  return {
    invoices: filteredInvoices,
    allInvoices: invoices,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    cancelInvoice,
  };
};
