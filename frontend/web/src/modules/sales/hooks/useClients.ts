/**
 * useClients - Hook para gestión de clientes
 */

import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/core/database/localDb';
import { useSystemConfig } from '@/modules/settings/hooks/useSystemConfig';
import { CodeGeneratorService } from '@/services/CodeGeneratorService';
import { toast } from 'sonner';

export interface Client {
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
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive' | 'blocked';
  type: 'retail' | 'wholesale' | 'vip';
  createdAt: string;
  lastPurchase?: string;
  totalPurchases: number;
  notes?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { activeTenantId } = useSystemConfig();

  const fetchClients = useCallback(async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const data = await localDb.profiles
        .where('tenant_id')
        .equals(activeTenantId)
        .toArray();
      
      const mappedClients: Client[] = data.map(p => ({
        id: p.id,
        code: p.rif || p.id.slice(0, 8), // Usar RIF como código o parte del ID
        name: p.username || p.empresa || 'Sin nombre',
        email: p.email,
        phone: p.contacto,
        address: p.direccion,
        city: p.estadoVzla || '',
        country: 'Venezuela',
        taxId: p.rif || p.cedula,
        contactPerson: p.contacto,
        creditLimit: p.credit_limit || 0,
        balance: p.balance || 0,
        status: p.estado === 'Bloqueado' ? 'blocked' : (p.estado === 'Activo' ? 'active' : 'inactive'),
        type: p.loyalty_points > 1000 ? 'vip' : 'retail', // Lógica de ejemplo para el tipo
        createdAt: p.created_at || new Date().toISOString(),
        totalPurchases: p.total_purchases || 0,
        notes: p.notes,
      }));
      
      setClients(mappedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.taxId && client.taxId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    blockedClients: clients.filter(c => c.status === 'blocked').length,
    totalBalance: clients.reduce((sum, c) => sum + c.balance, 0),
    totalSales: clients.reduce((sum, c) => sum + c.totalPurchases, 0),
    vipClients: clients.filter(c => c.type === 'vip').length,
    avgPurchase: clients.length ? Math.round(clients.reduce((sum, c) => sum + c.totalPurchases, 0) / clients.length) : 0,
  };

  const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'totalPurchases'>) => {
    if (!activeTenantId) return;
    
    const newId = crypto.randomUUID();
    const newProfile = {
      id: newId,
      tenant_id: activeTenantId,
      username: client.name,
      email: client.email,
      rif: client.taxId || client.code,
      direccion: client.address,
      contacto: client.phone,
      estadoVzla: client.city,
      estado: client.status === 'active' ? 'Activo' : (client.status === 'blocked' ? 'Bloqueado' : 'Inactivo'),
      credit_limit: client.creditLimit,
      balance: client.balance,
      created_at: new Date().toISOString(),
      is_dirty: 1
    };

    try {
      await localDb.profiles.add(newProfile);
      toast.success('Cliente creado correctamente');
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error al crear cliente');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const profileUpdates: any = {};
    if (updates.name) profileUpdates.username = updates.name;
    if (updates.email) profileUpdates.email = updates.email;
    if (updates.taxId) profileUpdates.rif = updates.taxId;
    if (updates.address) profileUpdates.direccion = updates.address;
    if (updates.phone) profileUpdates.contacto = updates.phone;
    if (updates.city) profileUpdates.estadoVzla = updates.city;
    if (updates.status) profileUpdates.estado = updates.status === 'active' ? 'Activo' : (updates.status === 'blocked' ? 'Bloqueado' : 'Inactivo');
    if (updates.creditLimit !== undefined) profileUpdates.credit_limit = updates.creditLimit;
    if (updates.balance !== undefined) profileUpdates.balance = updates.balance;
    
    profileUpdates.is_dirty = 1;

    try {
      await localDb.profiles.update(id, profileUpdates);
      toast.success('Cliente actualizado');
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Error al actualizar cliente');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await localDb.profiles.delete(id);
      toast.success('Cliente eliminado');
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar cliente');
    }
  };

  const blockClient = (id: string) => {
    updateClient(id, { status: 'blocked' });
  };

  const unblockClient = (id: string) => {
    updateClient(id, { status: 'active' });
  };

  const addPayment = async (id: string, amount: number) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      await updateClient(id, { balance: Math.max(0, client.balance - amount) });
    }
  };

  return {
    clients: filteredClients,
    allClients: clients,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    stats,
    createClient,
    updateClient,
    deleteClient,
    blockClient,
    unblockClient,
    addPayment,
    refresh: fetchClients
  };
};
