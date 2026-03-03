import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Invoice } from '@/lib/index';
import { localDb } from '@/lib/localDb';
import { NetworkService } from '@/services/LocalNetworkService';

interface SalesState {
  invoices: Invoice[];
  isLoading: boolean;
  fetchInvoices: (tenantId: string) => Promise<void>;
  initializeRealtime: (tenantId: string) => () => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  invoices: [],
  isLoading: false,

  fetchInvoices: async (tenantId) => {
    if (!tenantId || tenantId === 'none') {
      set({ invoices: [] });
      return;
    }

    // 1. Cargar desde Respaldo Local (Instantáneo)
    const localInvoices = await localDb.invoices
      .where('tenant_id')
      .equals(tenantId)
      .toArray();
    
    if (localInvoices.length > 0) {
      set({ invoices: localInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
    }
    
    set({ isLoading: true });
    try {
      let mappedInvoices: Invoice[] = [];
      let fetchSuccess = false;

      // 2. Intentar Master Server primero (Fuente de verdad local principal)
      if (navigator.onLine) {
        try {
           const msResponse = await fetch(`${NetworkService.getServerUrl()}/api/transactions/invoices/${tenantId}`);
           if (msResponse.ok) {
             const msData = await msResponse.json();
             if (msData.success) {
               mappedInvoices = msData.data;
               fetchSuccess = true;
             }
           }
        } catch (err) {
           console.warn("[useSalesStore] No se pudo conectar al Master Server:", err);
        }
      }

      // Fallback a Supabase si el Master Server no responde (o está deshabilitado temporalmente)
      if (!fetchSuccess) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('date', { ascending: false });

        if (error) throw error;
        
        mappedInvoices = data?.map(db => ({
          id: db.id,
          number: db.number,
          customerName: db.customer_name,
          customerRif: db.customer_rif,
          date: db.date,
          subtotal: Number(db.subtotal),
          taxTotal: Number(db.tax_iva) + Number(db.tax_igtf),
          total: Number(db.total),
          status: db.status,
          type: db.type,
          items: db.items || [],
          metadata: db.metadata || {},
          tenant_id: tenantId
        })) || [];
      }

      // MERGE: Keep local invoices that are not in Supabase yet
      // This prevents UI flickering or disappearing items when creating orders locally
      const localOnlyInvoices = localInvoices.filter(local => !mappedInvoices.some(mapped => mapped.id === local.id));
      const finalInvoices = [...mappedInvoices, ...localOnlyInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({ invoices: finalInvoices });

      // 2. Actualizar Respaldo Local (Solo insertamos los mapeados, no borramos los locales)
      await localDb.invoices.bulkPut(mappedInvoices);

    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  initializeRealtime: (tenantId) => {
    if (!tenantId || tenantId === 'none') return () => {};

    const channel = supabase
      .channel(`invoices_${tenantId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'invoices',
          filter: `tenant_id=eq.${tenantId}` 
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const formatted: Invoice = {
                id: newRecord.id,
                number: newRecord.number,
                customerName: newRecord.customer_name,
                customerRif: newRecord.customer_rif,
                date: newRecord.date,
                subtotal: Number(newRecord.subtotal),
                taxTotal: Number(newRecord.tax_iva) + Number(newRecord.tax_igtf),
                total: Number(newRecord.total),
                status: newRecord.status,
                type: newRecord.type,
                items: newRecord.items || [],
                metadata: newRecord.metadata || {},
                tenant_id: tenantId
            };

            set(state => ({
              invoices: state.invoices.some(i => i.id === formatted.id)
                ? state.invoices.map(i => i.id === formatted.id ? formatted : i)
                : [formatted, ...state.invoices]
            }));

            // Actualizar Respaldo Local
            await localDb.invoices.put(formatted);

          } else if (eventType === 'DELETE' && oldRecord) {
            set(state => ({
              invoices: state.invoices.filter(i => i.id !== oldRecord.id)
            }));

            // Eliminar de Respaldo Local
            await localDb.invoices.delete(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
