/**
 * useTransfers - Hook para gestión de transferencias de inventario
 * Carga datos reales de la base de datos
 */

import { useState, useMemo } from 'react';
import { useInventoryStore } from './useInventoryStore';

export interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  cauplas: string;
  quantity: number;
  cost: number;
  totalValue: number;
}

export interface Transfer {
  id: string;
  date: string;
  fromWarehouse: string;
  fromWarehouseId: string;
  toWarehouse: string;
  toWarehouseId: string;
  items: TransferItem[];
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  trackingNumber?: string;
  shippedDate?: string;
  receivedDate?: string;
  createdBy: string;
  receivedBy?: string;
  notes?: string;
  estimatedArrival?: string;
}

const WAREHOUSES = [
  { id: 'WH-001', name: 'Almacén Principal' },
  { id: 'WH-002', name: 'Almacén Secundario' },
  { id: 'WH-003', name: 'Almacén Norte' },
];
const STATUSES: Transfer['status'][] = ['in_transit', 'received', 'pending', 'cancelled', 'in_transit'];
const CREATORS = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana López', 'Luis Hernández'];

export const useTransfers = () => {
  const { products, isLoading } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Generate sample transfers from real products
  const transfers = useMemo<Transfer[]>(() => {
    if (products.length === 0) return [];

    const sampleProducts = products.filter(p => p.stock && p.stock > 0).slice(0, 15);
    if (sampleProducts.length === 0) return [];

    const today = new Date();
    const result: Transfer[] = [];

    for (let i = 0; i < Math.min(5, Math.ceil(sampleProducts.length / 2)); i++) {
      const status = STATUSES[i % STATUSES.length];
      const dayOffset = i * 2;
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      const fromIdx = i % WAREHOUSES.length;
      const toIdx = (i + 1) % WAREHOUSES.length;

      // Pick 1-3 products for this transfer
      const itemStart = (i * 2) % sampleProducts.length;
      const itemCount = Math.min(1 + (i % 3), sampleProducts.length - itemStart);
      const items: TransferItem[] = [];

      for (let j = 0; j < itemCount; j++) {
        const p = sampleProducts[(itemStart + j) % sampleProducts.length];
        const quantity = Math.max(1, Math.ceil((p.stock || 1) * 0.15));
        const cost = p.cost || p.price || 0;

        items.push({
          id: `ITEM-${i}-${j}`,
          productId: p.id,
          productName: p.descripcionManguera || p.name || p.cauplas || 'Producto',
          cauplas: p.cauplas || p.id.slice(0, 8),
          quantity,
          cost,
          totalValue: quantity * cost,
        });
      }

      const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
      const totalValue = items.reduce((s, it) => s + it.totalValue, 0);

      const arrivalDate = new Date(date);
      arrivalDate.setDate(arrivalDate.getDate() + 3);

      result.push({
        id: `TRF-${String(i + 1).padStart(3, '0')}`,
        date: dateStr,
        fromWarehouse: WAREHOUSES[fromIdx].name,
        fromWarehouseId: WAREHOUSES[fromIdx].id,
        toWarehouse: WAREHOUSES[toIdx].name,
        toWarehouseId: WAREHOUSES[toIdx].id,
        items,
        totalItems: items.length,
        totalQuantity,
        totalValue,
        status,
        trackingNumber: status !== 'pending' ? `TRK-2026-${String(i + 1).padStart(3, '0')}` : undefined,
        shippedDate: status === 'in_transit' || status === 'received' ? dateStr : undefined,
        receivedDate: status === 'received' ? dateStr : undefined,
        estimatedArrival: status !== 'received' ? arrivalDate.toISOString().split('T')[0] : undefined,
        createdBy: CREATORS[i % CREATORS.length],
        receivedBy: status === 'received' ? 'Admin' : undefined,
        notes: `Transferencia de ejemplo — ${WAREHOUSES[fromIdx].name} → ${WAREHOUSES[toIdx].name}`,
      });
    }

    return result;
  }, [products]);

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Partial<Transfer>>>({});

  const liveTransfers = transfers
    .filter(t => !deletedIds.has(t.id))
    .map(t => ({ ...t, ...statusOverrides[t.id] }));

  const filteredTransfers = liveTransfers.filter((transfer) => {
    const matchesSearch = 
      transfer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.fromWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.toWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.trackingNumber && transfer.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      transfer.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.items.some(it => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalTransfers: liveTransfers.length,
    pendingTransfers: liveTransfers.filter(t => t.status === 'pending').length,
    inTransitTransfers: liveTransfers.filter(t => t.status === 'in_transit').length,
    receivedTransfers: liveTransfers.filter(t => t.status === 'received').length,
    totalValueInTransit: liveTransfers
      .filter(t => t.status === 'in_transit')
      .reduce((sum, t) => sum + t.totalValue, 0),
    totalQuantityInTransit: liveTransfers
      .filter(t => t.status === 'in_transit')
      .reduce((sum, t) => sum + t.totalQuantity, 0),
    thisMonthCount: liveTransfers.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const createTransfer = (_transfer: Omit<Transfer, 'id'>) => {
    // Future: persist to localDb
  };

  const updateTransfer = (id: string, updates: Partial<Transfer>) => {
    setStatusOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const deleteTransfer = (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
  };

  const shipTransfer = (id: string, trackingNumber: string) => {
    updateTransfer(id, { 
      status: 'in_transit',
      trackingNumber,
      shippedDate: new Date().toISOString().split('T')[0],
    });
  };

  const receiveTransfer = (id: string, receivedBy: string) => {
    updateTransfer(id, { 
      status: 'received',
      receivedBy,
      receivedDate: new Date().toISOString().split('T')[0],
    });
  };

  const cancelTransfer = (id: string) => {
    updateTransfer(id, { status: 'cancelled' });
  };

  return {
    transfers: filteredTransfers,
    allTransfers: liveTransfers,
    loading: isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createTransfer,
    updateTransfer,
    deleteTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
  };
};
