/**
 * Accounting Bridge - Puente Contable del ERP
 * 
 * Responsabilidad:
 * - Generar asientos contables automáticamente desde transacciones
 * - Mantener libro mayor (General Ledger)
 * - Generar diarios contables
 * - Integración con módulos financieros
 * 
 * Cumplimiento SENIAT Venezuela:
 * - IGTF (3%) en transacciones en divisas
 * - IVA (16%/8%/31%)
 * - Libro de ventas y compras
 * 
 * @module core/erp/accounting-bridge
 */

import { eventBus, ERP_EVENTS } from '../event-bus/EventBus';
import { companyContext } from '../company-context/CompanyContext';
import { transactionEngine } from '../transaction-engine/TransactionEngine';
import { localDb } from '@/core/database/localDb';

// Tipos de cuenta contable
export type AccountType = 
  | 'ASSET' 
  | 'LIABILITY' 
  | 'EQUITY' 
  | 'REVENUE' 
  | 'EXPENSE';

export type AccountNature = 
  | 'DEBIT' 
  | 'CREDIT';

// Cuenta contable
export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: string;
  level: number;
  isActive: boolean;
  companyId: string;
  createdAt: string;
}

// Asiento contable (débitos y créditos)
export interface LedgerEntry {
  id: string;
  transactionId: string;
  companyId: string;
  date: string;
  description: string;
  reference?: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: 'USD' | 'VES';
  exchangeRate?: number;
  taxAmount?: number;
  taxType?: 'IVA' | 'IGTF' | 'NONE';
  isPosted: boolean;
  createdAt: string;
  createdBy?: string;
}

// Movimiento en libro mayor
export interface JournalEntry {
  id: string;
  transactionId: string;
  companyId: string;
  date: string;
  description: string;
  entries: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  isPosted: boolean;
  createdAt: string;
  createdBy?: string;
}

