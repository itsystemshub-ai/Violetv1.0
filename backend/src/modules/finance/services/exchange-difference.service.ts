/**
 * ExchangeDifferenceService
 * 
 * Maneja el cálculo y registro del Diferencial Cambiario según normativa venezolana.
 * 
 * Concepto:
 * Cuando una factura se emite en USD a una tasa X y se cobra a una tasa Y,
 * la diferencia en Bs debe registrarse como Ganancia o Pérdida en Cambio.
 * 
 * Ejemplo:
 * - Día 1: Factura $100 × Bs.60 = Bs.6,000 (CxC)
 * - Día 5: Cobro $100 × Bs.62 = Bs.6,200 (Banco)
 * - Diferencia: Bs.200 = Ganancia en Cambio
 * 
 * Asiento generado:
 * DEBE: Banco Bs.6,200
 * HABER: Cuentas por Cobrar Bs.6,000
 * HABER: Ganancia en Cambio Bs.200
 */

import { localDb } from './localDb';
import { LedgerService } from './LedgerService';

export interface ExchangeDifference {
  id: string;
  invoice_id: string;
  payment_id: string;
  invoice_number: string;
  customer_name: string;
  
  // Montos en USD
  amount_usd: number;
  
  // Tasas de cambio
  original_rate: number;      // Tasa al momento de facturar
  payment_rate: number;        // Tasa al momento de cobrar
  
  // Diferencia en Bs
  original_amount_bs: number;  // amount_usd × original_rate
  payment_amount_bs: number;   // amount_usd × payment_rate
  difference_bs: number;       // payment_amount_bs - original_amount_bs
  
  // Tipo de diferencia
  type: 'GAIN' | 'LOSS';      // GAIN si difference_bs > 0, LOSS si < 0
  
  // Contabilidad
  accounting_entry_id?: string;
  
  // Auditoría
  tenant_id: string;
  created_by?: string;
  created_at: string;
  notes?: string;
}

export interface PaymentWithExchangeDifference {
  payment_id: string;
  invoice_id: string;
  amount_usd: number;
  payment_rate: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
}

export class ExchangeDifferenceService {
  
  /**
   * Calcula el diferencial cambiario entre la factura y el pago
   */
  static calculateDifference(
    invoice: any,
    payment: PaymentWithExchangeDifference
  ): ExchangeDifference {
    const originalRate = invoice.exchange_rate || invoice.exchangeRate || 0;
    const paymentRate = payment.payment_rate;
    const amountUSD = payment.amount_usd;
    
    const originalAmountBs = amountUSD * originalRate;
    const paymentAmountBs = amountUSD * paymentRate;
    const differenceBs = paymentAmountBs - originalAmountBs;
    
    return {
      id: crypto.randomUUID(),
      invoice_id: payment.invoice_id,
      payment_id: payment.payment_id,
      invoice_number: invoice.number || invoice.invoice_number || 'S/N',
      customer_name: invoice.customerName || invoice.customer_name || 'Cliente',
      
      amount_usd: amountUSD,
      
      original_rate: originalRate,
      payment_rate: paymentRate,
      
      original_amount_bs: originalAmountBs,
      payment_amount_bs: paymentAmountBs,
      difference_bs: differenceBs,
      
      type: differenceBs >= 0 ? 'GAIN' : 'LOSS',
      
      tenant_id: invoice.tenant_id || invoice.tenantId || '',
      created_at: new Date().toISOString(),
    };
  }
  
  /**
   * Genera el asiento contable para el diferencial cambiario
   * 
   * Cuentas contables sugeridas:
   * - 5.4.1.01 - Ganancia en Cambio (Otros Ingresos)
   * - 6.4.1.01 - Pérdida en Cambio (Otros Egresos)
   */
  static async generateAccountingEntry(
    difference: ExchangeDifference,
    tenant: any,
    _payment: PaymentWithExchangeDifference
  ): Promise<string | null> {
    try {
      const isGain = difference.type === 'GAIN';
      const absAmount = Math.abs(difference.difference_bs);
      
      // Cuentas contables
      const BANK_ACCOUNT = '1.1.1.02'; // Banco
      const ACCOUNTS_RECEIVABLE = '1.1.2.01'; // Cuentas por Cobrar
      const EXCHANGE_GAIN = '5.4.1.01'; // Ganancia en Cambio
      const EXCHANGE_LOSS = '6.4.1.01'; // Pérdida en Cambio
      
      const entries = [];
      
      // DEBE: Banco (monto cobrado en Bs)
      entries.push({
        account_code: BANK_ACCOUNT,
        account_name: 'Banco',
        debit: difference.payment_amount_bs,
        credit: 0,
        description: `Cobro Factura ${difference.invoice_number} - ${difference.customer_name}`,
      });
      
      // HABER: Cuentas por Cobrar (monto original en Bs)
      entries.push({
        account_code: ACCOUNTS_RECEIVABLE,
        account_name: 'Cuentas por Cobrar',
        debit: 0,
        credit: difference.original_amount_bs,
        description: `Cobro Factura ${difference.invoice_number}`,
      });
      
      // HABER o DEBE: Diferencial Cambiario
      if (isGain) {
        // Ganancia: HABER (ingreso)
        entries.push({
          account_code: EXCHANGE_GAIN,
          account_name: 'Ganancia en Cambio',
          debit: 0,
          credit: absAmount,
          description: `Diferencial cambiario Factura ${difference.invoice_number} (Bs.${difference.original_rate.toFixed(2)} → Bs.${difference.payment_rate.toFixed(2)})`,
        });
      } else {
        // Pérdida: DEBE (egreso)
        entries.push({
          account_code: EXCHANGE_LOSS,
          account_name: 'Pérdida en Cambio',
          debit: absAmount,
          credit: 0,
          description: `Diferencial cambiario Factura ${difference.invoice_number} (Bs.${difference.original_rate.toFixed(2)} → Bs.${difference.payment_rate.toFixed(2)})`,
        });
      }
      
      // Crear asiento contable
      const ledgerEntry = await LedgerService.createEntry({
        tenantId: tenant.id,
        description: `Cobro con diferencial cambiario - Factura ${difference.invoice_number}`,
        referenceId: difference.payment_id,
        entries,
      });
      
      return ledgerEntry?.id || null;
    } catch (error) {
      console.error('[ExchangeDifferenceService] Error generando asiento:', error);
      return null;
    }
  }
  
