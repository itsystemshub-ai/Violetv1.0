import { localDb } from './localDb';
import { SyncService } from './SyncService';
import { FinancialTransaction } from './index';
import { useNotificationStore } from '@/hooks/useNotificationStore';

/**
 * AccountingService
 * Maneja la lógica de contabilidad automatizada y partida doble.
 * Soporta moneda dual (USD/Bs) para cumplimiento fiscal en Venezuela.
 */
export const AccountingService = {
  
  // Códigos de cuenta estándar (Plan de cuentas simplificado según normativa venezolana)
  ACCOUNTS: {
    CASH: '1.1.01.01',
    RECEIVABLE: '1.1.02.01',
    IVA_PAYABLE: '2.1.02.01',
    SALES_REVENUE: '4.1.01.01',
    COGS: '5.1.01.01',
    INVENTORY: '1.1.03.01',
    PAYABLE: '2.1.01.01',
    IVA_RECEIVABLE: '1.1.06.01',
    ISLR_WITHHOLDING: '2.1.02.02',
    IGTF_PAYABLE: '2.1.02.03',     // IGTF por pagar
    IGTF_EXPENSE: '5.1.06.01',     // Gasto IGTF
    EXCHANGE_GAIN: '4.2.01.01',    // Ganancia por diferencial cambiario
    EXCHANGE_LOSS: '5.1.07.01',    // Pérdida por diferencial cambiario
  },

  /**
   * Registra un asiento contable automático con soporte de moneda dual.
   */
  async postTransaction(params: {
    tenantId: string;
    description: string;
    referenceId?: string;
    tasaCambio?: number; // Tasa BCV del día
    entries: {
      accountCode: string;
      type: 'debe' | 'haber';
      amount: number; // Monto base en USD
    }[];
  }) {
    const { tenantId, description, referenceId, tasaCambio, entries } = params;

    // Verificar balance (Partida Doble)
    const totalDebe = entries.filter(e => e.type === 'debe').reduce((acc, e) => acc + e.amount, 0);
    const totalHaber = entries.filter(e => e.type === 'haber').reduce((acc, e) => acc + e.amount, 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error(`Error de partida doble: Debe (${totalDebe}) != Haber (${totalHaber})`);
    }

    const transactionIds: string[] = [];

    for (const entry of entries) {
      // 1. Encontrar la cuenta por código
      const account = await localDb.financial_accounts
        .where({ tenant_id: tenantId, code: entry.accountCode })
        .first();

      if (!account) {
        console.warn(`[AccountingService] Cuenta no encontrada: ${entry.accountCode}. No se pudo procesar el asiento.`);
        continue;
      }

      const txId = crypto.randomUUID();
      const montoBs = tasaCambio ? parseFloat((entry.amount * tasaCambio).toFixed(2)) : undefined;

      const txPayload: FinancialTransaction = {
        id: txId,
        tenant_id: tenantId,
        account_id: account.id,
        date: new Date().toISOString(),
        description: description,
        type: entry.type,
        amount: entry.amount,
        monto_bs: montoBs,
        tasa_cambio: tasaCambio,
        reference_id: referenceId
      };

      // 2. Insertar transacción
      await SyncService.mutate('financial_transactions', 'INSERT', txPayload, txId);
      transactionIds.push(txId);

      // 3. Actualizar balance de la cuenta
      let newBalance = account.balance;
      if (entry.type === 'debe') {
        if (['activo', 'egreso'].includes(account.type)) {
          newBalance += entry.amount;
        } else {
          newBalance -= entry.amount;
        }
      } else {
        if (['pasivo', 'patrimonio', 'ingreso'].includes(account.type)) {
          newBalance += entry.amount;
        } else {
          newBalance -= entry.amount;
        }
      }

    await SyncService.mutate('financial_accounts', 'UPDATE', { 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      }, account.id);
    }

    // Notificar al sistema
    useNotificationStore.getState().addNotification({
      module: 'Finanzas',
      type: 'success',
      title: 'Asiento Contable Registrado',
      message: `${description} por un total de ${totalDebe.toFixed(2)} USD.`,
    });

    return { success: true, transactionIds };
  },

  /**
   * Genera el asiento automático para una Venta.
   */
  async postSale(invoice: any) {
    if (invoice.type !== 'venta' || invoice.status !== 'pagada') return;

    return this.postTransaction({
      tenantId: invoice.tenant_id,
      description: `Venta Factura #${invoice.number}`,
      referenceId: invoice.id,
      tasaCambio: invoice.exchangeRateUsed,
      entries: [
        { accountCode: this.ACCOUNTS.CASH, type: 'debe', amount: invoice.total },
        { accountCode: this.ACCOUNTS.SALES_REVENUE, type: 'haber', amount: invoice.subtotal },
        { accountCode: this.ACCOUNTS.IVA_PAYABLE, type: 'haber', amount: invoice.taxTotal }
      ]
    });
  },

  /**
   * Genera el asiento automático para una Compra con retenciones.
   */
  async postPurchase(invoice: any, ivaWithholding: number = 0, islrWithholding: number = 0) {
    if (invoice.type !== 'compra') return;

    const netToPay = invoice.total - ivaWithholding - islrWithholding;
    const subtotal = invoice.subtotal || (invoice.total - (invoice.taxTotal || 0));
    const taxTotal = (invoice.taxTotal !== undefined) ? invoice.taxTotal : (invoice.total - subtotal);

    const entries = [
      { accountCode: this.ACCOUNTS.INVENTORY, type: 'debe' as const, amount: subtotal },
      { accountCode: this.ACCOUNTS.IVA_RECEIVABLE, type: 'debe' as const, amount: taxTotal },
      { accountCode: this.ACCOUNTS.PAYABLE, type: 'haber' as const, amount: netToPay },
    ];

    if (ivaWithholding > 0) {
      entries.push({ accountCode: this.ACCOUNTS.IVA_PAYABLE, type: 'haber' as const, amount: ivaWithholding });
    }

    if (islrWithholding > 0) {
      entries.push({ accountCode: this.ACCOUNTS.ISLR_WITHHOLDING, type: 'haber' as const, amount: islrWithholding });
    }

    return this.postTransaction({
      tenantId: invoice.tenant_id,
      description: `Compra Factura #${invoice.number} - Proveedor: ${invoice.customerName}`,
      referenceId: invoice.id,
      tasaCambio: invoice.exchangeRateUsed,
      entries: entries
    });
  },

  /**
   * Registra un pago con IGTF automático (3% para divisas).
   */
  async postPaymentWithIGTF(params: {
    tenantId: string;
    invoiceId: string;
    montoBase: number;
    montoIGTF: number;
    metodoPago: string;
    tasaCambio?: number;
  }) {
    const entries: { accountCode: string; type: 'debe' | 'haber'; amount: number }[] = [
      { accountCode: this.ACCOUNTS.CASH, type: 'debe', amount: params.montoBase },
      { accountCode: this.ACCOUNTS.RECEIVABLE, type: 'haber', amount: params.montoBase },
    ];

    if (params.montoIGTF > 0) {
      entries.push(
        { accountCode: this.ACCOUNTS.IGTF_EXPENSE, type: 'debe', amount: params.montoIGTF },
        { accountCode: this.ACCOUNTS.IGTF_PAYABLE, type: 'haber', amount: params.montoIGTF }
      );
    }

    return this.postTransaction({
      tenantId: params.tenantId,
      description: `Cobro con ${params.metodoPago}${params.montoIGTF > 0 ? ' + IGTF 3%' : ''}`,
      referenceId: params.invoiceId,
      tasaCambio: params.tasaCambio,
      entries,
    });
  },

  /**
   * Registra asiento de diferencial cambiario.
   */
  async postDiferencialCambiario(params: {
    tenantId: string;
    referenceId: string;
    diferencial: number;
    tipo: 'ganancia' | 'perdida';
    tasaCambio: number;
  }) {
    const absDif = Math.abs(params.diferencial);
    if (absDif < 0.01) return;

    const entries = params.tipo === 'ganancia'
      ? [
          { accountCode: this.ACCOUNTS.RECEIVABLE, type: 'debe' as const, amount: absDif },
          { accountCode: this.ACCOUNTS.EXCHANGE_GAIN, type: 'haber' as const, amount: absDif },
        ]
      : [
          { accountCode: this.ACCOUNTS.EXCHANGE_LOSS, type: 'debe' as const, amount: absDif },
          { accountCode: this.ACCOUNTS.RECEIVABLE, type: 'haber' as const, amount: absDif },
        ];

    return this.postTransaction({
      tenantId: params.tenantId,
      description: `Diferencial cambiario (${params.tipo})`,
      referenceId: params.referenceId,
      tasaCambio: params.tasaCambio,
      entries,
    });
  },

  /**
   * Calcula el resumen financiero para reportes (dual USD/Bs).
   */
  async getFinancialSummary(tenantId: string, tasaCambio?: number) {
    const accounts = await localDb.financial_accounts
      .where("tenant_id")
      .equals(tenantId)
      .toArray();

    const summary = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      assets_bs: 0,
      liabilities_bs: 0,
      equity_bs: 0,
      revenue_bs: 0,
      expenses_bs: 0,
      netIncome_bs: 0,
    };

    const tasa = tasaCambio || 1;

    accounts.forEach(acc => {
      switch (acc.type) {
        case 'activo': summary.assets += acc.balance; break;
        case 'pasivo': summary.liabilities += acc.balance; break;
        case 'patrimonio': summary.equity += acc.balance; break;
        case 'ingreso': summary.revenue += acc.balance; break;
        case 'egreso': summary.expenses += acc.balance; break;
      }
    });

    summary.netIncome = summary.revenue - summary.expenses;

    summary.assets_bs = parseFloat((summary.assets * tasa).toFixed(2));
    summary.liabilities_bs = parseFloat((summary.liabilities * tasa).toFixed(2));
    summary.equity_bs = parseFloat((summary.equity * tasa).toFixed(2));
    summary.revenue_bs = parseFloat((summary.revenue * tasa).toFixed(2));
    summary.expenses_bs = parseFloat((summary.expenses * tasa).toFixed(2));
    summary.netIncome_bs = parseFloat((summary.netIncome * tasa).toFixed(2));

    return summary;
  }
};
