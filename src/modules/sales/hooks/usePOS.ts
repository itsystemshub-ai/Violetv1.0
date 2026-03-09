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
  const { products: inventoryProducts, fetchProducts, isLoading: storeLoading } = useInventoryStore();
  const { tenant } = useTenant();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxRate] = useState(0.16); // 16% IVA

  // Load real products on mount
  useEffect(() => {
    if (tenant?.id && tenant.id !== 'none' && tenant.id !== 'neutral') {
      fetchProducts(tenant.id);
    }
  }, [tenant?.id, fetchProducts]);

  // Map inventory products to POS format
  const products: Product[] = useMemo(() => {
    if (!inventoryProducts) return [];
    return inventoryProducts
      .filter(p => p.status === 'active' || p.status === 'disponible' || p.status === 'poco_stock')
      .map(p => ({
        id: p.id,
        codigo: p.cauplas || p.id.substring(0, 8),
        nombre: p.descripcionManguera || p.name || 'Sin nombre',
        precio: p.precioFCA || p.price || 0,
        stock: p.stock || 0,
        categoria: p.category || 'General',
        imagen: p.images?.[0], // Primera imagen para compatibilidad
        images: p.images || [], // Array completo de imágenes (hasta 3) para el carrusel
        // Todos los campos del inventario para búsqueda inteligente
        cauplas: p.cauplas || '',
        torflex: p.torflex || '',
        indomax: p.indomax || '',
        oem: p.oem || '',
        descripcionManguera: p.descripcionManguera || '',
        aplicacion: p.aplicacion || '',
        aplicacionesDiesel: p.aplicacionesDiesel || '',
        isNuevo: p.isNuevo || '',
        barcode: (p as any).barcode || '',
        supplier: (p as any).supplier || '',
        components: p.components || '',
      }));
  }, [inventoryProducts]);

  const loading = storeLoading || (!inventoryProducts && !!tenant?.id);

  // Búsqueda inteligente por TODAS las columnas del inventario
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase().trim();
      
      if (!query) {
        // Si no hay búsqueda, solo filtrar por categoría
        return categoryFilter === 'all' || product.categoria === categoryFilter;
      }
      
      // Búsqueda inteligente en TODOS los campos del inventario
      const matchesSearch = 
        // Campos principales
        product.nombre.toLowerCase().includes(query) ||
        product.codigo.toLowerCase().includes(query) ||
        product.categoria.toLowerCase().includes(query) ||
        // Códigos alternativos
        (product as any).cauplas?.toLowerCase().includes(query) ||
        (product as any).torflex?.toLowerCase().includes(query) ||
        (product as any).indomax?.toLowerCase().includes(query) ||
        (product as any).oem?.toLowerCase().includes(query) ||
        // Descripciones y aplicaciones
        (product as any).descripcionManguera?.toLowerCase().includes(query) ||
        (product as any).aplicacion?.toLowerCase().includes(query) ||
        (product as any).aplicacionesDiesel?.toLowerCase().includes(query) ||
        // Otros campos
        String((product as any).isNuevo || '').toLowerCase().includes(query) ||
        (product as any).barcode?.toLowerCase().includes(query) ||
        (product as any).supplier?.toLowerCase().includes(query) ||
        (product as any).components?.toLowerCase().includes(query) ||
        // Búsqueda por precio y stock (números)
        String(product.precio).includes(query) ||
        String(product.stock).includes(query);
      
      const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const categories = useMemo(() => {
    return Array.from(new Set((products || []).map(p => p.categoria)));
  }, [products]);

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