  /**
   * Procesa el pago de una factura con diferencial cambiario
   * 
   * Flujo completo:
   * 1. Calcula el diferencial
   * 2. Genera el asiento contable
   * 3. Registra el diferencial en la BD
   * 4. Actualiza el estado de la factura
   */
  static async processPaymentWithExchangeDifference(
    invoice: any,
    payment: PaymentWithExchangeDifference,
    tenant: any
  ): Promise<ExchangeDifference | null> {
    try {
      // 1. Calcular diferencial
      const difference = this.calculateDifference(invoice, payment);
      
      // 2. Generar asiento contable
      const entryId = await this.generateAccountingEntry(difference, tenant, payment);
      
      if (entryId) {
        difference.accounting_entry_id = entryId;
      }
      
      // 3. Guardar en la base de datos
      await localDb.exchange_differences.add({
        ...difference,
        is_dirty: 1,
        version: 1,
      } as any);
      
      // 4. Actualizar factura (marcar como pagada)
      await localDb.invoices.update(invoice.id, {
        status: 'pagada',
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        payment_reference: payment.reference,
        payment_exchange_rate: payment.payment_rate,
        updated_at: new Date().toISOString(),
      });
      
      return difference;
    } catch (error) {
      console.error('[ExchangeDifferenceService] Error procesando pago:', error);
      return null;
    }
  }
  
  /**
   * Obtiene todos los diferenciales cambiarios de un tenant
   */
  static async getExchangeDifferences(
    tenantId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: 'GAIN' | 'LOSS';
    }
  ): Promise<ExchangeDifference[]> {
    try {
      const query = localDb.exchange_differences
        .where('tenant_id')
        .equals(tenantId);
      
      const results = await query.toArray();
      
      // Filtrar por fecha y tipo si se especifica
      return results.filter((diff: any) => {
        if (filters?.startDate && diff.created_at < filters.startDate) return false;
        if (filters?.endDate && diff.created_at > filters.endDate) return false;
        if (filters?.type && diff.type !== filters.type) return false;
        return true;
      }) as ExchangeDifference[];
    } catch (error) {
      console.error('[ExchangeDifferenceService] Error obteniendo diferenciales:', error);
      return [];
    }
  }
  
  /**
   * Calcula el resumen de diferenciales cambiarios
   */
  static async getSummary(tenantId: string, period?: { start: string; end: string }) {
    const differences = await this.getExchangeDifferences(tenantId, {
      startDate: period?.start,
      endDate: period?.end,
    });
    
    const gains = differences.filter(d => d.type === 'GAIN');
    const losses = differences.filter(d => d.type === 'LOSS');
    
    const totalGains = gains.reduce((sum, d) => sum + d.difference_bs, 0);
    const totalLosses = losses.reduce((sum, d) => sum + Math.abs(d.difference_bs), 0);
    const netDifference = totalGains - totalLosses;
    
    return {
      total_transactions: differences.length,
      gains: {
        count: gains.length,
        total_bs: totalGains,
      },
      losses: {
        count: losses.length,
        total_bs: totalLosses,
      },
      net_difference_bs: netDifference,
      net_type: netDifference >= 0 ? 'GAIN' : 'LOSS',
    };
  }
  
  /**
   * Valida si una factura requiere diferencial cambiario
   */
  static requiresExchangeDifference(
    invoice: any,
    paymentRate: number,
    tolerance: number = 0.01 // Tolerancia de 1 centavo
  ): boolean {
    const originalRate = invoice.exchange_rate || invoice.exchangeRate || 0;
    const difference = Math.abs(paymentRate - originalRate);
    
    return difference > tolerance;
  }
  
  /**
   * Genera reporte de diferenciales cambiarios para auditoría
   */
  static async generateReport(
    tenantId: string,
    period: { start: string; end: string }
  ) {
    const differences = await this.getExchangeDifferences(tenantId, {
      startDate: period.start,
      endDate: period.end,
    });
    
    const summary = await this.getSummary(tenantId, period);
    
    return {
      period,
      summary,
      details: differences.map(d => ({
        fecha: new Date(d.created_at).toLocaleDateString('es-VE'),
        factura: d.invoice_number,
        cliente: d.customer_name,
        monto_usd: d.amount_usd.toFixed(2),
        tasa_factura: d.original_rate.toFixed(2),
        tasa_cobro: d.payment_rate.toFixed(2),
        diferencia_bs: d.difference_bs.toFixed(2),
        tipo: d.type === 'GAIN' ? 'Ganancia' : 'Pérdida',
      })),
    };
  }
}
