/**
 * SalesERPService - Servicio de Ventas integrado con el ERP Core
 * 
 * Este servicio adapta el módulo de ventas para usar el Transaction Engine
 * del ERP, asegurando que todas las ventas pasen por el flujo corporativo.
 * 
 * @module modules/sales/services/SalesERPService
 */

import { transactionEngine, ERP_EVENTS } from '@/core/erp';
import { accountingBridge } from '@/core/erp/accounting-bridge/AccountingBridge';
import { auditLog } from '@/core/erp/audit-log/AuditLogService';
import { localDb } from '@/core/database/localDb';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface SaleDocument {
  id?: string;
  invoiceNumber?: string;
  client: string;
  clientId: string;
  clientRif: string;
  date: string;
  dueDate: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  taxType?: 'IVA_GENERAL' | 'IVA_REDUCIDO' | 'IVA_LUXO' | 'EXENTO';
  igtf?: number;
  total: number;
  currency: 'USD' | 'VES';
  exchangeRate?: number;
  paymentMethod: string;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: string;
}

export interface SalesERPResult {
  success: boolean;
  sale?: SaleDocument;
  transactionId?: string;
  error?: string;
}

/**
 * SalesERPService - Servicio para integrar ventas con el ERP
 */
class SalesERPServiceClass {
  private static instance: SalesERPServiceClass;

  private constructor() {
    console.log('[SalesERP] Servicio inicializado');
  }

  static getInstance(): SalesERPServiceClass {
    if (!SalesERPServiceClass.instance) {
      SalesERPServiceClass.instance = new SalesERPServiceClass();
    }
    return SalesERPServiceClass.instance;
  }

