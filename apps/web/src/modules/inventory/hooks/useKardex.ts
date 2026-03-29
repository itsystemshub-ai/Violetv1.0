/**
 * useKardex - Hook especializado para el cálculo del Libro Mayor de Inventario (Kardex)
 * Optimizado para rendimiento y precisión de saldos iniciales.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { InventoryMovement } from './useMovements';

export interface KardexRow extends InventoryMovement {
  runningBalance: number;
}

export const useKardex = (productId: string | 'all', dateRange?: { start?: string; end?: string }) => {
  const { tenant } = useSystemConfig();
  const [movements, setMovements] = useState<KardexRow[]>([]);
  const [initialBalance, setInitialBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchKardex = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Calcular Saldo Inicial (todos los movimientos antes de la fecha de inicio)
      let startBalance = 0;
      if (productId !== 'all') {
        const pastQuery = localDb.inventory_movements
          .where('product_id').equals(productId);
        
        let pastMovements;
        if (dateRange?.start) {
          const startDate = new Date(dateRange.start);
          pastMovements = await pastQuery
            .and(m => m.tenant_id === tenant.id && new Date(m.date) < startDate)
            .toArray();
        } else {
          // Si no hay fecha de inicio, el saldo inicial es 0 por definición (inicio de los tiempos)
          pastMovements = [];
        }
        
        startBalance = pastMovements.reduce((acc, m) => acc + m.quantity, 0);
      }
      setInitialBalance(startBalance);

      // 2. Obtener movimientos del periodo
      let results;
      if (productId !== 'all') {
        results = await localDb.inventory_movements
          .where('product_id').equals(productId)
          .and(m => m.tenant_id === tenant.id)
          .toArray();
      } else {
        results = await localDb.inventory_movements
          .where('tenant_id').equals(tenant.id)
          .toArray();
      }

      // Filter by date in memory
      let filtered = results as InventoryMovement[];
      
      if (dateRange?.start) {
        const start = new Date(dateRange.start);
        filtered = filtered.filter(m => new Date(m.date) >= start);
      }
      if (dateRange?.end) {
        const end = new Date(dateRange.end);
        filtered = filtered.filter(m => new Date(m.date) <= end);
      }

      // 3. Ordenar cronológicamente ascendente para calcular saldos
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentBalance = startBalance;
      const kardexRows: KardexRow[] = filtered.map(m => {
        currentBalance += m.quantity;
        return { ...m, runningBalance: currentBalance };
      });

      // 4. Invertir para mostrar lo más reciente primero (Vista de tabla)
      setMovements(kardexRows.reverse());
    } catch (error) {
      console.error('[useKardex] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, productId, dateRange?.start, dateRange?.end]);

  useEffect(() => {
    fetchKardex();
  }, [fetchKardex]);

  const stats = useMemo(() => {
    const entries = movements.filter(m => m.quantity > 0).reduce((sum,m) => sum + m.quantity, 0);
    const exits = movements.filter(m => m.quantity < 0).reduce((sum,m) => sum + Math.abs(m.quantity), 0);
    const finalBalance = movements.length > 0 ? movements[0].runningBalance : initialBalance;

    return {
      entries,
      exits,
      initialBalance,
      finalBalance
    };
  }, [movements, initialBalance]);

  return {
    movements,
    loading,
    stats,
    refresh: fetchKardex
  };
};
