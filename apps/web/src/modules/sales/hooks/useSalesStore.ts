import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Invoice } from '@/lib/index';
import { localDb } from "@/core/database/localDb";
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

      const localOnlyInvoices = localInvoices.filter(local => !mappedInvoices.some(mapped => mapped.id === local.id));
      const finalInvoices = [...mappedInvoices, ...localOnlyInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({ invoices: finalInvoices });
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

            await localDb.invoices.put(formatted);

          } else if (eventType === 'DELETE' && oldRecord) {
            set(state => ({
              invoices: state.invoices.filter(i => i.id !== oldRecord.id)
            }));

            await localDb.invoices.delete(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel?.unsubscribe();
    };
  }
}));
