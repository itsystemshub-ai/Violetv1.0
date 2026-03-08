/**
 * useSuppliers - Hook para gestión de proveedores (Modular)
 */

import { useState, useEffect } from 'react';

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
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mockSuppliers: Supplier[] = [
      {
        id: 'SUP-001',
        code: 'S001',
        name: 'Dell Inc.',
        email: 'ventas@dell.com.mx',
        phone: '+52 55 5000 0000',
        address: 'Corporativo Dell',
        city: 'Ciudad de México',
        country: 'México',
        taxId: 'DEL123456789',
        contactPerson: 'Roberto Martínez',
        paymentTerms: 30,
        balance: 120000,
        status: 'active',
        rating: 5,
        createdAt: '2024-01-10',
        lastPurchase: '2026-03-05',
        totalPurchases: 850000,
        category: 'Electrónica',
        notes: 'Proveedor principal de laptops',
      },
      {
        id: 'SUP-002',
        code: 'S002',
        name: 'Logitech',
        email: 'b2b@logitech.com',
        phone: '+52 33 4000 0000',
        address: 'Oficinas Logitech',
        city: 'Guadalajara',
        country: 'México',
        taxId: 'LOG987654321',
        contactPerson: 'Ana López',
        paymentTerms: 15,
        balance: 35000,
        status: 'active',
        rating: 4,
        createdAt: '2024-02-15',
        lastPurchase: '2026-03-04',
        totalPurchases: 250000,
        category: 'Accesorios',
      },
      {
        id: 'SUP-003',
        code: 'S003',
        name: 'Samsung Electronics',
        email: 'corporate@samsung.com.mx',
        phone: '+52 81 8000 0000',
        address: 'Samsung Plaza',
        city: 'Monterrey',
        country: 'México',
        taxId: 'SAM456789123',
        contactPerson: 'Luis Hernández',
        paymentTerms: 45,
        balance: 180000,
        status: 'active',
        rating: 5,
        createdAt: '2023-11-20',
        lastPurchase: '2026-03-06',
        totalPurchases: 1200000,
        category: 'Electrónica',
        notes: 'Proveedor de monitores y pantallas',
      },
    ];

    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setLoading(false);
    }, 500);
  }, []);

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

  const createSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchases'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalPurchases: 0,
    };
    setSuppliers([newSupplier, ...suppliers]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(suppliers.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
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
