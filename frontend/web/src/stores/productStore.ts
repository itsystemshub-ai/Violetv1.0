import { create } from 'zustand';

interface Product {
  id: string;
  codigo: string;
  nombre: string;
  precioVenta: number;
  existencia: number;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  totalProducts: number;
  
  // Actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  totalProducts: 0,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('violet_token');
      const response = await fetch('http://localhost:3000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al cargar productos');
      }

      set({
        products: data.data?.products || [],
        totalProducts: data.data?.pagination?.total || 0,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar productos';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addProduct: (product) => {
    set((state) => ({
      products: [...state.products, product],
      totalProducts: state.totalProducts + 1,
    }));
  },

  updateProduct: (id, product) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...product } : p
      ),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      totalProducts: state.totalProducts - 1,
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