  /**
   * Crear una nueva venta/-factura pasando por el Transaction Engine
   */
  async createSale(sale: Omit<SaleDocument, 'id'>, userId?: string): Promise<SalesERPResult> {
    try {
      // 1. Crear transacción en el ERP
      const transactionResult = await transactionEngine.createTransaction(
        'INVOICE',
        'sales',
        {
          status: 'DRAFT',
          createdBy: userId,
          metadata: {
            clientId: sale.clientId,
            clientRif: sale.clientRif,
            total: sale.total,
            currency: sale.currency,
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

      // 2. Guardar la venta en la base de datos local (usando any para evitar conflictos de tipo)
      const saleId = sale.invoiceNumber || `INV-${Date.now()}`;
      const now = new Date().toISOString();

      const saleRecord: any = {
        id: saleId,
        number: saleId,
        customerName: sale.client,
        customer_rif: sale.clientRif,
        clientId: sale.clientId,
        date: sale.date,
        dueDate: sale.dueDate,
        items: JSON.stringify(sale.items),
        subtotal: sale.subtotal,
        tax: sale.tax,
        taxType: sale.taxType || 'IVA_GENERAL',
        igtf: sale.igtf || 0,
        total: sale.total,
        currency: sale.currency,
        exchangeRate: sale.exchangeRate || 1,
        payment_method: sale.paymentMethod,
        status: sale.status || 'pending',
        notes: sale.notes,
        tenant_id: transactionResult.transaction.company_id,
        transaction_id: transactionId,
        created_at: now,
        updated_at: now,
        is_dirty: true,
        last_sync: null,
        version: 1,
      };

      await localDb.invoices?.put(saleRecord);

      // 3. Generar asiento contable automático
      if (sale.status === 'completed' || sale.status === 'approved') {
        await this.createAccountingEntry(sale, transactionId, transactionResult.transaction.company_id);
      }

      // 4. Emitir evento de venta creada
      const eventPayload = {
        id: saleId,
        transactionId,
        client: sale.client,
        clientId: sale.clientId,
        total: sale.total,
        taxAmount: sale.tax,
        igtfAmount: sale.igtf || 0,
        currency: sale.currency,
        paymentMethod: sale.paymentMethod,
      };

      // Usar el event bus directamente
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(ERP_EVENTS.SALE_CREATED, eventPayload, {
        sourceModule: 'SalesERP',
        transactionId,
        company_id: transactionResult.transaction.company_id,
      });

      // 5. Registrar auditoría
      await auditLog.log({
        entityType: 'INVOICE',
        entityId: saleId,
        action: 'CREATE',
        description: `Venta creada: ${saleId} - Cliente: ${sale.client} - Total: ${sale.total} ${sale.currency}`,
        transactionId,
        userId,
        newValue: saleRecord,
      });

      console.log(`[SalesERP] ✅ Venta creada: ${saleId}`, { transactionId });

      return {
        success: true,
        sale: { ...sale, id: saleId },
        transactionId,
      };
    } catch (error) {
      console.error('[SalesERP] Error creando venta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Completar una venta (aprobar/post-ear)
   */
  async completeSale(saleId: string, userId?: string): Promise<SalesERPResult> {
    try {
      // Buscar la venta
      const sale: any = await localDb.invoices?.get(saleId);
      if (!sale) {
        return { success: false, error: 'Venta no encontrada' };
      }

      // Actualizar estado de la transacción
      const transactionId = sale.transaction_id;
      if (transactionId) {
        await transactionEngine.updateTransactionStatus(transactionId, 'COMPLETED', {
          emitEvents: true,
        });
      }

      // Crear asiento contable
      const companyId = sale.tenant_id;
      if (companyId) {
        await this.createAccountingEntry(
          {
            ...sale,
            items: JSON.parse(sale.items || '[]'),
          } as any,
          transactionId,
          companyId
        );
      }

      // Actualizar estado de la venta
      await localDb.invoices?.update(saleId, {
        status: 'paid' as any,
        updated_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Emitir evento de venta completada
      const { eventBus } = await import('@/core/erp/event-bus/EventBus');
      eventBus.emit(ERP_EVENTS.SALE_COMPLETED, { id: saleId, transactionId }, {
        sourceModule: 'SalesERP',
        transactionId,
        companyId,
      });

      // Auditoría
      await auditLog.log({
        entityType: 'INVOICE',
        entityId: saleId,
        action: 'POST',
        description: `Venta completada: ${saleId}`,
        transactionId,
        userId,
      });

      return {
        success: true,
        sale: sale as any,
        transactionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Cancelar una venta
   */
  async cancelSale(saleId: string, reason: string, userId?: string): Promise<SalesERPResult> {
    try {
      const sale: any = await localDb.invoices?.get(saleId);
      if (!sale) {
        return { success: false, error: 'Venta no encontrada' };
      }

      const transactionId = sale.transaction_id;
      
      // Cancelar transacción del ERP
      if (transactionId) {
        await transactionEngine.cancelTransaction(transactionId, reason);
      }

      // Actualizar estado
      await localDb.invoices?.update(saleId, {
        status: 'cancelled' as any,
        notes: (sale.notes || '') + `\n[CANCELADA]: ${reason}`,
        updated_at: new Date().toISOString(),
        is_dirty: true as any,
      });

      // Auditoría
      await auditLog.log({
        entityType: 'INVOICE',
        entityId: saleId,
        action: 'CANCEL',
        description: `Venta cancelada: ${saleId} - Razón: ${reason}`,
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
   * Obtener ventas por empresa
   */
  async getSalesByCompany(companyId: string): Promise<SaleDocument[]> {
    const sales: any[] = await localDb.invoices
      ?.where('tenant_id')
      .equals(companyId)
      .toArray() || [];

    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.number,
      client: s.customerName,
      clientId: s.clientId || '',
      clientRif: s.customer_rif || '',
      date: s.date,
      dueDate: s.dueDate || '',
      items: JSON.parse(s.items || '[]'),
      subtotal: s.subtotal || 0,
      tax: s.tax || 0,
      taxType: s.taxType,
      igtf: s.igtf || 0,
      total: s.total || 0,
      currency: s.currency || 'USD',
      paymentMethod: s.payment_method || '',
      status: s.status || 'pending',
      notes: s.notes,
    }));
  }

  // Método privado para crear asiento contable
  private async createAccountingEntry(
    sale: any,
    transactionId: string,
    companyId: string
  ): Promise<void> {
    const taxAmount = sale.tax || 0;
    const subtotal = sale.subtotal || 0;
    const total = sale.total || 0;

    // Asiento de venta:
    // Débito: Clientes (1310) o Caja/Banco según método de pago
    // Crédito: Venta de Mercancía (4100)
    // Débito: IVA Crédito Fiscal (2220)
    // Crédito: IVA Débito Fiscal (2210)

    const accountMap: Record<string, string> = {
      cash: '1110',      // Caja
      bank: '1210',      // Banco
      credit: '1310',    // Clientes
      transfer: '1210',
      debit_card: '1210',
      credit_card: '1210',
    };

    const cashAccount = accountMap[sale.paymentMethod] || '1310';

    await accountingBridge.createJournalEntry({
      transactionId,
      date: sale.date,
      description: `Venta ${sale.invoiceNumber || sale.id}`,
      entries: [
        { accountCode: '1310', debit: total, credit: 0 }, // Cliente/Caja
        { accountCode: '4100', debit: 0, credit: subtotal }, // Venta
        { accountCode: '2220', debit: 0, credit: taxAmount }, // IVA Crédito
        { accountCode: '2210', debit: taxAmount, credit: 0 }, // IVA Débito
      ],
    });
  }
}

export const salesERPService = SalesERPServiceClass.getInstance();
export default salesERPService;