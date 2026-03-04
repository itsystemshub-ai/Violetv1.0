/**
 * MS Tesorería - Cuentas por Cobrar
 * Gestiona las cuentas por cobrar, pagos y flujo de caja
 */
import { localDb } from "@/core/database/localDb";
import { toast } from "sonner";

export interface AccountReceivable {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_rif: string;
  customer_empresa?: string;
  tenant_id: string;
  amount: number;
  currency: 'USD' | 'VES';
  exchange_rate_used?: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  payment_type: 'cash' | 'credit';
  due_date?: string;
  created_at: string;
  updated_at?: string;
  paid_amount: number;
  balance: number;
}

export interface Payment {
  id: string;
  receivable_id: string;
  invoice_number: string;
  customer_name: string;
  tenant_id: string;
  amount: number;
  currency: 'USD' | 'VES';
  payment_method: 'cash' | 'transfer' | 'zelle' | 'paypal' | 'card' | 'check' | 'other';
  payment_reference?: string;
  bank_name?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface CashRegisterEntry {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  category: 'sale' | 'payment' | 'expense' | 'adjustment' | 'other';
  amount: number;
  currency: 'USD' | 'VES';
  payment_method: 'cash' | 'transfer' | 'zelle' | 'paypal' | 'card' | 'check' | 'other';
  reference_id?: string;
  reference_type?: 'invoice' | 'payment' | 'expense';
  description: string;
  created_at: string;
  created_by?: string;
}

export class CuentasPorCobrarService {
  private static instance: CuentasPorCobrarService;

  private constructor() {}

  public static getInstance(): CuentasPorCobrarService {
    if (!CuentasPorCobrarService.instance) {
      CuentasPorCobrarService.instance = new CuentasPorCobrarService();
    }
    return CuentasPorCobrarService.instance;
  }

