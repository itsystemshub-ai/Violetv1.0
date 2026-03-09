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

  // Carga de facturas reales desde el API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/invoices');
        if (!response.ok) throw new Error('Error al cargar facturas');
        const data = await response.json();
        
        // Mapear campos si es necesario
        setInvoices(data.map((inv: any) => ({
          id: inv.invoice_number || inv.id,
          client: inv.customer_name,
          clientId: inv.customer_rif,
          date: inv.created_at?.split('T')[0],
          dueDate: inv.due_date,
          amount: inv.subtotal,
          tax: inv.tax,
          total: inv.total,
          status: inv.status,
          items: JSON.parse(inv.items || '[]'),
          paymentMethod: inv.payment_method
        })));
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
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
