import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/index';
import { localDb } from "@/core/database/localDb";

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  setProducts: (products: Product[]) => void;
  fetchProducts: (tenantId: string) => Promise<void>;
  initializeRealtime: (tenantId: string) => () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  products: [],
  isLoading: false,

  setProducts: (products) => set({ products }),

  fetchProducts: async (tenantId: string) => {
    if (!tenantId || tenantId === 'none' || tenantId === 'neutral') return;

    set({ isLoading: true });
    try {
      // 1. Cargar desde Respaldo Local (Instantáneo)
      const localProducts = await localDb.products
        .where('tenant_id')
        .equals(tenantId)
        .toArray();
      
      console.log(`📦 Productos cargados desde localDb: ${localProducts.length}`);
      
      set({ products: localProducts as Product[], isLoading: false });
    } catch (error) {
      console.error("Error al cargar productos:", error);
      set({ isLoading: false });
    }
  },

  initializeRealtime: (tenantId) => {
    if (!tenantId || tenantId === 'none' || tenantId === 'neutral') return () => {};

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) return () => {};

    const channel = supabase
      .channel(`products_${tenantId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `tenant_id=eq.${tenantId}` 
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const formatted: Product & { tenant_id: string } = {
              id: newRecord.id,
              name: newRecord.name,
              description: newRecord.description,
              price: Number(newRecord.price),
              cost: Number(newRecord.cost),
              stock: newRecord.stock,
              minStock: newRecord.min_stock,
              unit: newRecord.unit,
              category: newRecord.category,
              warehouseId: newRecord.warehouse_id,
              images: newRecord.image_urls || (newRecord.image_url ? [newRecord.image_url] : []),
              cauplas: newRecord.cauplas,
              torflex: newRecord.torflex,
              indomax: newRecord.indomax,
              oem: newRecord.oem,
              aplicacion: newRecord.aplicacion,
              descripcionManguera: newRecord.descripcion_manguera,
              aplicacionesDiesel: newRecord.aplicaciones_diesel,
              isNuevo: newRecord.is_nuevo,
              ventasHistory: newRecord.ventas_history,
              rankingHistory: newRecord.ranking_history,
              precioFCA: Number(newRecord.precio_fca),
              status: newRecord.status,
              tenant_id: tenantId
            };

            // Actualizar Store
            set(state => ({
              products: state.products.some(p => p.id === formatted.id)
                ? state.products.map(p => p.id === formatted.id ? formatted : p)
                : [...state.products, formatted]
            }));

            // Actualizar Respaldo Local (IndexedDB)
            await localDb.products.put(formatted);

          } else if (eventType === 'DELETE' && oldRecord) {
            set(state => ({
              products: state.products.filter(p => p.id !== oldRecord.id)
            }));
            
            // Eliminar de Respaldo Local
            await localDb.products.delete(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel?.unsubscribe();
    };
  }
}));
