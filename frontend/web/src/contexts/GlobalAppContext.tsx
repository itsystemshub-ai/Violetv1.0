/**
 * GlobalAppContext - Contexto Global de la Aplicación
 * Gestiona el estado integrado de todos los módulos: Inventario, Ventas, Compras, Finanzas, CRM
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/shared/components/ui/use-toast';

// ==================== TIPOS ====================

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  proveedor?: string;
  imagen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  fecha: string;
  hora: string;
  cliente?: string;
  clienteId?: string;
  vendedor: string;
  items: SaleItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  moneda: 'USD' | 'VES'; // Moneda de la factura
  tasaCambio?: number; // Tasa de cambio usada si es en VES
  totalUSD?: number; // Total en USD (si factura es en VES)
  totalVES?: number; // Total en VES (si factura es en USD)
  estado: 'completada' | 'pendiente' | 'cancelada';
  notas?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  descuento: number;
}

export interface Purchase {
  id: string;
  fecha: string;
  proveedor: string;
  proveedorId?: string;
  items: PurchaseItem[];
  subtotal: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  estado: 'recibida' | 'pendiente' | 'cancelada';
  notas?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  costo: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'egreso';
  categoria: 'venta' | 'compra' | 'gasto' | 'pago' | 'cobro' | 'otro';
  monto: number;
  descripcion: string;
  referencia?: string; // ID de venta, compra, etc.
  metodoPago: string;
  estado: 'completada' | 'pendiente' | 'cancelada';
  createdAt: string;
}

export interface Debt {
  id: string;
  tipo: 'por_cobrar' | 'por_pagar';
  entidad: string; // Cliente o Proveedor
  entidadId?: string;
  monto: number;
  montoPagado: number;
  montoRestante: number;
  referencia?: string; // ID de venta o compra
  fechaVencimiento?: string;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'vencida';
  notas?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo: 'cliente' | 'lead' | 'prospecto';
  totalCompras: number;
  deudaTotal: number;
  ultimaCompra?: string;
  notas?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  totalCompras: number;
  deudaTotal: number;
  ultimaCompra?: string;
  notas?: string;
  createdAt: string;
}

// ==================== CONTEXTO ====================

interface GlobalAppState {
  // Datos
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  transactions: Transaction[];
  debts: Debt[];
  customers: Customer[];
  suppliers: Supplier[];
  
  // Métodos de Productos
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  updateStock: (productId: string, cantidad: number, tipo: 'suma' | 'resta') => void;
  
  // Métodos de Ventas
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Sale;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  cancelSale: (id: string) => void;
  
  // Métodos de Compras
  createPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => Purchase;
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  cancelPurchase: (id: string) => void;
  
  // Métodos de Transacciones
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  
  // Métodos de Deudas
  createDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => Debt;
  payDebt: (debtId: string, monto: number) => void;
  
  // Métodos de Clientes
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalCompras' | 'deudaTotal'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  // Métodos de Proveedores
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalCompras' | 'deudaTotal'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  
  // Utilidades
  refreshData: () => void;
  clearAllData: () => void;
}

const GlobalAppContext = createContext<GlobalAppState | undefined>(undefined);

// ==================== PROVIDER ====================

const STORAGE_KEYS = {
  PRODUCTS: 'violet_products',
  SALES: 'violet_sales',
  PURCHASES: 'violet_purchases',
  TRANSACTIONS: 'violet_transactions',
  DEBTS: 'violet_debts',
  CUSTOMERS: 'violet_customers',
  SUPPLIERS: 'violet_suppliers',
};

export const GlobalAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const loadData = () => {
      try {
        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
        const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);

        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedSales) setSales(JSON.parse(storedSales));
        if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedDebts) setDebts(JSON.parse(storedDebts));
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  // ==================== MÉTODOS DE TRANSACCIONES ====================

  const createTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `TRANS-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  }, []);

  // ==================== MÉTODOS DE DEUDAS ====================

  const createDebt = useCallback((debtData: Omit<Debt, 'id' | 'createdAt'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: `DEBT-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setDebts(prev => [...prev, newDebt]);
    return newDebt;
  }, []);

  const payDebt = useCallback((debtId: string, monto: number) => {
    setDebts(prev => prev.map(d => {
      if (d.id === debtId) {
        const nuevoMontoPagado = d.montoPagado + monto;
        const nuevoMontoRestante = d.monto - nuevoMontoPagado;
        const nuevoEstado = nuevoMontoRestante <= 0 ? 'pagada' : 'parcial';
        
        return {
          ...d,
          montoPagado: nuevoMontoPagado,
          montoRestante: Math.max(0, nuevoMontoRestante),
          estado: nuevoEstado,
        };
      }
      return d;
    }));
    
    toast({
      title: "✅ Pago Registrado",
      description: `Se registró un pago de ${monto.toFixed(2)}`,
      duration: 3000,
    });
  }, []);

  // ==================== MÉTODOS DE PRODUCTOS ====================

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `PROD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
    
    toast({
      title: "✅ Producto Agregado",
      description: `${newProduct.nombre} se agregó al inventario`,
      duration: 3000,
    });
    
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
    
    toast({
      title: "✅ Producto Actualizado",
      description: "Los cambios se guardaron correctamente",
      duration: 3000,
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    
    toast({
      title: "🗑️ Producto Eliminado",
      description: "El producto se eliminó del inventario",
      duration: 3000,
    });
  }, []);

  const getProduct = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const updateStock = useCallback((productId: string, cantidad: number, tipo: 'suma' | 'resta') => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nuevoStock = tipo === 'suma' ? p.stock + cantidad : p.stock - cantidad;
        return { ...p, stock: Math.max(0, nuevoStock), updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  }, []);

  // ==================== MÉTODOS DE VENTAS ====================

  const createSale = useCallback((saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: `SALE-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setSales(prev => [...prev, newSale]);
    
    // Actualizar stock de productos
    saleData.items.forEach(item => {
      updateStock(item.productoId, item.cantidad, 'resta');
    });
    
    // Crear transacción de ingreso
    createTransaction({
      fecha: saleData.fecha,
      tipo: 'ingreso',
      categoria: 'venta',
      monto: saleData.total,
      descripcion: `Venta ${newSale.id}${saleData.moneda === 'VES' ? ' (Bs)' : ' (USD)'}`,
      referencia: newSale.id,
      metodoPago: saleData.metodoPago,
      estado: 'completada',
    });
    
    // Si hay cliente, actualizar sus datos
    if (saleData.clienteId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === saleData.clienteId) {
          // Siempre guardar en USD para consistencia
          const totalUSD = saleData.moneda === 'USD' ? saleData.total : (saleData.totalUSD || saleData.total);
          return {
            ...c,
            totalCompras: c.totalCompras + totalUSD,
            ultimaCompra: saleData.fecha,
          };
        }
        return c;
      }));
    }
    
    const monedaTexto = saleData.moneda === 'USD' ? 'USD' : 'Bs';
    toast({
      title: "✅ Venta Registrada",
      description: `Venta ${newSale.id} por ${saleData.total.toFixed(2)} ${monedaTexto} completada`,
      duration: 3000,
    });
    
    return newSale;
  }, [updateStock, createTransaction]);

  const updateSale = useCallback((id: string, updates: Partial<Sale>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const cancelSale = useCallback((id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    
    // Devolver stock
    sale.items.forEach(item => {
      updateStock(item.productoId, item.cantidad, 'suma');
    });
    
    // Actualizar estado
    updateSale(id, { estado: 'cancelada' });
    
    toast({
      title: "❌ Venta Cancelada",
      description: `Venta ${id} cancelada y stock restaurado`,
      duration: 3000,
    });
  }, [sales, updateStock, updateSale]);

  // ==================== MÉTODOS DE COMPRAS ====================

  const createPurchase = useCallback((purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `PURCH-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setPurchases(prev => [...prev, newPurchase]);
    
    // Actualizar stock de productos (sumar)
    purchaseData.items.forEach(item => {
      updateStock(item.productoId, item.cantidad, 'suma');
    });
    
    // Crear transacción de egreso
    createTransaction({
      fecha: purchaseData.fecha,
      tipo: 'egreso',
      categoria: 'compra',
      monto: purchaseData.total,
      descripcion: `Compra ${newPurchase.id} - ${purchaseData.proveedor}`,
      referencia: newPurchase.id,
      metodoPago: purchaseData.metodoPago,
      estado: 'completada',
    });
    
    // Crear deuda por pagar si no se pagó completo
    if (purchaseData.estado === 'pendiente') {
      createDebt({
        tipo: 'por_pagar',
        entidad: purchaseData.proveedor,
        entidadId: purchaseData.proveedorId,
        monto: purchaseData.total,
        montoPagado: 0,
        montoRestante: purchaseData.total,
        referencia: newPurchase.id,
        estado: 'pendiente',
      });
    }
    
    // Actualizar proveedor
    if (purchaseData.proveedorId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchaseData.proveedorId) {
          return {
            ...s,
            totalCompras: s.totalCompras + purchaseData.total,
            deudaTotal: purchaseData.estado === 'pendiente' ? s.deudaTotal + purchaseData.total : s.deudaTotal,
            ultimaCompra: purchaseData.fecha,
          };
        }
        return s;
      }));
    }
    
    toast({
      title: "✅ Compra Registrada",
      description: `Compra ${newPurchase.id} por ${purchaseData.total.toFixed(2)} completada`,
      duration: 3000,
    });
    
    return newPurchase;
  }, [updateStock, createTransaction, createDebt]);

  const updatePurchase = useCallback((id: string, updates: Partial<Purchase>) => {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const cancelPurchase = useCallback((id: string) => {
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;
    
    // Devolver stock
    purchase.items.forEach(item => {
      updateStock(item.productoId, item.cantidad, 'resta');
    });
    
    // Actualizar estado
    updatePurchase(id, { estado: 'cancelada' });
    
    toast({
      title: "❌ Compra Cancelada",
      description: `Compra ${id} cancelada y stock ajustado`,
      duration: 3000,
    });
  }, [purchases, updateStock, updatePurchase]);

  // ==================== MÉTODOS DE CLIENTES ====================

  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'createdAt' | 'totalCompras' | 'deudaTotal'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${Date.now()}`,
      totalCompras: 0,
      deudaTotal: 0,
      createdAt: new Date().toISOString(),
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    
    toast({
      title: "✅ Cliente Agregado",
      description: `${newCustomer.nombre} se agregó al sistema`,
      duration: 3000,
    });
    
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // ==================== MÉTODOS DE PROVEEDORES ====================

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'createdAt' | 'totalCompras' | 'deudaTotal'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `SUPP-${Date.now()}`,
      totalCompras: 0,
      deudaTotal: 0,
      createdAt: new Date().toISOString(),
    };
    
    setSuppliers(prev => [...prev, newSupplier]);
    
    toast({
      title: "✅ Proveedor Agregado",
      description: `${newSupplier.nombre} se agregó al sistema`,
      duration: 3000,
    });
    
    return newSupplier;
  }, []);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // ==================== UTILIDADES ====================

  const refreshData = useCallback(() => {
    // Recargar datos desde localStorage
    const loadData = () => {
      try {
        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
        const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);

        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedSales) setSales(JSON.parse(storedSales));
        if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedDebts) setDebts(JSON.parse(storedDebts));
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
      } catch (error) {
        console.error('Error recargando datos:', error);
      }
    };

    loadData();
    
    toast({
      title: "🔄 Datos Actualizados",
      description: "Los datos se recargaron correctamente",
      duration: 2000,
    });
  }, []);

  const clearAllData = useCallback(() => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      setProducts([]);
      setSales([]);
      setPurchases([]);
      setTransactions([]);
      setDebts([]);
      setCustomers([]);
      setSuppliers([]);
      
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({
        title: "🗑️ Datos Eliminados",
        description: "Todos los datos se eliminaron correctamente",
        duration: 3000,
      });
    }
  }, []);

  const value: GlobalAppState = {
    // Datos
    products,
    sales,
    purchases,
    transactions,
    debts,
    customers,
    suppliers,
    
    // Métodos
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    updateStock,
    createSale,
    updateSale,
    cancelSale,
    createPurchase,
    updatePurchase,
    cancelPurchase,
    createTransaction,
    createDebt,
    payDebt,
    addCustomer,
    updateCustomer,
    addSupplier,
    updateSupplier,
    refreshData,
    clearAllData,
  };

  return (
    <GlobalAppContext.Provider value={value}>
      {children}
    </GlobalAppContext.Provider>
  );
};

// ==================== HOOK ====================

export const useGlobalApp = () => {
  const context = useContext(GlobalAppContext);
  if (context === undefined) {
    throw new Error('useGlobalApp debe usarse dentro de GlobalAppProvider');
  }
  return context;
};
