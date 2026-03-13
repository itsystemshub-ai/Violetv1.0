/**
 * Transaction Engine - Centro del ERP
 * 
 * Responsabilidad:
 * - Generar transaction_id único
 * - Associar company_id
 * - Emitir eventos automáticamente
 * - Registrar auditoría
 * - Coordinar todas las operaciones del ERP
 * 
 * @module core/erp/transaction-engine
 */

import { eventBus, ERP_EVENTS, type ERPEventType } from '../event-bus/EventBus';
import { companyContext } from '../company-context/CompanyContext';
import { localDb } from '@/core/database/localDb';

export type TransactionType = 
  | 'SALE' 
  | 'PURCHASE_ORDER' 
  | 'PURCHASE_RECEIPT' 
  | 'INVOICE' 
  | 'PAYMENT_RECEIVED' 
  | 'PAYMENT_MADE'
  | 'INVENTORY_ADJUSTMENT'
  | 'INVENTORY_TRANSFER'
  | 'JOURNAL_ENTRY'
  | 'LEDGER_ENTRY';

export type TransactionStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'APPROVED' 
  | 'POSTED' 
  | 'CANCELLED' 
  | 'COMPLETED';

export interface TransactionContext {
  id: string;
  company_id: string;
  type: TransactionType;
  status: TransactionStatus;
  originModule: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  transaction?: TransactionContext;
  data?: T;
  error?: Error;
  events?: Array<{ type: ERPEventType; payload: unknown }>;
}

/**
 * Genera un ID de transacción único
 */
