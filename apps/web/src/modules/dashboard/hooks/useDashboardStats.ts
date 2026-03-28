import { useState, useEffect, useCallback } from "react";
import { DataAggregationService, DateRange } from "@/core/services/DataAggregationService";

export function useDashboardStats(tenantId: string, dateRange: DateRange = "all_time") {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!tenantId || tenantId === "none") return;
    setIsLoading(true);
    try {
      const data = await DataAggregationService.getGlobalKPIs(tenantId, dateRange);
      setStats(data);
    } catch (error) {
      console.error("[useDashboardStats] Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, dateRange]);

  useEffect(() => {
    fetchStats();
    
    // Refresco cada 30s para datos compartidos
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, isLoading, refresh: fetchStats };
}
