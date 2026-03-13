/**
 * useInvoicesERP - Hook para gestión de facturas con integración ERP
 * 
 * Este hook usa salesERPService para crear transacciones ERP
 * cuando se crean, actualizan o cancelan facturas.
 * 
 * @module sales/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { salesERPService, type SaleDocument, type SalesERPResult } from '../services/SalesERPService';
import { localDb } from '@/core/database/localDb';

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

export const useInvoicesERP = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Cargar facturas desde IndexedDB
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const dbInvoices = await localDb.invoices?.toArray() || [];
      // Mapear campos al formato del hook
      const mappedInvoices: Invoice[] = dbInvoices.map((inv: any) => ({
        id: inv.id,
        client: inv.client || inv.customerName || '',
        clientId: inv.clientId || '',
        date: inv.date || inv.created_at,
        dueDate: inv.dueDate || inv.date,
        amount: inv.subtotal || inv.amount || 0,
        tax: inv.tax || 0,
        total: inv.total || 0,
        status: mapStatus(inv.status),
        items: inv.items ? JSON.parse(inv.items) : [],
        notes: inv.notes,
        paymentMethod: inv.payment_method || inv.paymentMethod,
      }));
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('[useInvoicesERP] Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mapear status del formato BD al formato UI
  const mapStatus = (status: string): Invoice['status'] => {
    const statusMap: Record<string, Invoice['status']> = {
      'paid': 'paid',
      'pagada': 'paid',
      'pending': 'pending',
      'pendiente': 'pending',
      'overdue': 'overdue',
      'vencida': 'overdue',
      'cancelled': 'cancelled',
      'anulada': 'cancelled',
    };
    return statusMap[status?.toLowerCase()] || 'pending';
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Filtrar facturas
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    totalInvoices: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
  };

  /**
   * Crear factura con integración ERP
   */
  const createInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<{ success: boolean; invoiceId?: string; error?: string }> => {
    try {
      const saleData: Omit<SaleDocument, 'id'> = {
        client: invoice.client,
        clientId: invoice.clientId,
        clientRif: '',
        date: invoice.date,
        dueDate: invoice.dueDate,
        items: invoice.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal,
        })),
        subtotal: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        currency: 'VES',
        paymentMethod: invoice.paymentMethod || 'cash',
        status: 'pending',
        notes: invoice.notes,
      };

      const result: SalesERPResult = await salesERPService.createSale(saleData);

      if (result.success) {
        await loadInvoices();
        return { success: true, invoiceId: result.sale?.id };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[useInvoicesERP] Error creando factura:', error);
      return { success: false, error: String(error) };
    }
  };

  /**
   * Actualizar factura
   */
  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<boolean> => {
    try {
      await localDb.invoices?.update(id, updates as any);
      await loadInvoices();
      return true;
    } catch (error) {
      console.error('[useInvoicesERP] Error actualizando factura:', error);
      return false;
    }
  };

  /**
   * Eliminar factura
   */
  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      await updateInvoice(id, { status: 'cancelled' });
      return true;
    } catch (error) {
      console.error('[useInvoicesERP] Error eliminando factura:', error);
      return false;
    }
  };

  /**
   * Marcar como pagada
   */
  const markAsPaid = async (id: string, paymentMethod: string): Promise<boolean> => {
    try {
      await updateInvoice(id, { status: 'paid', paymentMethod });
      return true;
    } catch (error) {
      console.error('[useInvoicesERP] Error marcando como pagada:', error);
      return false;
    }
  };

  /**
   * Cancelar factura
   */
  const cancelInvoice = async (id: string): Promise<boolean> => {
    try {
      await updateInvoice(id, { status: 'cancelled' });
      return true;
    } catch (error) {
      console.error('[useInvoicesERP] Error cancelando factura:', error);
      return false;
    }
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
    refresh: loadInvoices,
  };
};

export default useInvoicesERP;
