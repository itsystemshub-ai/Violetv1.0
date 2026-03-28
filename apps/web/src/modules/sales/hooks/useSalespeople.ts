/**
 * useSalespeople - Hook para gestión de vendedores
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { toast } from 'sonner';

export interface Salesperson {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  commissionRate: number; // Porcentaje de comisión
  status: 'active' | 'inactive';
  totalSales: number;
  totalCommissions: number;
  createdAt: string;
  lastSale?: string;
  notes?: string;
}

export const useSalespeople = () => {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeTenantId } = useSystemConfig();

  const fetchSalespeople = useCallback(async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const sellers = await localDb.sellers
        .where('tenant_id')
        .equals(activeTenantId)
        .toArray();
      
      // Obtener facturas para calcular ventas reales
      const invoices = await localDb.invoices
        .where('tenant_id')
        .equals(activeTenantId)
        .toArray();

      const mappedSalespeople: Salesperson[] = sellers.map(s => {
        const sellerInvoices = invoices.filter(inv => inv.seller_id === s.id);
        const totalSales = sellerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const commissionRate = s.comision || 5;

        return {
          id: s.id,
          code: s.id.slice(0, 5).toUpperCase(),
          name: s.name || 'Sin nombre',
          email: s.email,
          phone: s.telefono,
          commissionRate: commissionRate,
          status: s.estado === 'Activo' ? 'active' : 'inactive',
          totalSales: totalSales,
          totalCommissions: (totalSales * commissionRate) / 100,
          createdAt: s.created_at || new Date().toISOString(),
          lastSale: sellerInvoices.length > 0 ? sellerInvoices.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : undefined,
          notes: s.notes
        };
      });
      
      setSalespeople(mappedSalespeople);
    } catch (error) {
      console.error('Error fetching salespeople:', error);
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchSalespeople();
  }, [fetchSalespeople]);

  const filteredSalespeople = salespeople.filter((person) => {
    const matchesSearch = 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (person.taxId && person.taxId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalSalespeople: salespeople.length,
    activeSalespeople: salespeople.filter(s => s.status === 'active').length,
    inactiveSalespeople: salespeople.filter(s => s.status === 'inactive').length,
    totalSales: salespeople.reduce((sum, s) => sum + s.totalSales, 0),
    totalCommissions: salespeople.reduce((sum, s) => sum + s.totalCommissions, 0),
    averageCommission: salespeople.length ? salespeople.reduce((sum, s) => sum + s.commissionRate, 0) / salespeople.length : 0,
  };

  const createSalesperson = async (person: Omit<Salesperson, 'id' | 'createdAt' | 'totalSales' | 'totalCommissions'>) => {
    if (!activeTenantId) return;
    
    const newId = crypto.randomUUID();
    const newSeller = {
      id: newId,
      tenant_id: activeTenantId,
      name: person.name,
      email: person.email,
      telefono: person.phone,
      comision: person.commissionRate,
      estado: person.status === 'active' ? 'Activo' : 'Inactivo',
      created_at: new Date().toISOString(),
      is_dirty: 1
    };

    try {
      await localDb.sellers.add(newSeller);
      toast.success('Vendedor creado correctamente');
      fetchSalespeople();
    } catch (error) {
      console.error('Error creating salesperson:', error);
      toast.error('Error al crear vendedor');
    }
  };

  const updateSalesperson = async (id: string, updates: Partial<Salesperson>) => {
    const sellerUpdates: any = {};
    if (updates.name) sellerUpdates.name = updates.name;
    if (updates.email) sellerUpdates.email = updates.email;
    if (updates.phone) sellerUpdates.telefono = updates.phone;
    if (updates.commissionRate !== undefined) sellerUpdates.comision = updates.commissionRate;
    if (updates.status) sellerUpdates.estado = updates.status === 'active' ? 'Activo' : 'Inactivo';
    
    sellerUpdates.is_dirty = 1;

    try {
      await localDb.sellers.update(id, sellerUpdates);
      toast.success('Vendedor actualizado');
      fetchSalespeople();
    } catch (error) {
      console.error('Error updating salesperson:', error);
      toast.error('Error al actualizar vendedor');
    }
  };

  const deleteSalesperson = async (id: string) => {
    try {
      await localDb.sellers.delete(id);
      toast.success('Vendedor eliminado');
      fetchSalespeople();
    } catch (error) {
      console.error('Error deleting salesperson:', error);
      toast.error('Error al eliminar vendedor');
    }
  };

  const activateSalesperson = (id: string) => {
    updateSalesperson(id, { status: 'active' });
  };

  const deactivateSalesperson = (id: string) => {
    updateSalesperson(id, { status: 'inactive' });
  };

  return {
    salespeople: filteredSalespeople,
    allSalespeople: salespeople,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    createSalesperson,
    updateSalesperson,
    deleteSalesperson,
    activateSalesperson,
    deactivateSalesperson,
    refresh: fetchSalespeople
  };
};
