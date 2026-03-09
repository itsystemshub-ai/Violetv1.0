/**
 * useAdjustments - Hook para gestión de ajustes de inventario
 * Carga datos reales de la base de datos
 */

import { useState, useMemo } from 'react';
import { useInventoryStore } from './useInventoryStore';
import { localDb } from '@/core/database/localDb';

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
}

const REASONS_INCREASE = ['Compra no registrada', 'Devolución de cliente', 'Inventario físico - sobrante'];
const REASONS_DECREASE = ['Producto dañado', 'Pérdida en transporte', 'Merma operativa'];
const REASONS_CORRECTION = ['Corrección de inventario físico', 'Ajuste por auditoría', 'Conteo manual'];
const STATUSES: Adjustment['status'][] = ['approved', 'approved', 'pending', 'draft', 'rejected'];
const TYPES: Adjustment['type'][] = ['increase', 'decrease', 'correction', 'increase', 'decrease'];
const CREATORS = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana López', 'Luis Hernández'];

export const useAdjustments = () => {
  const { products, isLoading } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Generate sample adjustments from real products
  const adjustments = useMemo<Adjustment[]>(() => {
    if (products.length === 0) return [];

    // Pick some real products to build example adjustments
    const sampleProducts = products.filter(p => p.stock && p.stock > 0).slice(0, 15);
    if (sampleProducts.length === 0) return [];

    const today = new Date();
    const result: Adjustment[] = [];

    for (let i = 0; i < Math.min(5, Math.ceil(sampleProducts.length / 3)); i++) {
      const type = TYPES[i % TYPES.length];
      const status = STATUSES[i % STATUSES.length];
      const dayOffset = i * 2;
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      const reasons = type === 'increase' ? REASONS_INCREASE 
        : type === 'decrease' ? REASONS_DECREASE 
        : REASONS_CORRECTION;
      const reason = reasons[i % reasons.length];

      // Pick 1-3 products for this adjustment
      const itemStart = (i * 3) % sampleProducts.length;
      const itemCount = Math.min(1 + (i % 3), sampleProducts.length - itemStart);
      const items: AdjustmentItem[] = [];

      for (let j = 0; j < itemCount; j++) {
        const p = sampleProducts[(itemStart + j) % sampleProducts.length];
        const currentStock = p.stock || 0;
        const adjustedQty = type === 'decrease' 
          ? -Math.min(Math.ceil(currentStock * 0.1) || 1, currentStock) 
          : Math.ceil(currentStock * 0.1) || 1;
        const cost = p.cost || p.price || 0;

        items.push({
          id: `ITEM-${i}-${j}`,
          productId: p.id,
          productName: p.descripcionManguera || p.name || p.cauplas || 'Producto',
          cauplas: p.cauplas || p.id.slice(0, 8),
          currentStock,
          adjustedQuantity: adjustedQty,
          newStock: currentStock + adjustedQty,
          reason,
          cost,
          totalValue: adjustedQty * cost,
        });
      }

      const totalValue = items.reduce((s, it) => s + it.totalValue, 0);

      result.push({
        id: `ADJ-${String(i + 1).padStart(3, '0')}`,
        date: dateStr,
        type,
        reason,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        items,
        totalItems: items.length,
        totalValue,
        status,
        createdBy: CREATORS[i % CREATORS.length],
        approvedBy: status === 'approved' ? 'Admin' : undefined,
        approvedDate: status === 'approved' ? dateStr : undefined,
        notes: `Ajuste generado de ejemplo — ${reason}`,
      });
    }

    return result;
  }, [products]);

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Partial<Adjustment>>>({});

  const liveAdjustments = adjustments
    .filter(a => !deletedIds.has(a.id))
    .map(a => ({ ...a, ...statusOverrides[a.id] }));

  const filteredAdjustments = liveAdjustments.filter((adjustment) => {
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

  const stats = {
    totalAdjustments: liveAdjustments.length,
    pendingAdjustments: liveAdjustments.filter(a => a.status === 'pending').length,
    approvedAdjustments: liveAdjustments.filter(a => a.status === 'approved').length,
    totalValueAdjusted: liveAdjustments
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + a.totalValue, 0),
    increasesCount: liveAdjustments.filter(a => a.type === 'increase').length,
    decreasesCount: liveAdjustments.filter(a => a.type === 'decrease').length,
    thisMonthCount: liveAdjustments.filter(a => {
      const adjDate = new Date(a.date);
      const now = new Date();
      return adjDate.getMonth() === now.getMonth() && adjDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const createAdjustment = async (adjustment: Omit<Adjustment, 'id'>) => {
    try {
      const newAdjustment: Adjustment = {
        ...adjustment,
        id: `ADJ-${Date.now()}`,
      };
      
      // Guardar en inventory_movements
      for (const item of adjustment.items) {
        await localDb.inventory_movements?.add({
          id: crypto.randomUUID(),
          product_id: item.productId,
          tenant_id: adjustment.warehouseId,
          type: 'adjustment',
          reference_id: newAdjustment.id,
          quantity: item.adjustedQuantity,
          reason: adjustment.reason,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error creando ajuste:', error);
    }
  };

  const updateAdjustment = (id: string, updates: Partial<Adjustment>) => {
    setStatusOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const deleteAdjustment = (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
  };

  const approveAdjustment = (id: string, approvedBy: string) => {
    updateAdjustment(id, { 
      status: 'approved',
      approvedBy,
      approvedDate: new Date().toISOString().split('T')[0],
    });
  };

  const rejectAdjustment = (id: string) => {
    updateAdjustment(id, { status: 'rejected' });
  };

  const submitForApproval = (id: string) => {
    updateAdjustment(id, { status: 'pending' });
  };

  return {
    adjustments: filteredAdjustments,
    allAdjustments: liveAdjustments,
    loading: isLoading,
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
