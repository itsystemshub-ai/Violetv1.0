import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { useInventory } from '@/modules/inventory/hooks/useInventory';
import { toast } from 'sonner';

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
  tenant_id: string;
}

export const useReceipts = () => {
  const { tenant } = useSystemConfig();
  const { updateProduct } = useInventory();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const fetchReceipts = useCallback(async () => {
    if (!tenant.id || tenant.id === 'none') {
      setReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Usaremos una tabla genérica o crearemos una específica si es necesario.
      // Basado en localDb.ts, usaremos 'inventory_movements' para rastrear, 
      // pero para el listado de recepciones necesitamos una estructura.
      // Como no hay tabla 'receipts' explícita en v15, usaremos localDb syntax genérica o asumiremos que está en compras_maestro con tipo recepción
      const data = await localDb.compras_maestro
        .where('tenant_id')
        .equals(tenant.id)
        // .filter(c => c.type === 'recepcion') // Si existiera el tipo
        .toArray();
      
      // Para fines de este ERP, las recepciones se manejan como parte del flujo de compras.
      setReceipts(data as unknown as Receipt[]);
    } catch (error) {
      console.error("[useReceipts] Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

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

  const createReceipt = async (data: Omit<Receipt, 'id' | 'tenant_id'>) => {
    if (!tenant.id) return;
    const id = crypto.randomUUID();
    const newReceipt: Receipt = { ...data, id, tenant_id: tenant.id };
    
    try {
      await localDb.compras_maestro.add({
         ...newReceipt,
         created_at: new Date().toISOString()
      });
      setReceipts([newReceipt, ...receipts]);
      toast.success("Recepción registrada.");
    } catch (error) {
      console.error("[useReceipts] Error creating receipt:", error);
    }
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    try {
      await localDb.compras_maestro.update(id, updates);
      setReceipts(receipts.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (error) {
      console.error("[useReceipts] Error updating receipt:", error);
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      await localDb.compras_maestro.delete(id);
      setReceipts(receipts.filter(r => r.id !== id));
      toast.success("Recepción eliminada.");
    } catch (error) {
      console.error("[useReceipts] Error deleting receipt:", error);
    }
  };

  const completeReceipt = async (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt || !tenant.id) return;

    try {
      // Afectar stock de productos
      for (const item of receipt.items) {
        const product = await localDb.products.get(item.productId);
        if (product) {
          const newStock = (product.stock || 0) + item.receivedQuantity;
          await updateProduct(product.id, { stock: newStock });
          
          // Registrar movimiento de inventario
          await localDb.inventory_movements.add({
            id: crypto.randomUUID(),
            product_id: product.id,
            tenant_id: tenant.id,
            type: 'entrada',
            quantity: item.receivedQuantity,
            reference_id: id,
            created_at: new Date().toISOString()
          });
        }
      }

      await updateReceipt(id, { status: 'completed' });
      toast.success("Recepción completada y stock actualizado.");
    } catch (error) {
      console.error("[useReceipts] Error completing receipt:", error);
      toast.error("Error al actualizar el stock.");
    }
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
