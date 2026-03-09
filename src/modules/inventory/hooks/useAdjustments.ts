/**
 * useAdjustments - Hook para gestión de ajustes de inventario
 * Interactúa con datos reales de la base de datos local
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { toast } from 'sonner';

export interface AdjustmentItem {
  id: string;
  productId: string;
  productName: string;
  cauplas: string;
  currentStock: number;
  adjustedQuantity: number;
  newStock: number;
  reason: string;
  cost: number;
  totalValue: number;
}

export interface Adjustment {
  id: string;
  date: string;
  type: 'increase' | 'decrease' | 'correction';
  reason: string;
  warehouse: string;
  warehouseId: string;
  items: AdjustmentItem[];
  totalItems: number;
  totalValue: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
  tenant_id?: string;
  created_at?: string;
}

export const useAdjustments = () => {
  const { tenant } = useSystemConfig();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchAdjustments = useCallback(async () => {
    if (!tenant?.id || tenant.id === 'none') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query;
      if (statusFilter !== 'all') {
        query = localDb.inventory_adjustments
          .where('[tenant_id+status]')
          .equals([tenant.id, statusFilter]);
      } else {
        query = localDb.inventory_adjustments
          .where('tenant_id')
          .equals(tenant.id);
      }

      const dbAdjustments = await query.toArray();
      
      // Sort by date desc (Note: if we need absolute performance we could index by date, but sorting < 1000 items is fine)
      setAdjustments((dbAdjustments as Adjustment[]).sort((a,b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('[useAdjustments] Error fetching adjustments:', error);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, statusFilter]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adjustment) => {
      const matchesSearch = 
        adjustment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adjustment.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adjustment.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adjustment.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adjustment.items.some(it => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || adjustment.status === statusFilter;
      const matchesType = typeFilter === 'all' || adjustment.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [adjustments, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      totalAdjustments: adjustments.length,
      pendingAdjustments: adjustments.filter(a => a.status === 'pending').length,
      approvedAdjustments: adjustments.filter(a => a.status === 'approved').length,
      totalValueAdjusted: adjustments
        .filter(a => a.status === 'approved')
        .reduce((sum, a) => sum + a.totalValue, 0),
      increasesCount: adjustments.filter(a => a.type === 'increase').length,
      decreasesCount: adjustments.filter(a => a.type === 'decrease').length,
      thisMonthCount: adjustments.filter(a => {
        const adjDate = new Date(a.date);
        const now = new Date();
        return adjDate.getMonth() === now.getMonth() && adjDate.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [adjustments]);

  const createAdjustment = async (adjustment: Omit<Adjustment, 'id'>) => {
    if (!tenant?.id) return;
    try {
      const id = `ADJ-${Date.now()}`;
      const newAdjustment: Adjustment = {
        ...adjustment,
        id,
        tenant_id: tenant.id,
        created_at: new Date().toISOString()
      };

      await localDb.inventory_adjustments.add(newAdjustment);
      setAdjustments(prev => [newAdjustment, ...prev]);
      toast.success('Ajuste creado exitosamente');
      return id;
    } catch (error) {
      console.error('Error creando ajuste:', error);
      toast.error('Error al crear el ajuste');
    }
  };

  const updateAdjustment = async (id: string, updates: Partial<Adjustment>) => {
    try {
      await localDb.inventory_adjustments.update(id, updates);
      setAdjustments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error('Error actualizando ajuste:', error);
    }
  };

  const deleteAdjustment = async (id: string) => {
    try {
      await localDb.inventory_adjustments.delete(id);
      setAdjustments(prev => prev.filter(a => a.id !== id));
      toast.success('Ajuste eliminado');
    } catch (error) {
      console.error('Error eliminando ajuste:', error);
    }
  };

  const approveAdjustment = async (id: string, approvedBy: string) => {
    const adj = adjustments.find(a => a.id === id);
    if (!adj) return;

    try {
      const updates: Partial<Adjustment> = { 
        status: 'approved',
        approvedBy,
        approvedDate: new Date().toISOString().split('T')[0],
      };

      // 1. Update Adjustment Status
      await localDb.inventory_adjustments.update(id, updates);

      // 2. Create Individual Inventory Movements and Update Stock
      for (const item of adj.items) {
        // Create movement
        await localDb.inventory_movements.add({
          id: `MOV-${Date.now()}-${item.productId}`,
          date: new Date().toISOString(),
          type: 'adjustment',
          productId: item.productId,
          productName: item.productName,
          cauplas: item.cauplas,
          quantity: item.adjustedQuantity,
          unitCost: item.cost,
          totalValue: item.totalValue,
          warehouse: adj.warehouse,
          warehouseId: adj.warehouseId,
          reason: adj.reason,
          reference: adj.id,
          createdBy: adj.createdBy,
          tenant_id: adj.tenant_id,
          created_at: new Date().toISOString()
        });

        // Update Product Stock
        const product = await localDb.products.get(item.productId);
        if (product) {
          await localDb.products.update(item.productId, {
            stock: (product.stock || 0) + item.adjustedQuantity
          });
        }
      }

      setAdjustments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success('Ajuste aprobado y stock actualizado');
    } catch (error) {
      console.error('Error aprobando ajuste:', error);
      toast.error('Error al aprobar el ajuste');
    }
  };

  const rejectAdjustment = async (id: string) => {
    await updateAdjustment(id, { status: 'rejected' });
    toast.info('Ajuste rechazado');
  };

  const submitForApproval = async (id: string) => {
    await updateAdjustment(id, { status: 'pending' });
    toast.info('Ajuste enviado para aprobación');
  };

  return {
    adjustments: filteredAdjustments,
    allAdjustments: adjustments,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    stats,
    createAdjustment,
    updateAdjustment,
    deleteAdjustment,
    approveAdjustment,
    rejectAdjustment,
    submitForApproval,
  };
};
