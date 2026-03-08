import { useState, useEffect, useMemo } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useInventoryStore } from '@/modules/inventory/hooks/useInventoryStore';
import { useTenant } from '@/shared/hooks/useTenant';

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  descuento?: number;
  imagen?: string;
}

export interface CartItem extends Product {
  cantidad: number;
  subtotal: number;
  descuentoAplicado: number;
}

export interface Sale {
  id: string;
  fecha: string;
  hora: string;
  items: CartItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  cliente?: string;
  vendedor: string;
}

export const usePOS = () => {
  const { rates, getRateForPaymentMethod } = useExchangeRates();
  const { products: inventoryProducts, fetchProducts } = useInventoryStore();
  const { tenant } = useTenant();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxRate] = useState(0.16); // 16% IVA

  // Load real products on mount
  useEffect(() => {
    if (tenant?.id) {
      fetchProducts(tenant.id);
    }
  }, [tenant?.id, fetchProducts]);

  // Map inventory products to POS format
  const products: Product[] = useMemo(() => {
    return inventoryProducts
      .filter(p => p.status === 'active' || p.status === 'disponible' || p.status === 'poco_stock')
      .map(p => ({
        id: p.id,
        codigo: p.cauplas || p.id.substring(0, 8),
        nombre: p.descripcionManguera || p.name || 'Sin nombre',
        precio: p.precioFCA || p.price || 0,
        stock: p.stock || 0,
        categoria: p.category || 'General',
        imagen: p.images?.[0],
      }));
  }, [inventoryProducts]);

  const loading = (inventoryProducts?.length || 0) === 0 && !!tenant?.id;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set((products || []).map(p => p.categoria)));

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, 1);
    } else {
      const newItem: CartItem = {
        ...product,
        cantidad: 1,
        subtotal: product.precio,
        descuentoAplicado: 0,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newCantidad = Math.max(0, Math.min(item.stock, item.cantidad + delta));
            const descuento = (item.precio * newCantidad * discountPercentage) / 100;
            return {
              ...item,
              cantidad: newCantidad,
              subtotal: item.precio * newCantidad,
              descuentoAplicado: descuento,
            };
          }
          return item;
        })
        .filter((item) => item.cantidad > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercentage(0);
  };

  const applyDiscount = (percentage: number) => {
    setDiscountPercentage(Math.max(0, Math.min(100, percentage)));
    setCart(cart.map(item => {
      const descuento = (item.precio * item.cantidad * percentage) / 100;
      return {
        ...item,
        descuentoAplicado: descuento,
      };
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalDiscount = cart.reduce((acc, item) => acc + item.descuentoAplicado, 0);
  const subtotalAfterDiscount = subtotal - totalDiscount;
  
  // IVA solo se aplica si el método de pago es en Bolívares (transferencia-bs)
  const shouldApplyTax = paymentMethod === 'transferencia-bs' || paymentMethod === 'efectivo';
  const tax = shouldApplyTax ? subtotalAfterDiscount * taxRate : 0;
  const total = subtotalAfterDiscount + tax;
  const itemCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  
  // Obtener tasa de cambio según método de pago
  const exchangeRate = getRateForPaymentMethod(paymentMethod);

  const processSale = (vendedor: string = 'Usuario Actual', cliente?: string): Sale => {
    const now = new Date();
    const sale: Sale = {
      id: `SALE-${Date.now()}`,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
      items: [...cart],
      subtotal,
      descuento: totalDiscount,
      impuesto: tax,
      total,
      metodoPago: paymentMethod,
      cliente,
      vendedor,
    };

    // TODO: Actualizar stock a través de localDb/SyncEngine
    // Por ahora el stock se actualizará cuando se recarguen los productos
    // En producción, aquí se haría: inventoryProducts.forEach -> localDb.products.update

    clearCart();
    return sale;
  };

  const getQuickAccessProducts = () => {
    return products
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 6);
  };

  const getLowStockProducts = () => {
    return (products || []).filter(p => p.stock < 10);
  };

  return {
    products: filteredProducts,
    allProducts: products,
    cart,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categories,
    paymentMethod,
    setPaymentMethod,
    loading,
    discountPercentage,
    subtotal,
    totalDiscount,
    tax,
    total,
    itemCount,
    taxRate,
    exchangeRate,
    rates, // Exportar todas las tasas
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyDiscount,
    processSale,
    getQuickAccessProducts,
    getLowStockProducts,
  };
};