  /**
   * Crea una cuenta por cobrar cuando se genera una factura
   */
  public async createAccountReceivable(
    invoiceId: string,
    invoiceNumber: string,
    customerName: string,
    customerRif: string,
    customerEmpresa: string | undefined,
    amount: number,
    currency: 'USD' | 'VES',
    paymentType: 'cash' | 'credit',
    tenantId: string,
    exchangeRate?: number,
    dueDate?: string
  ): Promise<void> {
    try {
      const receivable: AccountReceivable = {
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_rif: customerRif,
        customer_empresa: customerEmpresa,
        tenant_id: tenantId,
        amount,
        currency,
        exchange_rate_used: exchangeRate,
        status: paymentType === 'cash' ? 'paid' : 'pending',
        payment_type: paymentType,
        due_date: dueDate,
        created_at: new Date().toISOString(),
        paid_amount: paymentType === 'cash' ? amount : 0,
        balance: paymentType === 'cash' ? 0 : amount,
      };

      await localDb.accounts_receivable.add(receivable);

      // Si es pago de contado, registrar en caja
      if (paymentType === 'cash') {
        await this.registerCashEntry({
          tenant_id: tenantId,
          type: 'income',
          category: 'sale',
          amount,
          currency,
          payment_method: 'cash',
          reference_id: invoiceId,
          reference_type: 'invoice',
          description: `Venta de contado - Factura ${invoiceNumber} - ${customerEmpresa || customerName}`,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[CuentasPorCobrar] Error al crear cuenta por cobrar:', error);
      throw error;
    }
  }

  /**
   * Registra un pago parcial o total de una cuenta por cobrar
   */
  public async registerPayment(
    receivableId: string,
    amount: number,
    currency: 'USD' | 'VES',
    paymentMethod: Payment['payment_method'],
    tenantId: string,
    paymentReference?: string,
    bankName?: string,
    notes?: string,
    createdBy?: string
  ): Promise<void> {
    try {
      const receivable = await localDb.accounts_receivable.get(receivableId);
      
      if (!receivable) {
        throw new Error('Cuenta por cobrar no encontrada');
      }

      if (receivable.status === 'paid') {
        throw new Error('Esta cuenta ya está pagada completamente');
      }

      // Validar que el monto no exceda el balance
      if (amount > receivable.balance) {
        throw new Error(`El monto del pago (${amount}) excede el balance pendiente (${receivable.balance})`);
      }

      // Crear registro de pago
      const payment: Payment = {
        id: crypto.randomUUID(),
        receivable_id: receivableId,
        invoice_number: receivable.invoice_number,
        customer_name: receivable.customer_name,
        tenant_id: tenantId,
        amount,
        currency,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        bank_name: bankName,
        notes,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      };

      await localDb.payments.add(payment);

      // Actualizar cuenta por cobrar
      const newPaidAmount = receivable.paid_amount + amount;
      const newBalance = receivable.balance - amount;
      const newStatus = newBalance === 0 ? 'paid' : newBalance < receivable.amount ? 'partial' : 'pending';

      await localDb.accounts_receivable.update(receivableId, {
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      });

      // Registrar en caja
      await this.registerCashEntry({
        tenant_id: tenantId,
        type: 'income',
        category: 'payment',
        amount,
        currency,
        payment_method: paymentMethod,
        reference_id: payment.id,
        reference_type: 'payment',
        description: `Pago recibido - Factura ${receivable.invoice_number} - ${receivable.customer_empresa || receivable.customer_name}`,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      });

      // Actualizar status de la factura
      await localDb.invoices.update(receivable.invoice_id, {
        payment_status: newStatus,
        updated_at: new Date().toISOString(),
      });

      toast.success(`Pago de ${amount} ${currency} registrado correctamente`);
    } catch (error) {
      console.error('[CuentasPorCobrar] Error al registrar pago:', error);
      throw error;
    }
  }

  /**
   * Registra una entrada en caja
   */
  public async registerCashEntry(entry: Omit<CashRegisterEntry, 'id'>): Promise<void> {
    try {
      await localDb.cash_register.add({
        id: crypto.randomUUID(),
        ...entry,
      });
    } catch (error) {
      console.error('[CuentasPorCobrar] Error al registrar entrada en caja:', error);
      // No bloqueamos la operación si falla el registro en caja
    }
  }

  /**
   * Obtiene todas las cuentas por cobrar de un tenant
   */
  public async getAccountsReceivable(tenantId: string): Promise<AccountReceivable[]> {
    return localDb.accounts_receivable
      .where('tenant_id')
      .equals(tenantId)
      .toArray();
  }

  /**
   * Obtiene cuentas por cobrar pendientes
   */
  public async getPendingReceivables(tenantId: string): Promise<AccountReceivable[]> {
    return localDb.accounts_receivable
      .where('tenant_id')
      .equals(tenantId)
      .and(r => r.status === 'pending' || r.status === 'partial' || r.status === 'overdue')
      .toArray();
  }

  /**
   * Obtiene pagos de una cuenta por cobrar
   */
  public async getPaymentsByReceivable(receivableId: string): Promise<Payment[]> {
    return localDb.payments
      .where('receivable_id')
      .equals(receivableId)
      .toArray();
  }

  /**
   * Obtiene el flujo de caja de un tenant
   */
  public async getCashFlow(tenantId: string, startDate?: string, endDate?: string): Promise<CashRegisterEntry[]> {
    let query = localDb.cash_register.where('tenant_id').equals(tenantId);
    
    const entries = await query.toArray();
    
    if (startDate || endDate) {
      return entries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        if (startDate && entryDate < new Date(startDate)) return false;
        if (endDate && entryDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    return entries;
  }

  /**
   * Verifica cuentas vencidas y actualiza su status
   */
  public async checkOverdueAccounts(tenantId: string): Promise<void> {
    try {
      const today = new Date();
      const pendingReceivables = await this.getPendingReceivables(tenantId);
      
      for (const receivable of pendingReceivables) {
        if (receivable.due_date && receivable.status !== 'overdue') {
          const dueDate = new Date(receivable.due_date);
          if (dueDate < today) {
            await localDb.accounts_receivable.update(receivable.id, {
              status: 'overdue',
              updated_at: new Date().toISOString(),
            });

            // Crear notificación
            await localDb.notifications.add({
              id: crypto.randomUUID(),
              type: 'overdue_payment',
              title: 'Cuenta por Cobrar Vencida',
              message: `Factura ${receivable.invoice_number} - ${receivable.customer_empresa || receivable.customer_name} - Balance: ${receivable.balance} ${receivable.currency}`,
              timestamp: new Date().toISOString(),
              tenantId: tenantId,
              read: false,
              data: {
                receivableId: receivable.id,
                invoiceNumber: receivable.invoice_number,
                customerName: receivable.customer_empresa || receivable.customer_name,
                balance: receivable.balance,
                currency: receivable.currency,
                dueDate: receivable.due_date,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('[CuentasPorCobrar] Error al verificar cuentas vencidas:', error);
    }
  }

  /**
   * Obtiene resumen de cuentas por cobrar
   */
  public async getSummary(tenantId: string): Promise<{
    total: number;
    pending: number;
    overdue: number;
    paid: number;
    count: {
      total: number;
      pending: number;
      overdue: number;
      paid: number;
    };
  }> {
    const receivables = await this.getAccountsReceivable(tenantId);
    
    return {
      total: receivables.reduce((sum, r) => sum + r.amount, 0),
      pending: receivables
        .filter(r => r.status === 'pending' || r.status === 'partial')
        .reduce((sum, r) => sum + r.balance, 0),
      overdue: receivables
        .filter(r => r.status === 'overdue')
        .reduce((sum, r) => sum + r.balance, 0),
      paid: receivables
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.amount, 0),
      count: {
        total: receivables.length,
        pending: receivables.filter(r => r.status === 'pending' || r.status === 'partial').length,
        overdue: receivables.filter(r => r.status === 'overdue').length,
        paid: receivables.filter(r => r.status === 'paid').length,
      },
    };
  }
}

export const cuentasPorCobrarService = CuentasPorCobrarService.getInstance();
