/**
 * PurchasesERPService - Servicio de Compras integrado con el ERP Core
 * 
 * Este servicio adapta el módulo de compras para usar el Transaction Engine
 * del ERP, asegurando que todas las compras pasen por el flujo corporativo.
 * 
 * @module modules/purchases/services/PurchasesERPService
 */

import { transactionEngine, ERP_EVENTS } from '@/core/erp';
import { accountingBridge } from '@/core/erp/accounting-bridge/AccountingBridge';
import { auditLog } from '@/core/erp/audit-log/AuditLogService';
import { localDb } from '@/core/database/localDb';

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface PurchaseDocument {
  id?: string;
  orderNumber?: string;
  supplier: string;
  supplierId: string;
  supplierRif: string;
  date: string;
  expectedDeliveryDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  taxType?: 'IVA_GENERAL' | 'IVA_REDUCIDO' | 'IVA_LUXO' | 'EXENTO';
  total: number;
  currency: 'USD' | 'VES';
  exchangeRate?: number;
  paymentMethod: string;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  createdBy?: string;
}

export interface PurchasesERPResult {
  success: boolean;
  purchase?: PurchaseDocument;
  transactionId?: string;
  error?: string;
}

/**
 * PurchasesERPService - Servicio para integrar compras con el ERP
 */
class PurchasesERPServiceClass {
  private static instance: PurchasesERPServiceClass;

  private constructor() {
    console.log('[PurchasesERP] Servicio inicializado');
  }

  static getInstance(): PurchasesERPServiceClass {
    if (!PurchasesERPServiceClass.instance) {
      PurchasesERPServiceClass.instance = new PurchasesERPServiceClass();
    }
    return PurchasesERPServiceClass.instance;
  }

