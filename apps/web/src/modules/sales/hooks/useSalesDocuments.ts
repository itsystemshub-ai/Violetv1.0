/**
 * useSalesDocuments - Hook unificado para pedidos y facturas
 */

import { useState, useEffect, useCallback } from 'react';
import { SalesDocument, SalesFlowService } from '@/services/SalesFlowService';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { toast } from 'sonner';

export const useSalesDocuments = () => {
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeTenantId } = useSystemConfig();

  const fetchDocuments = useCallback(async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const data = await localDb.invoices
        .where('tenant_id')
        .equals(activeTenantId)
        .toArray();
      
      const mappedDocs: SalesDocument[] = data.map(q => ({
        id: q.id,
        code: q.number || q.id.slice(0, 8),
        type: q.type === 'venta' ? 'invoice' : 'order',
        recipientType: 'client',
        recipientId: q.customerId || q.customerRif || '',
        recipientName: q.customerName || 'Consumidor Final',
        items: (q.items || []).map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          productId: item.product_id,
          productName: item.name || item.product_name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total || (item.price * item.quantity)
        })),
        currency: q.metadata?.currency || 'USD',
        paymentMethod: q.metadata?.paymentMethod,
        subtotal: q.subtotal,
        tax: q.taxTotal,
        taxRate: q.metadata?.taxRate || 0,
        total: q.total,
        status: (q.status as any) || 'pending',
        notes: q.notes,
        createdAt: q.date,
        updatedAt: q.updated_at || q.date,
        createdBy: q.metadata?.createdBy || 'System',
        sourceOrderId: q.metadata?.sourceOrderId,
        convertedToInvoiceId: q.metadata?.convertedToInvoiceId
      }));
      
      setDocuments(mappedDocs);
    } catch (error) {
      console.error('Error fetching sales documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = async (doc: SalesDocument) => {
    if (!activeTenantId) return;
    
    const dbType = doc.type === 'invoice' ? 'venta' : 'pedido';
    
    const newDoc = {
      id: doc.id || `DOC-${Date.now()}`,
      number: doc.code,
      tenant_id: activeTenantId,
      customerName: doc.recipientName,
      customerRif: doc.recipientId,
      date: doc.createdAt || new Date().toISOString(),
      subtotal: doc.subtotal,
      taxTotal: doc.tax,
      total: doc.total,
      status: doc.status,
      type: dbType,
      items: doc.items.map(item => ({
        product_id: item.productId,
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        total: item.total
      })),
      notes: doc.notes,
      metadata: { 
        currency: doc.currency, 
        paymentMethod: doc.paymentMethod,
        taxRate: doc.taxRate,
        createdBy: doc.createdBy,
        sourceOrderId: doc.sourceOrderId,
        convertedToInvoiceId: doc.convertedToInvoiceId
      },
      updated_at: new Date().toISOString(),
      is_dirty: 1
    };

    try {
      await localDb.invoices.add(newDoc as any);
      toast.success('Documento creado');
      fetchDocuments();
      return doc;
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Error al crear documento');
    }
  };

  const updateDocument = async (id: string, updates: Partial<SalesDocument>) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Documento no encontrado');

    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.notes) dbUpdates.notes = updates.notes;
    
    // Si hay metadatos, recuperarlos y mezclarlos
    const metadata = { ...(doc as any).metadata, ...updates }; // Simplificación
    dbUpdates.metadata = metadata;
    
    dbUpdates.updated_at = new Date().toISOString();
    dbUpdates.is_dirty = 1;

    try {
      await localDb.invoices.update(id, dbUpdates);
      toast.success('Documento actualizado');
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Error al actualizar documento');
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await localDb.invoices.delete(id);
      toast.success('Documento eliminado');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar documento');
    }
  };

  const approveDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Documento no encontrado');

    const approved = SalesFlowService.approveDocument(doc);
    updateDocument(id, { status: approved.status });
    return approved;
  };

  const rejectDocument = (id: string, reason?: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Documento no encontrado');

    const rejected = SalesFlowService.rejectDocument(doc, reason);
    updateDocument(id, { status: rejected.status, notes: rejected.notes });
  };

  const cancelDocument = (id: string, reason?: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) throw new Error('Documento no encontrado');

    const cancelled = SalesFlowService.cancelDocument(doc, reason);
    updateDocument(id, { status: cancelled.status, notes: cancelled.notes });
  };

  const convertOrderToInvoice = async (orderId: string) => {
    const order = documents.find(d => d.id === orderId);
    if (!order) throw new Error('Pedido no encontrado');

    const invoice = SalesFlowService.convertOrderToInvoice(order);
    
    // Crear la factura
    await createDocument(invoice);
    
    // Actualizar pedido
    await updateDocument(orderId, { convertedToInvoiceId: invoice.id });
    
    return invoice;
  };

  // Filtros por tipo
  const orders = documents.filter(d => d.type === 'order');
  const invoices = documents.filter(d => d.type === 'invoice');

  // Estadísticas
  const stats = {
    orders: {
      total: orders.length,
      pending: orders.filter(d => d.status === 'pending').length,
      approved: orders.filter(d => d.status === 'approved').length,
      completed: orders.filter(d => d.status === 'completed').length,
      cancelled: orders.filter(d => d.status === 'cancelled').length,
      totalAmount: orders.reduce((sum, d) => sum + d.total, 0),
    },
    invoices: {
      total: invoices.length,
      pending: invoices.filter(d => d.status === 'pending').length,
      approved: invoices.filter(d => d.status === 'approved').length,
      cancelled: invoices.filter(d => d.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, d) => sum + d.total, 0),
    },
  };

  return {
    documents,
    orders,
    invoices,
    loading,
    stats,
    createDocument,
    updateDocument,
    deleteDocument,
    approveDocument,
    rejectDocument,
    cancelDocument,
    convertOrderToInvoice,
    changeCurrency: async (id: string, newCurrency: 'USD' | 'VES') => {
      const doc = documents.find(d => d.id === id);
      if (!doc) throw new Error('Documento no encontrado');
      const recalculated = SalesFlowService.recalculateWithCurrency(doc, newCurrency);
      await updateDocument(id, recalculated as any);
    },
    changePaymentMethod: async (id: string, paymentMethod: any) => {
      await updateDocument(id, { paymentMethod });
    },
    refresh: fetchDocuments
  };
};
