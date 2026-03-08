/**
 * useReceipts - Hook para gestión de recepciones de compras (Modular)
 */

import { useState, useEffect } from 'react';

export interface ReceiptItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  unitCost: number;
  totalCost: number;
  quality: 'good' | 'damaged' | 'defective';
  notes?: string;
}

export interface Receipt {
  id: string;
  date: string;
  purchaseOrderId: string;
  supplier: string;
  supplierId: string;
  warehouse: string;
  warehouseId: string;
  items: ReceiptItem[];
  totalItems: number;
  totalValue: number;
  status: 'pending' | 'partial' | 'completed' | 'rejected';
  receivedBy: string;
  verifiedBy?: string;
  verifiedDate?: string;
  trackingNumber?: string;
  carrier?: string;
  hasDiscrepancies: boolean;
  discrepancyNotes?: string;
  notes?: string;
}

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  useEffect(() => {
    const mockReceipts: Receipt[] = [
      {
        id: 'REC-001',
        date: '2026-03-06',
        purchaseOrderId: 'PO-001',
        supplier: 'Tech Supplies Inc.',
        supplierId: 'SUP-001',
        warehouse: 'Almacén Principal',
        warehouseId: 'WH-001',
        items: [
          {
            id: 'ITEM-001',
            productId: 'PROD-001',
            productName: 'Laptop Dell Inspiron 15',
            sku: 'SKU-001',
            orderedQuantity: 10,
            receivedQuantity: 10,
            pendingQuantity: 0,
            unitCost: 12000,
            totalCost: 120000,
            quality: 'good',
          },
        ],
        totalItems: 1,
        totalValue: 120000,
        status: 'completed',
        receivedBy: 'Juan Pérez',
        verifiedBy: 'María González',
        verifiedDate: '2026-03-06',
        trackingNumber: 'TRK-2026-001',
        carrier: 'DHL Express',
        hasDiscrepancies: false,
        notes: 'Recepción completa sin problemas',
      },
      // ... (mock data truncated for brevity)
    ];

    setTimeout(() => {
      setReceipts(mockReceipts);
      setLoading(false);
    }, 500);
  }, []);

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch = 
      receipt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.purchaseOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.receivedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || receipt.supplierId === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const stats = {
    totalReceipts: receipts.length,
    pendingReceipts: receipts.filter(r => r.status === 'pending').length,
    completedReceipts: receipts.filter(r => r.status === 'completed').length,
    totalValueReceived: receipts
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.totalValue, 0),
    withDiscrepancies: receipts.filter(r => r.hasDiscrepancies).length,
    partialReceipts: receipts.filter(r => r.status === 'partial').length,
    thisMonthCount: receipts.filter(r => {
      const recDate = new Date(r.date);
      const now = new Date();
      return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const createReceipt = (receipt: Omit<Receipt, 'id'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: `REC-${String(receipts.length + 1).padStart(3, '0')}`,
    };
    setReceipts([newReceipt, ...receipts]);
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setReceipts(receipts.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ));
  };

  const deleteReceipt = (id: string) => {
    setReceipts(receipts.filter(r => r.id !== id));
  };

  const verifyReceipt = (id: string, verifiedBy: string) => {
    updateReceipt(id, { 
      verifiedBy,
      verifiedDate: new Date().toISOString().split('T')[0],
    });
  };

  const completeReceipt = (id: string) => {
    updateReceipt(id, { status: 'completed' });
  };

  const rejectReceipt = (id: string, reason: string) => {
    updateReceipt(id, { 
      status: 'rejected',
      discrepancyNotes: reason,
      hasDiscrepancies: true,
    });
  };

  const markAsPartial = (id: string) => {
    updateReceipt(id, { status: 'partial' });
  };

  return {
    receipts: filteredReceipts,
    allReceipts: receipts,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    stats,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    verifyReceipt,
    completeReceipt,
    rejectReceipt,
    markAsPartial,
  };
};