  /**
   * Crear una nueva orden de compra pasando por el Transaction Engine
   */
  async createPurchaseOrder(
    purchase: Omit<PurchaseDocument, 'id'>, 
    userId?: string
  ): Promise<PurchasesERPResult> {
    try {
      // 1. Crear transacción en el ERP
      const transactionResult = await transactionEngine.createTransaction(
        'PURCHASE_ORDER',
        'purchases',
        {
          status: 'DRAFT',
          createdBy: userId,
          metadata: {
            supplierId: purchase.supplierId,
            supplierRif: purchase.supplierRif,
            total: purchase.total,
            currency: purchase.currency,
          },
        }
      );

      if (!transactionResult.success || !transactionResult.transaction) {
        return {
          success: false,
          error: transactionResult.error?.message || 'Error creando transacción',
        };
      }

      const transactionId = transactionResult.transaction.id;

      // 2. Guardar la compra en la base de datos local
      const purchaseId = purchase.orderNumber || `PO-${Date.now()}`;
      const now = new Date().toISOString();

      const purchaseRecord: any = {
        id: purchaseId,
        number: purchaseId,
        supplierName: purchase.supplier,
        supplier_rif: purchase.supplierRif,
        supplierId: purchase.supplierId,
        date: purchase.date,
        expectedDeliveryDate: purchase.expectedDeliveryDate,
        items: JSON.stringify(purchase.items),
        subtotal: purchase.subtotal,
        tax: purchase.tax,
        taxType: purchase.taxType || 'IVA_GENERAL',
        total: purchase.total,
        currency: purchase.currency,
        exchangeRate: purchase.exchangeRate || 1,
        payment_method: purchase.paymentMethod,
        status: purchase.status || 'pending',
        notes: purchase.notes,
        tenant_id: transactionResult.transaction.company_id,
        transaction_id: transactionId,
        created_at: now,
        updated_at: now,
        is_dirty: true,
        last_sync: null,
        version: 1,
      };

      // Guardar en la tabla de compras (compras_maestro)
      await localDb.compras_maestro?.put(purchaseRecord);

      // 3. Emitir evento de orden de compra creada
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      const eventPayload = {
        id: purchaseId,
        transactionId,
        supplier: purchase.supplier,
        supplierId: purchase.supplierId,
        total: purchase.total,
        currency: purchase.currency,
      };

      eventBus.emit(ERP_EVENTS.PURCHASE_ORDER_CREATED, eventPayload, {
        sourceModule: 'PurchasesERP',
        transactionId,
        company_id: transactionResult.transaction.company_id,
      });

      // 4. Registrar auditoría
      await auditLog.log({
        entityType: 'ORDER',
        entityId: purchaseId,
        action: 'CREATE',
        description: `Orden de compra creada: ${purchaseId} - Proveedor: ${purchase.supplier} - Total: ${purchase.total} ${purchase.currency}`,
        transactionId,
        userId,
        newValue: purchaseRecord,
      });

      console.log(`[PurchasesERP] ✅ Orden de compra creada: ${purchaseId}`, { transactionId });

      return {
        success: true,
        purchase: { ...purchase, id: purchaseId },
        transactionId,
      };
    } catch (error) {
      console.error('[PurchasesERP] Error creando orden de compra:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Aprobar una orden de compra
   */
  async approvePurchaseOrder(purchaseId: string, userId?: string): Promise<PurchasesERPResult> {
    try {
      const purchase: any = await localDb.compras_maestro?.get(purchaseId);
      if (!purchase) {
        return { success: false, error: 'Orden de compra no encontrada' };
      }

      const transactionId = purchase.transaction_id;
      
      // Actualizar transacción del ERP
      if (transactionId) {
        await transactionEngine.updateTransactionStatus(transactionId, 'APPROVED', {
          emitEvents: true,
        });
      }

      // Actualizar estado de la compra
      await localDb.compras_maestro?.update(purchaseId, {
        status: 'approved' as any,
        updated_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Emitir evento de aprobación
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(ERP_EVENTS.PURCHASE_ORDER_APPROVED, { id: purchaseId, transactionId }, {
        sourceModule: 'PurchasesERP',
        transactionId,
        company_id: purchase.tenant_id,
      });

      // Auditoría
      await auditLog.log({
        entityType: 'ORDER',
        entityId: purchaseId,
        action: 'APPROVE',
        description: `Orden de compra aprobada: ${purchaseId}`,
        transactionId,
        userId,
      });

      return { success: true, purchase: purchase as any, transactionId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Recepciones de mercancía (ingreso al inventario)
   */
  async receivePurchase(purchaseId: string, userId?: string): Promise<PurchasesERPResult> {
    try {
      const purchase: any = await localDb.compras_maestro?.get(purchaseId);
      if (!purchase) {
        return { success: false, error: 'Orden de compra no encontrada' };
      }

      const transactionId = purchase.transaction_id;
      
      // Crear transacción de receipt
      const receiptResult = await transactionEngine.createTransaction(
        'PURCHASE_RECEIPT',
        'purchases',
        {
          status: 'COMPLETED',
          metadata: {
            purchaseOrderId: purchaseId,
          },
        }
      );

      // Actualizar estado de la compra a recibida
      await localDb.compras_maestro?.update(purchaseId, {
        status: 'received' as any,
        updated_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Emitir evento de recepción (esto disparará incremento de inventario)
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(ERP_EVENTS.PURCHASE_ORDER_RECEIVED, { 
        id: purchaseId,
        transactionId: receiptResult.transaction?.id,
        items: JSON.parse(purchase.items || '[]'),
        total: purchase.total,
        taxAmount: purchase.tax,
      }, {
        sourceModule: 'PurchasesERP',
        transactionId: receiptResult.transaction?.id,
        company_id: purchase.tenant_id,
      });

      // Generar asiento contable
      const companyId = purchase.tenant_id;
      if (companyId && receiptResult.transaction?.id) {
        await this.createAccountingEntry(purchase, receiptResult.transaction.id, companyId);
      }

      // Auditoría
      await auditLog.log({
        entityType: 'ORDER',
        entityId: purchaseId,
        action: 'UPDATE',
        description: `Mercancía recibida: ${purchaseId}`,
        transactionId: receiptResult.transaction?.id,
        userId,
      });

      return { success: true, purchase: purchase as any };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Cancelar una orden de compra
   */
  async cancelPurchase(purchaseId: string, reason: string, userId?: string): Promise<PurchasesERPResult> {
    try {
      const purchase: any = await localDb.compras_maestro?.get(purchaseId);
      if (!purchase) {
        return { success: false, error: 'Orden de compra no encontrada' };
      }

      const transactionId = purchase.transaction_id;
      
      // Cancelar transacción del ERP
      if (transactionId) {
        await transactionEngine.cancelTransaction(transactionId, reason);
      }

      // Actualizar estado
      await localDb.compras_maestro?.update(purchaseId, {
        status: 'cancelled' as any,
        notes: (purchase.notes || '') + `\n[CANCELADA]: ${reason}`,
        updated_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Auditoría
      await auditLog.log({
        entityType: 'ORDER',
        entityId: purchaseId,
        action: 'CANCEL',
        description: `Orden de compra cancelada: ${purchaseId} - Razón: ${reason}`,
        transactionId,
        userId,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener compras por empresa
   */
  async getPurchasesByCompany(companyId: string): Promise<PurchaseDocument[]> {
    const purchases: any[] = await localDb.compras_maestro
      ?.where('tenant_id')
      .equals(companyId)
      .toArray() || [];

    return purchases.map(p => ({
      id: p.id,
      orderNumber: p.number,
      supplier: p.supplierName,
      supplierId: p.supplierId || '',
      supplierRif: p.supplier_rif || '',
      date: p.date,
      expectedDeliveryDate: p.expectedDeliveryDate,
      items: JSON.parse(p.items || '[]'),
      subtotal: p.subtotal || 0,
      tax: p.tax || 0,
      taxType: p.taxType,
      total: p.total || 0,
      currency: p.currency || 'USD',
      paymentMethod: p.payment_method || '',
      status: p.status || 'pending',
      notes: p.notes,
    }));
  }

  // Método privado para crear asiento contable
  private async createAccountingEntry(
    purchase: any,
    transactionId: string,
    companyId: string
  ): Promise<void> {
    const taxAmount = purchase.tax || 0;
    const subtotal = purchase.subtotal || 0;
    const total = purchase.total || 0;

    // Asiento de compra:
    // Débito: Inventario (1500)
    // Débito: IVA Crédito Fiscal (2220)
    // Crédito: Proveedores (2110)

    await accountingBridge.createJournalEntry({
      transactionId,
      date: purchase.date,
      description: `Compra ${purchase.orderNumber || purchase.id}`,
      entries: [
        { accountCode: '1500', debit: subtotal, credit: 0 }, // Inventario
        { accountCode: '2220', debit: taxAmount, credit: 0 }, // IVA Crédito
        { accountCode: '2110', debit: 0, credit: total }, // Proveedores
      ],
    });
  }
}

export const purchasesERPService = PurchasesERPServiceClass.getInstance();
export default purchasesERPService;