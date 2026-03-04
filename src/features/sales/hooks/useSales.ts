import { useState, useCallback } from 'react';
import { Product } from '@/lib/index';
import { toast } from 'sonner';
import { useSystemConfig } from '../../../modules/settings/hooks/useSystemConfig';
import { useSalesStore } from './useSalesStore';
import { NetworkService } from '@/services/LocalNetworkService';
import { AccountingService } from '@/lib/AccountingService';
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
 * 
 * Proporciona funcionalidades completas de ventas incluyendo:
 * - Procesamiento atómico de ventas con descuento de stock
 * - Generación automática de asientos contables
 * - Soporte para ventas y órdenes de compra
 * - Sincronización con servidor maestro y fallback local
 * - Gestión de facturas con CRUD completo
 * 
 * @returns {Object} Objeto con funciones y estado de ventas
 * @returns {Invoice[]} invoices - Lista de facturas del tenant activo
 * @returns {boolean} isProcessing - Estado de procesamiento de venta
 * @returns {boolean} isFetching - Estado de carga de facturas
 * @returns {Function} processSale - Procesa una venta completa
 * @returns {Function} fetchInvoices - Carga historial de facturas
 * @returns {Function} deleteInvoice - Elimina una factura
 * 
 * @example
 * ```typescript
 * const { processSale, invoices, isProcessing } = useSales();
 * 
 * // Procesar venta
 * const result = await processSale(
 *   'Cliente S.A.',
 *   'J-12345678-9',
 *   cart,
 *   subtotal,
 *   taxIva,
 *   taxIgtf,
 *   total,
 *   { type: 'venta', controlNumber: 'FACT-001' }
 * );
 * 
 * if (result.success) {
 *   console.log('Venta procesada:', result.data.invoiceId);
 * }
 * ```
 * 
 * @architecture
 * - Usa arquitectura horizontal con microservicio de ventas
 * - Genera asientos contables automáticos vía AccountingService
 * - Sincronización con servidor maestro cuando está disponible
 * - Fallback a cola local de sincronización
 * 
 * @integration
 * - useSalesStore: Estado global de facturas
 * - useSystemConfig: Tenant activo
 * - NetworkService: Comunicación con servidor maestro
 * - AccountingService: Asientos contables automáticos
 * - ventasService: Microservicio de ventas
 */
export const useSales = () => {
  const { invoices, isLoading: isFetching, fetchInvoices: storeFetch } = useSalesStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { activeTenantId } = useSystemConfig();

  /**
   * Procesa una venta de forma atómica con descuento de stock automático.
   * 
   * Proceso completo:
   * 1. Valida que haya tenant activo
   * 2. Genera número de factura automático
   * 3. Crea registro de factura con items
   * 4. Intenta sincronizar con servidor maestro
   * 5. Si falla, usa microservicio local de ventas
   * 6. Genera asiento contable automático
   * 7. Muestra notificación de éxito/error
   * 8. Notifica al sistema central
   * 
   * @param {string} customerName - Nombre del cliente
   * @param {string} customerRif - RIF del cliente
   * @param {Array} cart - Carrito con productos y cantidades
   * @param {number} subtotal - Subtotal de la venta
   * @param {number} taxIva - Impuesto IVA calculado
   * @param {number} taxIgtf - Impuesto IGTF calculado
   * @param {number} total - Total de la venta
   * @param {InvoiceMetadata} [metadata] - Metadata adicional (tipo, tasa, notas)
   * @param {string} [sellerId] - ID del vendedor
   * @returns {Promise<CrudResponse<{invoiceId: string}>>} Respuesta con ID de factura o error
   * 
   * @example
   * ```typescript
   * const cart = [
   *   { product: producto1, quantity: 2 },
   *   { product: producto2, quantity: 5 }
   * ];
   * 
   * const result = await processSale(
   *   'Empresa XYZ, C.A.',
   *   'J-12345678-9',
   *   cart,
   *   100.00,
   *   16.00,
   *   3.00,
   *   119.00,
   *   {
   *     type: 'venta',
   *     controlNumber: 'FACT-2026-00123',
   *     exchangeRateUsed: 36.50,
   *     totalVES: 4345.50,
   *     notes: 'Pago en efectivo'
   *   },
   *   'seller-id-123'
   * );
   * ```
   * 
   * @atomicity
   * - La venta y el descuento de stock son atómicos
   * - Si falla el descuento, se revierte la factura
   * - Usa transacciones de base de datos
   * 
   * @accounting
   * - Genera asiento contable automático en Libro Mayor
   * - Débito: Cuentas por Cobrar
   * - Crédito: Ventas
   * - Si falla contabilidad, no bloquea la venta (solo log)
   * 
   * @throws {Error} Si no hay tenant activo o error crítico en procesamiento
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
      
      // Generar número de control secuencial para pedidos
      let invoiceNumber = metadata?.controlNumber;
      if (!invoiceNumber) {
        if (metadata?.type === 'pedido') {
          // Para pedidos, generar número de control secuencial
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
          // Para ventas, usar timestamp temporal (se asignará número al aprobar)
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

      // Intentamos usar el API del servidor maestro si está disponible
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
        // Horizontal Architecture: Si no hay servidor directo, se delega al microservicio de ventas
        try {
          await ventasService.processSale(invoiceData, actTenantId);
          success = true;
        } catch (ventasError: any) {
          // Si es error de stock, mostrarlo al usuario
          if (ventasError.message && ventasError.message.includes('Stock insuficiente')) {
            toast.error(ventasError.message, { duration: 8000 });
            return { success: false, error: ventasError };
          }
          throw ventasError;
        }
      }

      // --- ASIENTO CONTABLE AUTOMÁTICO ---
      // Registramos el movimiento en el Libro Mayor
      try {
        await AccountingService.postSale(invoiceData as any);
      } catch (accError) {
        console.error('[useSales:Accounting] Failed to post automated entry:', accError);
        // No bloqueamos la venta si falla la contabilidad, pero lo logueamos
      }

      const successMsg = metadata?.type === 'pedido' ? 'Orden de compra generada con éxito' : 'Venta procesada con éxito';
      toast.success(`${successMsg}. Folio: ${invoiceId}`);

      // Notificar al sistema
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
      // 0. Obtener la factura antes de eliminarla para verificar si necesita devolución de stock
      const invoice = await localDb.invoices.get(id);
      
      if (!invoice) {
        toast.error('Factura no encontrada');
        return false;
      }

      // Si la factura está aprobada (tipo venta), devolver el stock
      if (invoice.type === 'venta' && invoice.items && invoice.items.length > 0) {
        // Devolver stock de cada producto
        for (const item of invoice.items) {
          const product = await localDb.products.get(item.product_id);
          if (!product) continue;

          const newStock = product.stock + item.quantity;
          
          await localDb.products.update(item.product_id, {
            stock: newStock,
            updated_at: new Date().toISOString(),
            is_dirty: 1
          });

          // Registrar movimiento de inventario (devolución)
          await localDb.inventory_movements.add({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity, // Positivo porque es devolución
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

      // 1. Intentar eliminar de Supabase (no bloqueante)
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Error deleting from Supabase (non-blocking):', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, continuing with local deletion:', supabaseError);
      }

      // 2. Delete from Local DB (siempre se ejecuta)
      await localDb.invoices.delete(id);
      
      // 3. Refresh Store
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

  /**
   * Carga el historial de facturas.
   */
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
