/**
 * Feature Flag & RBAC/ABAC Service
 * Source of truth for enabling/disabling modules per tenant or globally.
 */
import { SyncService } from "@/core/sync/SyncService";

export interface FeatureFlag {
  id: string;
  key: string;  // e.g. 'MODULE_FINANCE_ACTIVE', 'NOTIFICATION_SMS'
  description: string;
  isEnabled: boolean;
  tenantId?: string; // If null, applies globally to all tenants
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;

  private constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Evaluates if a specific feature is enabled for a tenant.
   * Super Admins can override this conceptually from the Gateway.
   */
  public async isFeatureEnabled(key: string, tenantId?: string): Promise<boolean> {
    try {
      const query = SyncService.getQuery('feature_flags').where('key').equals(key);
      const flags: FeatureFlag[] = await query.toArray();

      if (flags.length === 0) return false; // Default secure posture: disabled

      // 1. Check Tenant Specific Flag
      if (tenantId) {
        const tenantFlag = flags.find(f => f.tenantId === tenantId);
        if (tenantFlag) return tenantFlag.isEnabled;
      }

      // 2. Fallback to Global Flag
      const globalFlag = flags.find(f => !f.tenantId);
      return globalFlag ? globalFlag.isEnabled : false;

    } catch (error) {
      console.error(`[FeatureFlagService] Failed to fetch flag: ${key}`, error);
      return false; // Fail secure
    }
  }

  /**
   * Super Admin Only: Toggle a feature flag across the system.
   */
  public async setFeatureFlag(key: string, isEnabled: boolean, description: string, tenantId?: string): Promise<void> {
    const id = crypto.randomUUID();
    
    // In a real cloud setup, this needs to traverse the "Aprobar/Versionar" workflow first.
    console.log(`[FeatureFlagService] Dispatching flag update: ${key} -> ${isEnabled} for tenant ${tenantId || 'GLOBAL'}`);
    
    await SyncService.mutate('feature_flags', 'INSERT', {
      id,
      key,
      description,
      is_enabled: isEnabled,
      tenant_id: tenantId || null,
      updated_at: new Date().toISOString()
    });
  }
}

export const featureFlags = FeatureFlagService.getInstance();
