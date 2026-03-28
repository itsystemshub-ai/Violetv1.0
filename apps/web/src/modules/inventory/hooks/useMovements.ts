/**
 * useMovements - Hook para gestión de movimientos de inventario
 */

import { useState, useEffect, useMemo } from 'react';

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
}

export const useMovements = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    const mockMovements: InventoryMovement[] = [
      {
        id: 'MOV-001',
        date: '2026-03-08',
        type: 'entry',
        productId: 'PROD-3200',
        productName: 'Manguera Radiador Superior',
        cauplas: '3200',
        quantity: 50,
        unitCost: 12,
        totalValue: 600,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        reason: 'Compra a proveedor',
        reference: 'PO-001',
        createdBy: 'Juan Pérez',
        notes: 'Recepción lote Manguera Radiador',
      },
      {
        id: 'MOV-002',
        date: '2026-03-08',
        type: 'exit',
        productId: 'PROD-4500',
        productName: 'Manguera de Calefacción',
        cauplas: '4500',
        quantity: -15,
        unitCost: 8,
        totalValue: -120,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        reason: 'Venta a cliente',
        reference: 'INV-001',
        createdBy: 'María González',
        notes: 'Salida por venta factura INV-001',
      },
      {
        id: 'MOV-003',
        date: '2026-03-07',
        type: 'transfer',
        productId: 'PROD-TR100',
        productName: 'Tubo de Refrigeración',
        cauplas: 'TR-100',
        quantity: 20,
        unitCost: 15,
        totalValue: 300,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        destinationWarehouse: 'Almacén Secundario',
        destinationWarehouseId: 'WH-002',
        reason: 'Transferencia entre almacenes',
        reference: 'TRF-001',
        createdBy: 'Carlos Rodríguez',
        notes: 'Reubicación de inventario para sucursal B',
      },
      {
        id: 'MOV-004',
        date: '2026-03-07',
        type: 'adjustment',
        productId: 'PROD-IM200',
        productName: 'Codo de Silicona Reductor',
        cauplas: 'IM-200',
        quantity: -2,
        unitCost: 20,
        totalValue: -40,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        reason: 'Productos defectuosos',
        reference: 'ADJ-001',
        createdBy: 'Ana López',
        notes: 'Mermas por daño de material',
      },
      {
        id: 'MOV-005',
        date: '2026-03-06',
        type: 'entry',
        productId: 'PROD-8900',
        productName: 'Manguera Filtro Aire',
        cauplas: '8900',
        quantity: 100,
        unitCost: 22,
        totalValue: 2200,
        warehouse: 'Almacén Secundario',
        warehouseId: 'WH-002',
        reason: 'Compra a proveedor',
        reference: 'PO-002',
        createdBy: 'Luis Hernández',
      },
      {
        id: 'MOV-006',
        date: '2026-03-06',
        type: 'exit',
        productId: 'PROD-3200',
        productName: 'Manguera Radiador Superior',
        cauplas: '3200',
        quantity: -5,
        unitCost: 12,
        totalValue: -60,
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        reason: 'Venta a cliente',
        reference: 'INV-002',
        createdBy: 'Patricia Sánchez',
      },
    ];

    setTimeout(() => {
      setMovements(mockMovements);
      setLoading(false);
    }, 500);
  }, []);

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cauplas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }

    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(m => m.warehouseId === warehouseFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
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

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, searchQuery, typeFilter, warehouseFilter, dateFilter]);

  const stats = useMemo(() => {
    const totalEntries = movements
      .filter(m => m.type === 'entry')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalExits = movements
      .filter(m => m.type === 'exit')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    const totalTransfers = movements
      .filter(m => m.type === 'transfer')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalAdjustments = movements
      .filter(m => m.type === 'adjustment')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

    const totalValueIn = movements
      .filter(m => m.type === 'entry')
      .reduce((sum, m) => sum + m.totalValue, 0);
    
    const totalValueOut = movements
      .filter(m => m.type === 'exit')
      .reduce((sum, m) => sum + Math.abs(m.totalValue), 0);

    const thisMonthCount = movements.filter(m => {
      const movDate = new Date(m.date);
      const now = new Date();
      return movDate.getMonth() === now.getMonth() && 
             movDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      totalMovements: movements.length,
      totalEntries,
      totalExits,
      totalTransfers,
      totalAdjustments,
      totalValueIn,
      totalValueOut,
      netValue: totalValueIn - totalValueOut,
      thisMonthCount,
    };
  }, [movements]);

  const createMovement = (movement: Omit<InventoryMovement, 'id'>) => {
    const newMovement: InventoryMovement = {
      ...movement,
      id: `MOV-${String(movements.length + 1).padStart(3, '0')}`,
    };
    setMovements([newMovement, ...movements]);
  };

  const updateMovement = (id: string, updates: Partial<InventoryMovement>) => {
    setMovements(movements.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const deleteMovement = (id: string) => {
    setMovements(movements.filter(m => m.id !== id));
  };

  const getProductMovements = (productId: string) => {
    return movements.filter(m => m.productId === productId);
  };

  const getWarehouseMovements = (warehouseId: string) => {
    return movements.filter(m => m.warehouseId === warehouseId);
  };

  const getMovementsByType = (type: string) => {
    return movements.filter(m => m.type === type);
  };

  const getMovementsByDateRange = (startDate: string, endDate: string) => {
    return movements.filter(m => {
      const movDate = new Date(m.date);
      return movDate >= new Date(startDate) && movDate <= new Date(endDate);
    });
  };

  return {
    movements: filteredMovements,
    allMovements: movements,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    warehouseFilter,
    setWarehouseFilter,
    dateFilter,
    setDateFilter,
    stats,
    createMovement,
    updateMovement,
    deleteMovement,
    getProductMovements,
    getWarehouseMovements,
    getMovementsByType,
    getMovementsByDateRange,
  };
};
