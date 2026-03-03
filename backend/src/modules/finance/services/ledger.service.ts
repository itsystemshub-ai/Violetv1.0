/**
 * LedgerService
 * 
 * Servicio para gestionar el Libro Mayor (Ledger) y asientos contables.
 * Maneja la contabilidad de doble partida según normativa venezolana.
 */

import { localDb } from './localDb';

export interface LedgerEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
}

export interface LedgerTransaction {
  id?: string;
  tenantId: string;
  description: string;
  referenceId?: string;
  entries: LedgerEntry[];
  created_at?: string;
  created_by?: string;
}

export class LedgerService {
  
  /**
   * Crea un asiento contable
   * Valida que la suma de débitos = suma de créditos (doble partida)
   */
  static async createEntry(transaction: LedgerTransaction): Promise<LedgerTransaction | null> {
    try {
      // Validar doble partida
      const totalDebit = transaction.entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = transaction.entries.reduce((sum, e) => sum + e.credit, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.error('[LedgerService] Error: Débitos y créditos no cuadran', {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
        });
        return null;
      }
      
      // Crear transacción principal
      const transactionId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const ledgerTransaction = {
        id: transactionId,
        tenant_id: transaction.tenantId,
        description: transaction.description,
        reference_id: transaction.referenceId,
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_at: now,
        created_by: transaction.created_by,
        is_dirty: 1,
      };
      
      await localDb.financial_transactions.add(ledgerTransaction);
      
      // Crear entradas individuales (detalle del asiento)
      for (const entry of transaction.entries) {
        await localDb.financial_accounts.add({
          id: crypto.randomUUID(),
          transaction_id: transactionId,
          tenant_id: transaction.tenantId,
          code: entry.account_code,
          name: entry.account_name,
          debit: entry.debit,
          credit: entry.credit,
          description: entry.description,
          created_at: now,
          is_dirty: 1,
        });
      }
      
      return {
        ...transaction,
        id: transactionId,
        created_at: now,
      };
    } catch (error) {
      console.error('[LedgerService] Error creando asiento:', error);
      return null;
    }
  }
  
  /**
   * Obtiene todas las transacciones de un tenant
   */
  static async getTransactions(tenantId: string, filters?: {
    startDate?: string;
    endDate?: string;
    accountCode?: string;
  }): Promise<any[]> {
    try {
      let query = localDb.financial_transactions
        .where('tenant_id')
        .equals(tenantId);
      
      const results = await query.toArray();
      
      return results.filter((tx: any) => {
        if (filters?.startDate && tx.created_at < filters.startDate) return false;
        if (filters?.endDate && tx.created_at > filters.endDate) return false;
        return true;
      });
    } catch (error) {
      console.error('[LedgerService] Error obteniendo transacciones:', error);
      return [];
    }
  }
  
  /**
   * Obtiene el balance de una cuenta específica
   */
  static async getAccountBalance(tenantId: string, accountCode: string): Promise<{
    debit: number;
    credit: number;
    balance: number;
  }> {
    try {
      const accounts = await localDb.financial_accounts
        .where('tenant_id')
        .equals(tenantId)
        .toArray();
      
      const filtered = accounts.filter((acc: any) => acc.code === accountCode);
      
      const totalDebit = filtered.reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0);
      const totalCredit = filtered.reduce((sum: number, acc: any) => sum + (acc.credit || 0), 0);
      
      return {
        debit: totalDebit,
        credit: totalCredit,
        balance: totalDebit - totalCredit,
      };
    } catch (error) {
      console.error('[LedgerService] Error calculando balance:', error);
      return { debit: 0, credit: 0, balance: 0 };
    }
  }
}
