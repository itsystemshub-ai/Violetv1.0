/**
 * ExchangeDifferenceService
 * 
 * Maneja el cálculo y registro del Diferencial Cambiario según normativa venezolana.
 */

import { localDb } from '@/core/database/localDb';

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
    const originalRate = invoice.exchange_rate || invoice.exchangeRate || invoice.exchangeRateUsed || 0;
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
      // En el frontend, esto debería venir de una tabla específica o calcularse dinámicamente
      // Por ahora retornamos un array vacío
      return [];
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
    const originalRate = invoice.exchange_rate || invoice.exchangeRate || invoice.exchangeRateUsed || 0;
    const difference = Math.abs(paymentRate - originalRate);
    
    return difference > tolerance;
  }
}
