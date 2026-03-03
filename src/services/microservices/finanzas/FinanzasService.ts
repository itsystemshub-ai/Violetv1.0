/**
 * MS Finanzas/Contabilidad
 * Handles all financial operations, accounts, and manual transactions.
 */
import { SyncService } from "@/lib/SyncService";
import { FinancialTransaction, FinancialAccount } from "@/lib";

export class FinanzasService {
  private static instance: FinanzasService;

  private constructor() {}

  public static getInstance(): FinanzasService {
    if (!FinanzasService.instance) {
      FinanzasService.instance = new FinanzasService();
    }
    return FinanzasService.instance;
  }

  public async getAccounts(tenantId: string): Promise<FinancialAccount[]> {
    return SyncService.getQuery('accounts')
      .where('tenant_id').equals(tenantId)
      .toArray();
  }

  public async getTransactions(tenantId: string): Promise<FinancialTransaction[]> {
    return SyncService.getQuery('transactions')
      .where('tenant_id').equals(tenantId)
      .toArray();
  }

  public async createTransaction(payload: Partial<FinancialTransaction>, tenantId: string): Promise<void> {
    const id = crypto.randomUUID();
    await SyncService.mutate('transactions', 'INSERT', {
      ...payload,
      id,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    }, id);
  }

  // Future integration with ESB/iPaaS
  public async syncWithBanks(): Promise<void> {
    console.log("[MS Finanzas] Syncing with Cloud iPaaS / Bank APIs...");
  }
}

export const finanzasService = FinanzasService.getInstance();
