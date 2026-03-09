/**
 * useMovements - Hook para gestión de movimientos de inventario
 * Optimizado para consultas directas a localDb
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';

export interface InventoryMovement {
  id: string;
  date: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer';
  productId: string;
  productName: string;
  cauplas: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  warehouse: string;
  warehouseId: string;
  destinationWarehouse?: string;
  destinationWarehouseId?: string;
  reason: string;
  reference?: string;
  createdBy: string;
  notes?: string;
  tenant_id?: string;
  created_at?: string;
}

export const useMovements = (itemsPerPage = 50) => {
  const { tenant } = useSystemConfig();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMovements = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query;
      
      // Use compound index for type if applicable
      if (typeFilter !== 'all') {
        query = localDb.inventory_movements
          .where('[tenant_id+type]')
          .equals([tenant.id, typeFilter]);
      } else {
        query = localDb.inventory_movements
          .where('tenant_id')
          .equals(tenant.id);
      }

      // Execute query and get results
      const allMovements = await query.toArray();
      
      let filtered = allMovements as InventoryMovement[];

      // In-memory filters for fields not easily indexed or requiring partial matching
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(m =>
          (m.productName?.toLowerCase() || "").includes(q) ||
          (m.cauplas?.toLowerCase() || "").includes(q) ||
          (m.reference?.toLowerCase() || "").includes(q)
        );
      }

      if (warehouseFilter !== 'all') {
        filtered = filtered.filter(m => m.warehouseId === warehouseFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(m => {
          const movDate = new Date(m.date);
          if (dateFilter === 'today') {
            return movDate.toDateString() === now.toDateString();
          } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return movDate >= weekAgo;
          } else if (dateFilter === 'month') {
            return movDate.getMonth() === now.getMonth() && 
                   movDate.getFullYear() === now.getFullYear();
          }
          return true;
        });
      }

      // Optimization: Only sort the filtered results
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTotalCount(filtered.length);
      
      // Manual Pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      setMovements(filtered.slice(startIndex, startIndex + itemsPerPage));
    } catch (error) {
      console.error('[useMovements] Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, searchQuery, typeFilter, warehouseFilter, dateFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const stats = useMemo(() => {
    const totalEntries = movements
      .filter(m => m.type === 'entry')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalExits = movements
      .filter(m => m.type === 'exit')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    return {
      totalCount,
      totalEntries,
      totalExits,
      thisMonthCount: movements.length
    };
  }, [movements, totalCount]);

  const createMovement = async (movement: Omit<InventoryMovement, 'id'>) => {
    if (!tenant?.id) return;
    const newMovement: InventoryMovement = {
      ...movement,
      id: `MOV-${Date.now()}`,
      tenant_id: tenant.id,
      created_at: new Date().toISOString()
    };
    try {
      await localDb.inventory_movements.add(newMovement);
      setMovements((prev) => [newMovement, ...prev.slice(0, itemsPerPage - 1)]);
    } catch (error) {
      console.error('[useMovements] Error creating movement:', error);
    }
  };

  return {
    movements,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    warehouseFilter,
    setWarehouseFilter,
    dateFilter,
    setDateFilter,
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(totalCount / itemsPerPage),
    stats,
    createMovement,
    refresh: fetchMovements
  };
};
