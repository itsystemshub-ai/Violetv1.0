/**
 * SalesFlowService - Servicio para gestionar el flujo de ventas
 * Cotización → Pedido → Factura
 */

import { CodeGeneratorService } from './CodeGeneratorService';

export type RecipientType = 'client' | 'salesperson';
export type Currency = 'USD' | 'VES';
export type PaymentMethod = 'cash_usd' | 'cash_ves' | 'transfer_usd' | 'transfer_ves' | 'card' | 'mixed';

export interface SalesDocument {
  id: string;
  code: string;
  type: 'order' | 'invoice';
  recipientType: RecipientType;
  recipientId: string;
  recipientName: string;
  items: SalesItem[];
  currency: Currency;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tax: number;
  taxRate: number; // Porcentaje de IVA aplicado
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Referencias al flujo
  sourceOrderId?: string;  // Si viene de un pedido
  convertedToInvoiceId?: string;  // Si se convirtió a factura
}

export interface SalesItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

export class SalesFlowService {

  /**
   * Calcula totales según la moneda
   * IVA solo se aplica si la moneda es VES (Bolívares)
   */
  static calculateTotals(
    items: SalesItem[],
    currency: Currency
  ): { subtotal: number; tax: number; taxRate: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    // IVA solo se aplica en Bolívares (VES)
    const taxRate = currency === 'VES' ? 16 : 0;
    const tax = currency === 'VES' ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;

    return { subtotal, tax, taxRate, total };
  }

  /**
   * Recalcula totales cuando cambia la moneda
   */
  static recalculateWithCurrency(
    document: SalesDocument,
    newCurrency: Currency
  ): SalesDocument {
    const { subtotal, tax, taxRate, total } = this.calculateTotals(document.items, newCurrency);

    return {
      ...document,
      currency: newCurrency,
      subtotal,
      tax,
      taxRate,
      total,
      updatedAt: new Date().toISOString(),
    };
  }


  /**
   * Convierte un pedido aprobado en factura
   */
  static convertOrderToInvoice(order: SalesDocument): SalesDocument {
    if (order.type !== 'order') {
      throw new Error('Solo se pueden convertir pedidos a facturas');
    }

    if (order.status !== 'approved') {
      throw new Error('El pedido debe estar aprobado para convertirse en factura');
    }

    const code = CodeGeneratorService.generateInvoiceCode();

    const invoice: SalesDocument = {
      id: `invoice_${Date.now()}`,
      code,
      type: 'invoice',
      recipientType: order.recipientType,
      recipientId: order.recipientId,
      recipientName: order.recipientName,
      items: order.items,
      currency: order.currency,
      subtotal: order.subtotal,
      tax: order.tax,
      taxRate: order.taxRate,
      total: order.total,
      status: 'pending',
      notes: order.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: order.createdBy,
      sourceOrderId: order.id,
    };

    CodeGeneratorService.saveCounters();
    return invoice;
  }

  /**
   * Aprueba un documento de ventas
   * IMPORTANTE: Las facturas aprobadas NO se pueden modificar
   */
  static approveDocument(document: SalesDocument): SalesDocument {
    if (document.type === 'invoice' && document.status === 'approved') {
      throw new Error('La factura ya está aprobada y no se puede modificar');
    }

    return {
      ...document,
      status: 'approved',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Valida si un documento puede ser editado
   */
  static canEdit(document: SalesDocument): { canEdit: boolean; reason?: string } {
    // Las facturas aprobadas NO se pueden editar
    if (document.type === 'invoice' && document.status === 'approved') {
      return {
        canEdit: false,
        reason: 'Las facturas aprobadas no se pueden modificar',
      };
    }

    // Los documentos cancelados no se pueden editar
    if (document.status === 'cancelled') {
      return {
        canEdit: false,
        reason: 'Los documentos cancelados no se pueden modificar',
      };
    }

    return { canEdit: true };
  }

  /**
   * Rechaza un documento de ventas
   */
  static rejectDocument(document: SalesDocument, reason?: string): SalesDocument {
    return {
      ...document,
      status: 'rejected',
      notes: reason ? `${document.notes || ''}\nMotivo de rechazo: ${reason}` : document.notes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancela un documento de ventas
   */
  static cancelDocument(document: SalesDocument, reason?: string): SalesDocument {
    return {
      ...document,
      status: 'cancelled',
      notes: reason ? `${document.notes || ''}\nMotivo de cancelación: ${reason}` : document.notes,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calcula el total de un item
   */
  static calculateItemTotal(
    quantity: number,
    price: number,
    discount: number = 0,
    taxRate: number = 16
  ): { subtotal: number; tax: number; total: number } {
    const subtotal = quantity * price * (1 - discount / 100);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  /**
   * Obtiene el historial completo de un documento
   */
  static getDocumentHistory(document: SalesDocument): {
    order?: string;
    invoice?: string;
  } {
    return {
      order: document.sourceOrderId,
      invoice: document.convertedToInvoiceId,
    };
  }

  /**
   * Valida si un documento puede ser convertido
   */
  static canConvert(document: SalesDocument): {
    canConvertToInvoice: boolean;
    reason?: string;
  } {
    if (document.type === 'order') {
      return {
        canConvertToInvoice: document.status === 'approved',
        reason: document.status !== 'approved' ? 'El pedido debe estar aprobado' : undefined,
      };
    }

    return {
      canConvertToInvoice: false,
      reason: 'Las facturas no se pueden convertir',
    };
  }
}
