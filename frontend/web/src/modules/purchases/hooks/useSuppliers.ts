import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { SyncService } from '@/core/sync/SyncService';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  contactPerson?: string;
  paymentTerms: number; // días
  balance: number;
  status: 'active' | 'inactive' | 'suspended';
  rating: number; // 1-5
  createdAt: string;
  lastPurchase?: string;
  totalPurchases: number;
  category?: string;
  notes?: string;
  tenant_id: string;
}

export const useSuppliers = () => {
  const { tenant } = useSystemConfig();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchSuppliers = useCallback(async () => {
    if (!tenant.id || tenant.id === 'none') {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await localDb.suppliers
        .where('tenant_id')
        .equals(tenant.id)
        .toArray();
      setSuppliers(data || []);
    } catch (error) {
      console.error("[useSuppliers] Error fetching suppliers:", error);
      toast.error("Error al cargar proveedores.");
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.category && supplier.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === 'active').length,
    suspendedSuppliers: suppliers.filter(s => s.status === 'suspended').length,
    totalBalance: suppliers.reduce((sum, s) => sum + s.balance, 0),
    totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0),
    avgRating: suppliers.length > 0 
      ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)
      : "0.0",
  };

  const createSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchases' | 'tenant_id' | 'balance'>) => {
    if (!tenant.id) return;
    
    const id = crypto.randomUUID();
    const newSupplier: Supplier = {
      ...data,
      id,
      tenant_id: tenant.id,
      createdAt: new Date().toISOString(),
      totalPurchases: 0,
      balance: 0,
    };

    try {
      await SyncService.mutate('suppliers', 'INSERT', newSupplier, id);
      await localDb.suppliers.add(newSupplier);
      setSuppliers([newSupplier, ...suppliers]);
      toast.success("Proveedor creado exitosamente.");
    } catch (error) {
      console.error("[useSuppliers] Error creating supplier:", error);
      toast.error("Error al crear proveedor.");
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      await SyncService.mutate('suppliers', 'UPDATE', updates, id);
      await localDb.suppliers.update(id, updates);
      setSuppliers(suppliers.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success("Proveedor actualizado.");
    } catch (error) {
      console.error("[useSuppliers] Error updating supplier:", error);
      toast.error("Error al actualizar proveedor.");
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await SyncService.mutate('suppliers', 'DELETE', {}, id);
      await localDb.suppliers.delete(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast.success("Proveedor eliminado.");
    } catch (error) {
      console.error("[useSuppliers] Error deleting supplier:", error);
      toast.error("Error al eliminar proveedor.");
    }
  };

  const suspendSupplier = (id: string) => {
    updateSupplier(id, { status: 'suspended' });
  };

  const activateSupplier = (id: string) => {
    updateSupplier(id, { status: 'active' });
  };

  const rateSupplier = (id: string, rating: number) => {
    updateSupplier(id, { rating: Math.max(1, Math.min(5, rating)) });
  };

  const addPayment = (id: string, amount: number) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      updateSupplier(id, { balance: Math.max(0, supplier.balance - amount) });
    }
  };

  return {
    suppliers: filteredSuppliers,
    allSuppliers: suppliers,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    suspendSupplier,
    activateSupplier,
    rateSupplier,
    addPayment,
  };
};
