import { useState, useCallback } from 'react';
import { Product } from '@/lib/index';
import { toast } from 'sonner';
import { useSystemConfig } from '../../../modules/settings/hooks/useSystemConfig';
import { useSalesStore } from './useSalesStore';
import { NetworkService } from '@/services/LocalNetworkService';
import { AccountingService } from '@/modules/finance/services/accounting.service';
import { ventasService } from '@/services/microservices/ventas/VentasService';
import { supabase } from '@/lib/supabase';
import { localDb } from "@/core/database/localDb";
import { useNotificationStore } from '../../../shared/hooks/useNotificationStore';
import type { InvoiceDB, CrudResponse } from '@/types/database.types';

/**
 * Metadata de factura
 */
interface InvoiceMetadata {
  type?: 'venta' | 'compra' | 'pedido';
  controlNumber?: string;
  exchangeRateUsed?: number;
  totalVES?: number;
  notes?: string;
  taxIgtf?: number;
  [key: string]: any;
}

/**
 * Hook personalizado para gestionar ventas y facturación en Violet ERP.
 */
export const useSales = () => {
  const { invoices, isLoading: isFetching, fetchInvoices: storeFetch } = useSalesStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { activeTenantId } = useSystemConfig();

  /**
   * Procesa una venta de forma atómica con descuento de stock automático.
   */
  const processSale = async (
    customerName: string,
    customerRif: string,
    cart: { product: Product, quantity: number }[],
    subtotal: number,
    taxIva: number,
    taxIgtf: number,
    total: number,
    metadata?: InvoiceMetadata,
    sellerId?: string
  ): Promise<CrudResponse<{ invoiceId: string }>> => {
    const currentState = useSystemConfig.getState();
    const actTenantId = currentState.activeTenantId;
    
    if (!actTenantId || actTenantId === 'none') {
      toast.error('No hay una empresa activa seleccionada.');
      return { success: false, error: new Error('No hay una empresa activa seleccionada.') };
    }

    setIsProcessing(true);
    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.cauplas || item.product.id,
        description: item.product.name,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.precioFCA || item.product.price,
        tax: 0
      }));

      const tempId = crypto.randomUUID();
      
      let invoiceNumber = metadata?.controlNumber;
      if (!invoiceNumber) {
        if (metadata?.type === 'pedido') {
          const existingOrders = await localDb.invoices
            .where('tenant_id')
            .equals(actTenantId)
            .and(inv => inv.type === 'pedido')
            .toArray();
          
          const maxControlNumber = existingOrders.reduce((max, inv) => {
            const match = inv.number.match(/DOC-(\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              return num > max ? num : max;
            }
            return max;
          }, 0);
          
          invoiceNumber = `DOC-${String(maxControlNumber + 1).padStart(4, '0')}`;
        } else {
          invoiceNumber = `TEMP-${Date.now().toString().slice(-6)}`;
        }
      }

      const invoiceData: InvoiceDB = {
        id: tempId,
        tenant_id: actTenantId,
        number: metadata?.controlNumber || invoiceNumber,
        customer_name: customerName,
        customer_rif: customerRif,
        customer_empresa: metadata?.empresa,
        customer_contacto: metadata?.contacto,
        customer_email: metadata?.email,
        customer_direccion: metadata?.direccion,
        seller_id: sellerId,
        date: new Date().toISOString(),
        subtotal,
        tax_total: taxIva,
        tax_igtf: taxIgtf,
        total,
        status: metadata?.type === 'pedido' ? 'pending' : 'paid',
        items,
        type: metadata?.type || 'venta',
        exchange_rate_used: metadata?.exchangeRateUsed,
        total_ves: metadata?.totalVES,
        notes: metadata?.notes,
        metadata: { ...metadata, taxIgtf },
        updated_at: new Date().toISOString()
      };

      let success = false;
      let invoiceId = tempId;

      if (navigator.onLine) {
        try {
          const response = await fetch(`${NetworkService.getServerUrl()}/api/transactions/sale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...invoiceData, tenantId: actTenantId })
          });
          const data = await response.json();
          if (data.success) {
            success = true;
            invoiceId = data.invoiceId;
            invoiceData.id = invoiceId;
            await localDb.invoices.put(invoiceData as any);
          }
        } catch (err) {
          console.warn('[useSales] Master server unreachable, falling back to SyncService local queue.');
        }
      }

      if (!success) {
        try {
          await ventasService.processSale(invoiceData, actTenantId);
          success = true;
        } catch (ventasError: any) {
          if (ventasError.message && ventasError.message.includes('Stock insuficiente')) {
            toast.error(ventasError.message, { duration: 8000 });
            return { success: false, error: ventasError };
          }
          throw ventasError;
        }
      }

      try {
        await AccountingService.postSale(invoiceData as any);
      } catch (accError) {
        console.error('[useSales:Accounting] Failed to post automated entry:', accError);
      }

      const successMsg = metadata?.type === 'pedido' ? 'Orden de compra generada con éxito' : 'Venta procesada con éxito';
      toast.success(`${successMsg}. Folio: ${invoiceId}`);

      useNotificationStore.getState().addNotification({
        module: 'Ventas',
        type: 'success',
        title: metadata?.type === 'pedido' ? 'Nuevo Pedido' : 'Venta Registrada',
        message: `${successMsg} para ${customerName} por un total de ${total.toFixed(2)} USD.`,
      });

      return { success: true, data: { invoiceId } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error crítico al procesar la venta.';
      console.error('Error processing sale:', error);
      toast.error(errorMessage);
      return { success: false, error: error instanceof Error ? error : new Error(errorMessage) };
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const invoice = await localDb.invoices.get(id);
      if (!invoice) {
        toast.error('Factura no encontrada');
        return false;
      }

      if (invoice.type === 'venta' && invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const product = await localDb.products.get(item.product_id);
          if (!product) continue;
          const newStock = product.stock + item.quantity;
          await localDb.products.update(item.product_id, {
            stock: newStock,
            updated_at: new Date().toISOString(),
            is_dirty: 1
          });
          await localDb.inventory_movements.add({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity,
            type: 'return',
            reference_id: invoice.id,
            reference_type: 'invoice_deletion',
            previous_stock: product.stock,
            new_stock: newStock,
            tenant_id: activeTenantId || '',
            created_at: new Date().toISOString()
          });
        }
        toast.success(`Stock devuelto: ${invoice.items.length} producto(s) restaurado(s)`);
      }

      try {
        await supabase.from('invoices').delete().eq('id', id);
      } catch (supabaseError) {
        console.warn('Supabase not available, continuing with local deletion');
      }

      await localDb.invoices.delete(id);
      if (activeTenantId) {
        await storeFetch(activeTenantId);
      }
      toast.success('Documento eliminado correctamente.');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el documento.';
      console.error('Error deleting invoice:', error);
      toast.error(errorMessage);
      return false;
    }
  };

  const fetchInvoices = useCallback(async () => {
    if (activeTenantId) {
      await storeFetch(activeTenantId);
    }
  }, [activeTenantId, storeFetch]);

  return {
    invoices,
    isProcessing,
    isFetching,
    processSale,
    fetchInvoices,
    deleteInvoice
  };
};