function generateTransactionId(type: TransactionType): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${type}-${timestamp}-${random}`.toUpperCase();
}

/**
 * TransactionEngine - Motor central de transacciones del ERP
 */
class TransactionEngineClass {
  private static instance: TransactionEngineClass;

  private constructor() {
    console.log('[TransactionEngine] Inicializado');
  }

  static getInstance(): TransactionEngineClass {
    if (!TransactionEngineClass.instance) {
      TransactionEngineClass.instance = new TransactionEngineClass();
    }
    return TransactionEngineClass.instance;
  }

  /**
   * Crear una nueva transacción empresarial
   * 
   * @param type - Tipo de transacción
   * @param originModule - Módulo que origina la transacción
   * @param options - Opciones adicionales
   * @returns Resultado de la transacción
   */
  async createTransaction<T = unknown>(
    type: TransactionType,
    originModule: string,
    options: {
      status?: TransactionStatus;
      createdBy?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
      emitEvents?: boolean;
    } = {}
  ): Promise<TransactionResult<T>> {
    const company_id = companyContext.getCompanyId();
    
    if (!company_id) {
      return {
        success: false,
        error: new Error('No hay empresa seleccionada. Use companyContext.setCompany() primero.'),
      };
    }

    const transactionId = generateTransactionId(type);
    const now = new Date().toISOString();

    const transaction: TransactionContext = {
      id: transactionId,
      company_id,
      type,
      status: options.status || 'DRAFT',
      originModule,
      createdAt: now,
      updatedAt: now,
      createdBy: options.createdBy,
      notes: options.notes,
      metadata: options.metadata,
    };

    try {
      // Guardar en base de datos local
      await localDb.business_transactions?.put({
        ...transaction,
        is_dirty: true,
        last_sync: null,
        version: 1,
      });

      console.log(`[TransactionEngine] ✅ Transacción creada: ${transactionId}`, {
        type,
        company_id,
        status: transaction.status,
      });

      // Emitir eventos si está habilitado
      if (options.emitEvents !== false) {
        this.emitTransactionEvents(transaction);
      }

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      console.error(`[TransactionEngine] ❌ Error creando transacción:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Actualizar estado de una transacción
   */
  async updateTransactionStatus(
    transactionId: string,
    newStatus: TransactionStatus,
    options: {
      notes?: string;
      emitEvents?: boolean;
    } = {}
  ): Promise<TransactionResult> {
    try {
      const transaction = await localDb.business_transactions?.get(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          error: new Error(`Transacción ${transactionId} no encontrada`),
        };
      }

      const updatedTransaction: TransactionContext = {
        ...transaction,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        notes: options.notes || transaction.notes,
      };

      await localDb.business_transactions?.update(transactionId, {
        status: newStatus,
        updatedAt: updatedTransaction.updatedAt,
        notes: updatedTransaction.notes,
        is_dirty: true,
        version: (transaction.version || 0) + 1,
      });

      console.log(`[TransactionEngine] ✅ Transacción ${transactionId} actualizada a ${newStatus}`);

      if (options.emitEvents !== false) {
        this.emitStatusChangeEvent(updatedTransaction);
      }

      return {
        success: true,
        transaction: updatedTransaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Completar una transacción con datos asociados
   */
  async completeTransaction<T = unknown>(
    transactionId: string,
    data: T,
    events: Array<{ type: ERPEventType; payload: unknown }> = []
  ): Promise<TransactionResult<T>> {
    try {
      const result = await this.updateTransactionStatus(transactionId, 'COMPLETED', {
        emitEvents: false,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Emitir eventos de datos asociados
      events.forEach(({ type, payload }) => {
        eventBus.emit(type, payload, {
          sourceModule: 'TransactionEngine',
          transactionId,
          company_id: result.transaction?.company_id,
        });
      });

      return {
        success: true,
        transaction: result.transaction,
        data,
        events,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Cancelar una transacción
   */
  async cancelTransaction(
    transactionId: string,
    reason?: string
  ): Promise<TransactionResult> {
    try {
      const transaction = await localDb.business_transactions?.get(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          error: new Error(`Transacción ${transactionId} no encontrada`),
        };
      }

      // No permitir cancelar transacciones completadas
      if (transaction.status === 'COMPLETED' || transaction.status === 'POSTED') {
        return {
          success: false,
          error: new Error('No se puede cancelar una transacción completada o registrada'),
        };
      }

      const result = await this.updateTransactionStatus(transactionId, 'CANCELLED', {
        notes: reason,
        emitEvents: true,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Obtener transacciones por empresa
   */
  async getTransactionsByCompany(
    company_id: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<TransactionContext[]> {
    try {
      let query = localDb.business_transactions?.where('company_id').equals(company_id);
      
      const transactions = await query?.toArray() || [];
      
      // Aplicar filtros adicionales
      let filtered = transactions;
      
      if (filters?.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters?.status) {
        filtered = filtered.filter(t => t.status === filters.status);
      }
      if (filters?.startDate) {
        filtered = filtered.filter(t => t.createdAt >= filters.startDate!);
      }
      if (filters?.endDate) {
        filtered = filtered.filter(t => t.createdAt <= filters.endDate!);
      }
      
      // Ordenar por fecha descendente
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Limitar resultados
      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
      
      return filtered;
    } catch (error) {
      console.error('[TransactionEngine] Error obteniendo transacciones:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de transacciones
   */
  async getTransactionStats(company_id: string): Promise<{
    total: number;
    byStatus: Record<TransactionStatus, number>;
    byType: Record<TransactionType, number>;
  }> {
    const transactions = await this.getTransactionsByCompany(company_id);
    
    const byStatus: Record<TransactionStatus, number> = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      POSTED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    };
    
    const byType: Record<TransactionType, number> = {
      SALE: 0,
      PURCHASE_ORDER: 0,
      PURCHASE_RECEIPT: 0,
      INVOICE: 0,
      PAYMENT_RECEIVED: 0,
      PAYMENT_MADE: 0,
      INVENTORY_ADJUSTMENT: 0,
      INVENTORY_TRANSFER: 0,
      JOURNAL_ENTRY: 0,
      LEDGER_ENTRY: 0,
    };

    transactions.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    return {
      total: transactions.length,
      byStatus,
      byType,
    };
  }

  // Métodos privados

  private emitTransactionEvents(transaction: TransactionContext): void {
    const eventMap: Record<TransactionType, ERPEventType> = {
      SALE: ERP_EVENTS.SALE_CREATED,
      PURCHASE_ORDER: ERP_EVENTS.PURCHASE_ORDER_CREATED,
      PURCHASE_RECEIPT: ERP_EVENTS.PURCHASE_ORDER_RECEIVED,
      INVOICE: ERP_EVENTS.INVOICE_CREATED,
      PAYMENT_RECEIVED: ERP_EVENTS.PAYMENT_RECEIVED,
      PAYMENT_MADE: ERP_EVENTS.PAYMENT_MADE,
      INVENTORY_ADJUSTMENT: ERP_EVENTS.INVENTORY_ADJUSTED,
      INVENTORY_TRANSFER: ERP_EVENTS.INVENTORY_INCREASED,
      JOURNAL_ENTRY: ERP_EVENTS.JOURNAL_ENTRY_CREATED,
      LEDGER_ENTRY: ERP_EVENTS.LEDGER_ENTRY_CREATED,
    };

    const eventType = eventMap[transaction.type];
    if (eventType) {
      eventBus.emit(eventType, transaction, {
        sourceModule: 'TransactionEngine',
        transactionId: transaction.id,
        company_id: transaction.company_id,
      });
    }
  }

  private emitStatusChangeEvent(transaction: TransactionContext): void {
    eventBus.emit(`${transaction.type}.${transaction.status.toLowerCase()}`, transaction, {
      sourceModule: 'TransactionEngine',
      transactionId: transaction.id,
      company_id: transaction.company_id,
    });
  }
}

// Singleton instance
export const transactionEngine = TransactionEngineClass.getInstance();

export default transactionEngine;