// Mapa de cuentas por defecto para Venezuela
const DEFAULT_ACCOUNTS: Array<Omit<AccountingAccount, 'id' | 'createdAt'>> = [
  // ACTIVOS
  { code: '1000', name: 'ACTIVO', type: 'ASSET', nature: 'DEBIT', level: 0, isActive: true, companyId: '' },
  { code: '1100', name: 'CAJA', type: 'ASSET', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
  { code: '1110', name: 'Caja Principal', type: 'ASSET', nature: 'DEBIT', level: 2, isActive: true, companyId: '' },
  { code: '1120', name: 'Caja Chica', type: 'ASSET', nature: 'DEBIT', level: 2, isActive: true, companyId: '' },
  { code: '1200', name: 'BANCOS', type: 'ASSET', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
  { code: '1210', name: 'Cuenta Corriente', type: 'ASSET', nature: 'DEBIT', level: 2, isActive: true, companyId: '' },
  { code: '1300', name: 'CUENTAS POR COBRAR', type: 'ASSET', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
  { code: '1310', name: 'Clientes', type: 'ASSET', nature: 'DEBIT', level: 2, isActive: true, companyId: '' },
  { code: '1500', name: 'INVENTARIO', type: 'ASSET', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
  
  // PASIVOS
  { code: '2000', name: 'PASIVO', type: 'LIABILITY', nature: 'CREDIT', level: 0, isActive: true, companyId: '' },
  { code: '2100', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  { code: '2110', name: 'Proveedores', type: 'LIABILITY', nature: 'CREDIT', level: 2, isActive: true, companyId: '' },
  { code: '2200', name: 'IMPUESTOS POR PAGAR', type: 'LIABILITY', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  { code: '2210', name: 'IVA Debito Fiscal', type: 'LIABILITY', nature: 'CREDIT', level: 2, isActive: true, companyId: '' },
  { code: '2220', name: 'IVA Crédito Fiscal', type: 'LIABILITY', nature: 'CREDIT', level: 2, isActive: true, companyId: '' },
  { code: '2230', name: 'IGTF por Pagar', type: 'LIABILITY', nature: 'CREDIT', level: 2, isActive: true, companyId: '' },
  
  // PATRIMONIO
  { code: '3000', name: 'PATRIMONIO', type: 'EQUITY', nature: 'CREDIT', level: 0, isActive: true, companyId: '' },
  { code: '3100', name: 'Capital', type: 'EQUITY', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  { code: '3200', name: 'Resultados Acumulados', type: 'EQUITY', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  
  // INGRESOS
  { code: '4000', name: 'INGRESOS', type: 'REVENUE', nature: 'CREDIT', level: 0, isActive: true, companyId: '' },
  { code: '4100', name: 'Venta de Mercancía', type: 'REVENUE', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  { code: '4200', name: 'Otros Ingresos', type: 'REVENUE', nature: 'CREDIT', level: 1, isActive: true, companyId: '' },
  
  // GASTOS
  { code: '5000', name: 'GASTOS', type: 'EXPENSE', nature: 'DEBIT', level: 0, isActive: true, companyId: '' },
  { code: '5100', name: 'Costo de Venta', type: 'EXPENSE', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
  { code: '5200', name: 'Gastos Operativos', type: 'EXPENSE', nature: 'DEBIT', level: 1, isActive: true, companyId: '' },
];

class AccountingBridgeClass {
  private static instance: AccountingBridgeClass;
  private accountsCache: Map<string, AccountingAccount[]> = new Map();

  private constructor() {
    console.log('[AccountingBridge] Inicializado');
    
    // Escuchar eventos del ERP para generar asientos automáticos
    eventBus.on(ERP_EVENTS.SALE_CREATED, this.handleSaleCreated.bind(this), 'AccountingBridge');
    eventBus.on(ERP_EVENTS.PURCHASE_ORDER_RECEIVED, this.handlePurchaseReceived.bind(this), 'AccountingBridge');
    eventBus.on(ERP_EVENTS.PAYMENT_RECEIVED, this.handlePaymentReceived.bind(this), 'AccountingBridge');
    eventBus.on(ERP_EVENTS.PAYMENT_MADE, this.handlePaymentMade.bind(this), 'AccountingBridge');
  }

  static getInstance(): AccountingBridgeClass {
    if (!AccountingBridgeClass.instance) {
      AccountingBridgeClass.instance = new AccountingBridgeClass();
    }
    return AccountingBridgeClass.instance;
  }

  /**
   * Inicializar plan de cuentas para una empresa
   */
  async initializeChartOfAccounts(companyId: string): Promise<void> {
    const accounts: AccountingAccount[] = DEFAULT_ACCOUNTS.map((acc, index) => ({
      ...acc,
      id: `ACC-${acc.code}-${companyId}`,
      companyId,
      createdAt: new Date().toISOString(),
    }));

    // Guardar en DB
    try {
      await localDb.financial_accounts?.bulkPut(accounts.map(a => ({
        ...a,
        is_dirty: true,
      })));
      this.accountsCache.set(companyId, accounts);
      console.log(`[AccountingBridge] Plan de cuentas inicializado para empresa ${companyId}`);
    } catch (error) {
      console.error('[AccountingBridge] Error inicializando plan de cuentas:', error);
    }
  }

  /**
   * Obtener cuenta por código
   */
  async getAccountByCode(code: string, companyId?: string): Promise<AccountingAccount | null> {
    const cid = companyId || companyContext.getCompanyId();
    if (!cid) return null;

    let accounts = this.accountsCache.get(cid);
    if (!accounts) {
      accounts = await localDb.financial_accounts?.where('companyId').equals(cid).toArray() || [];
      this.accountsCache.set(cid, accounts);
    }

    return accounts.find(a => a.code === code) || null;
  }

  /**
   * Obtener cuenta por ID
   */
  async getAccountById(accountId: string): Promise<AccountingAccount | null> {
    try {
      return await localDb.financial_accounts?.get(accountId) || null;
    } catch {
      return null;
    }
  }

  /**
   * Crear asiento contable (doble partida)
   */
  async createLedgerEntry(data: {
    transactionId: string;
    date: string;
    description: string;
    reference?: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    currency?: 'USD' | 'VES';
    exchangeRate?: number;
    taxAmount?: number;
    taxType?: 'IVA' | 'IGTF' | 'NONE';
    createdBy?: string;
  }): Promise<{ success: boolean; entry?: LedgerEntry; error?: Error }> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) {
      return { success: false, error: new Error('No hay empresa seleccionada') };
    }

    // Obtener IDs de cuentas
    const debitAccount = await this.getAccountByCode(data.debitAccountCode, companyId);
    const creditAccount = await this.getAccountByCode(data.creditAccountCode, companyId);

    if (!debitAccount || !creditAccount) {
      return { success: false, error: new Error('Cuentas contables no encontradas') };
    }

    const entry: LedgerEntry = {
      id: `LED-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      transactionId: data.transactionId,
      companyId,
      date: data.date,
      description: data.description,
      reference: data.reference,
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
      amount: data.amount,
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate,
      taxAmount: data.taxAmount,
      taxType: data.taxType,
      isPosted: false,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy,
    };

    try {
      await localDb.ledger_entries?.put({
        ...entry,
        is_dirty: true,
      });

      // Emitir evento
      eventBus.emit(ERP_EVENTS.LEDGER_ENTRY_CREATED, entry, {
        sourceModule: 'AccountingBridge',
        transactionId: data.transactionId,
        companyId,
      });

      return { success: true, entry };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Crear asiento de diario (múltiples partidas)
   */
  async createJournalEntry(data: {
    transactionId: string;
    date: string;
    description: string;
    entries: Array<{ accountCode: string; debit: number; credit: number; description?: string }>;
    createdBy?: string;
  }): Promise<{ success: boolean; entry?: JournalEntry; error?: Error }> {
    const companyId = companyContext.getCompanyId();
    if (!companyId) {
      return { success: false, error: new Error('No hay empresa seleccionada') };
    }

    // Validar que esté balanceado
    const totalDebit = data.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { success: false, error: new Error('Asiento desbalanceado') };
    }

    // Convertir códigos a IDs
    const journalEntries = await Promise.all(
      data.entries.map(async (e) => {
        const account = await this.getAccountByCode(e.accountCode, companyId);
        return {
          accountId: account?.id || '',
          debit: e.debit,
          credit: e.credit,
          description: e.description,
        };
      })
    );

    const entry: JournalEntry = {
      id: `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      transactionId: data.transactionId,
      companyId,
      date: data.date,
      description: data.description,
      entries: journalEntries,
      totalDebit,
      totalCredit,
      isBalanced: true,
      isPosted: false,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy,
    };

    try {
      await localDb.journal_entries?.put({
        ...entry,
        is_dirty: true,
      });

      eventBus.emit(ERP_EVENTS.JOURNAL_ENTRY_CREATED, entry, {
        sourceModule: 'AccountingBridge',
        transactionId: data.transactionId,
        companyId,
      });

      return { success: true, entry };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Postear asiento (registrar en libro mayor)
   */
  async postEntry(entryId: string): Promise<boolean> {
    try {
      const entry = await localDb.ledger_entries?.get(entryId);
      if (entry) {
        await localDb.ledger_entries?.update(entryId, { isPosted: true });
        return true;
      }
      
      const journal = await localDb.journal_entries?.get(entryId);
      if (journal) {
        await localDb.journal_entries?.update(entryId, { isPosted: true });
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Obtener saldo de cuenta
   */
  async getAccountBalance(accountCode: string, companyId?: string): Promise<number> {
    const cid = companyId || companyContext.getCompanyId();
    if (!cid) return 0;

    const account = await this.getAccountByCode(accountCode, cid);
    if (!account) return 0;

    const entries = await localDb.ledger_entries
      ?.where('companyId')
      .equals(cid)
      .and(e => e.debitAccountId === account.id || e.creditAccountId === account.id)
      .toArray() || [];

    let balance = 0;
    entries.forEach(e => {
      if (e.debitAccountId === account.id) {
        balance += e.amount;
      }
      if (e.creditAccountId === account.id) {
        balance -= e.amount;
      }
    });

    return account.nature === 'DEBIT' ? balance : -balance;
  }

  // Handlers de eventos

  private async handleSaleCreated(event: any): Promise<void> {
    // Generar asiento de venta automáticamente
    const { id: transactionId, total, taxAmount = 0 } = event.payload;
    
    // Dédito a cuenta por cobrar
    // Crédito a ingreso por venta
    // Débito a IVA crédito fiscal (si aplica)
    // Crédito a IVA débito fiscal (si aplica)
    
    const journalData = {
      transactionId,
      date: new Date().toISOString(),
      description: `Venta - ${transactionId}`,
      entries: [
        { accountCode: '1310', debit: total, credit: 0 }, // Clientes
        { accountCode: '4100', debit: 0, credit: total - taxAmount }, // Venta
        { accountCode: '2220', debit: 0, credit: taxAmount }, // IVA Crédito
        { accountCode: '2210', debit: taxAmount, credit: 0 }, // IVA Débito
      ],
    };

    await this.createJournalEntry(journalData);
  }

  private async handlePurchaseReceived(event: any): Promise<void> {
    const { id: transactionId, total, taxAmount = 0 } = event.payload;
    
    const journalData = {
      transactionId,
      date: new Date().toISOString(),
      description: `Compra - ${transactionId}`,
      entries: [
        { accountCode: '1500', debit: total - taxAmount, credit: 0 }, // Inventario
        { accountCode: '2220', debit: taxAmount, credit: 0 }, // IVA Crédito
        { accountCode: '2110', debit: 0, credit: total }, // Proveedores
      ],
    };

    await this.createJournalEntry(journalData);
  }

  private async handlePaymentReceived(event: any): Promise<void> {
    const { id: transactionId, amount, method } = event.payload;
    
    // Según método de pago, creditear la cuenta correspondiente
    const accountMap: Record<string, string> = {
      cash: '1110',
      bank: '1210',
      credit: '1310',
    };

    const journalData = {
      transactionId,
      date: new Date().toISOString(),
      description: `Cobro - ${transactionId}`,
      entries: [
        { accountCode: accountMap[method] || '1110', debit: amount, credit: 0 },
        { accountCode: '1310', debit: 0, credit: amount },
      ],
    };

    await this.createJournalEntry(journalData);
  }

  private async handlePaymentMade(event: any): Promise<void> {
    const { id: transactionId, amount, method } = event.payload;
    
    const accountMap: Record<string, string> = {
      cash: '1110',
      bank: '1210',
    };

    const journalData = {
      transactionId,
      date: new Date().toISOString(),
      description: `Pago - ${transactionId}`,
      entries: [
        { accountCode: '2110', debit: amount, credit: 0 }, // Proveedores
        { accountCode: accountMap[method] || '1110', debit: 0, credit: amount },
      ],
    };

    await this.createJournalEntry(journalData);
  }
}

export const accountingBridge = AccountingBridgeClass.getInstance();
export default accountingBridge;