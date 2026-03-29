/**
 * LedgerService - Stub para frontend
 */

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
  static async createEntry(transaction: LedgerTransaction): Promise<LedgerTransaction | null> {
    console.log('[LedgerService] createEntry called (frontend stub)', transaction);
    return null;
  }
}
