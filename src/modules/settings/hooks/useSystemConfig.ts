import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { Tenant, User, VenezuelaTaxConfig, ApprovalRule, SysConfigEntry } from "@/lib";
import { toast } from 'sonner';
import { localDb } from '@/lib/localDb';
import { SyncService } from '@/lib/SyncService';
import { CurrencyService } from '@/services/CurrencyService';
import { sendBroadcastNotification } from "@/shared/hooks/useBroadcastNotifications";

/**
 * Hook personalizado para gestionar la configuración global del sistema Violet ERP.
 * 
 * Este es el "Cerebro" del sistema que gestiona:
 * - Multi-tenancy: Empresas y tenant activo
 * - Configuración de impuestos venezolanos (IVA, IGTF, UT)
 * - Reglas de aprobación y workflows
 * - Encabezados personalizados de tablas
 * - Tasa de cambio BCV
 * - Modo mantenimiento
 * - Sincronización en tiempo real
 * 
 * @returns {Object} Objeto con estado y funciones de configuración
 * @returns {string | null} activeTenantId - ID del tenant activo
 * @returns {Tenant} tenant - Objeto tenant completo
 * @returns {Tenant[]} allTenants - Lista de todos los tenants
 * @returns {VenezuelaTaxConfig} taxes - Configuración de impuestos
 * @returns {ApprovalRule[]} approvalRules - Reglas de aprobación
 * @returns {Record} tableHeaders - Encabezados personalizados
 * @returns {number} exchangeRate - Tasa de cambio actual
 * @returns {boolean} isMaintenanceMode - Estado de mantenimiento
 * @returns {boolean} isLoading - Estado de carga
 * @returns {Function} setActiveTenant - Establece tenant activo
 * @returns {Function} fetchAllTenants - Carga todos los tenants
 * @returns {Function} fetchConfigs - Carga configuraciones
 * @returns {Function} updateConfig - Actualiza una configuración
 * @returns {Function} createTenant - Crea nuevo tenant
 * @returns {Function} deleteTenant - Elimina tenant
 * @returns {Function} syncBcvRate - Sincroniza tasa BCV
 * 
 * @example
 * ```typescript
 * const { 
 *   tenant, 
 *   setActiveTenant, 
 *   taxes, 
 *   exchangeRate 
 * } = useSystemConfig();
 * 
 * // Cambiar empresa activa
 * setActiveTenant('tenant-id-123');
 * 
 * // Obtener IVA general
 * const iva = taxes.iva_general; // 16%
 * 
 * // Sincronizar tasa BCV
 * await syncBcvRate();
 * ```
 * 
 * @architecture
 * - Usa Zustand con persist para estado global
 * - Respaldo local en Dexie (IndexedDB)
 * - Sincronización en tiempo real con Supabase
 * - Efecto Camaleón: Aplica branding automáticamente
 * 
 * @persistence
 * - Estado se guarda en localStorage
 * - Respaldo completo en IndexedDB
 * - Sincronización bidireccional con cloud
 * 
 * @realtime
 * - Escucha cambios en tabla tenants
 * - Escucha cambios en tabla sys_config
 * - Actualiza UI automáticamente
 */

/**
 * Tenant neutral usado cuando no hay empresa asignada.
 * Previene errores de null/undefined en la UI.
 */
const NEUTRAL_TENANT: Tenant = {
  id: 'none',
  name: 'Sin empresa asignada',
  slug: 'none',
  rif: '—',
  fiscalName: 'Violet ERP — Sin empresa activa',
  address: '',
  phone: '',
  logoUrl: '',
  primaryColor: '#7c3aed',
  currency: 'USD',
  createdAt: '',
};

interface SystemConfigState {
  /** ID del tenant activo asignado por el super admin. null = sin empresa asignada. */
  activeTenantId: string | null;
  /** Objeto tenant completo */
  tenant: Tenant;
  /** Lista de todos los tenants disponibles */
  allTenants: Tenant[];
  /** Configuración de impuestos (Venezuela Deep-Config) */
  taxes: VenezuelaTaxConfig;
  /** Reglas de aprobación de workflows */
  approvalRules: ApprovalRule[];
  /** Encabezados de tablas personalizados { [moduleId]: { [originalKey]: 'Custom Name' } } */
  tableHeaders: Record<string, Record<string, string>>;
  /** Tasa de cambio BCV actual */
  exchangeRate: number;
  /** Modo mantenimiento */
  isMaintenanceMode: boolean;
  /** Cargando estado */
  isLoading: boolean;
  
  /** Acciones */
  setActiveTenant: (id: string | null) => void;
  setExchangeRate: (rate: number) => Promise<void>;
  fetchAllTenants: () => Promise<void>;
  fetchConfigs: (tenantId?: string | null) => Promise<void>;
  updateConfig: (module: string, key: string, value: unknown) => Promise<void>;
  updateTenantConfig: (updates: Partial<Tenant>) => void;
  updateTenantById: (id: string, updates: Partial<Tenant>) => Promise<void>;
  createTenant: (data: Omit<Tenant, 'id' | 'createdAt'>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  toggleTenantActive: (id: string, active: boolean) => Promise<void>;
  setMaintenanceMode: (enabled: boolean) => void;
  syncBcvRate: () => Promise<void>;
  initializeRealtime: () => () => void;
}

const DEFAULT_TAXES: VenezuelaTaxConfig = {
  iva_general: 16,
  iva_reducido: 8,
  iva_lujo: 31,
  igtf_divisas: 3,
  rif_mask: 'J-00000000-0',
  utValue: 90.00,
};

export const useSystemConfig = create<SystemConfigState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        activeTenantId: null,
        tenant: NEUTRAL_TENANT,
        allTenants: [], // Start empty, fetch on load
        taxes: DEFAULT_TAXES,
        approvalRules: [],
        tableHeaders: {},
        exchangeRate: 1, // Default 1:1 if not set
        isMaintenanceMode: false,
        isLoading: false,

        setActiveTenant: (id) => {
          const { allTenants } = get();
          const tenant = id ? allTenants.find(t => t.id === id) || NEUTRAL_TENANT : NEUTRAL_TENANT;
          set({ activeTenantId: id, tenant });
          if (id) get().fetchConfigs(id);
        },

        fetchAllTenants: async () => {
          console.log('[SystemConfig] Iniciando carga de tenants...');
          
          try {
            // 1. Cargar desde Respaldo Local (Instantáneo)
            const localTenants = await localDb.tenants.toArray();
            console.log(`[SystemConfig] Tenants locales encontrados: ${localTenants.length}`);
            
            if (localTenants.length > 0) {
              set({ allTenants: localTenants });
              
              // AUTO-ASSIGN LOCAL
              const currentActiveId = get().activeTenantId;
              if (!currentActiveId || currentActiveId === 'none') {
                const firstActive = localTenants.find(t => t.isActive !== false);
                if (firstActive) {
                  console.log(`[SystemConfig] Auto-asignando tenant: ${firstActive.name}`);
                  set({ 
                    activeTenantId: firstActive.id, 
                    tenant: firstActive 
                  });
                  await get().fetchConfigs(firstActive.id);
                }
              }
            } else {
              console.log('[SystemConfig] No hay tenants locales, usando NEUTRAL_TENANT');
              set({ 
                allTenants: [NEUTRAL_TENANT],
                activeTenantId: 'none',
                tenant: NEUTRAL_TENANT 
              });

              // --- SEEDING INICIAL ---
              // Si es una instalación totalmente nueva, creamos un tenant base
              console.log('[SystemConfig] Instalación limpia detectada. Creando empresa por defecto...');
              await get().createTenant({
                name: 'Mi Empresa Violet',
                fiscalName: 'Mi Empresa Violet, C.A.',
                rif: 'J-00000000-0',
                address: 'Dirección de la empresa',
                phone: '0000-0000000',
                primaryColor: '#7c3aed',
                currency: 'USD',
                email: 'admin@empresa.com',
                logoUrl: '',
                slug: 'mi-empresa-violet'
              });
            }

            try {
              // CLOUD SYNC DISABLED
              /*
              const { data, error } = await supabase
                .from('tenants')
                .select('*');
              
              if (error) throw error;
              */
              const data: any[] = [];
              
              if (data && data.length > 0) {
                const formattedTenants: Tenant[] = data.map(t => ({
                  id: t.id,
                  name: t.name,
                  slug: t.slug,
                  rif: t.rif || '—',
                  fiscalName: t.fiscal_name || t.name,
                  address: t.address || '',
                  phone: t.phone || '',
                  logoUrl: t.logo_url || '',
                  primaryColor: t.primary_color || '#7c3aed',
                  currency: t.currency || 'USD',
                  createdAt: t.created_at,
                  isActive: t.is_active ?? true,
                }));

                set({ allTenants: formattedTenants });

                // 2. Actualizar Respaldo Local
                await localDb.tenants.bulkPut(formattedTenants);
                
                let activeId = get().activeTenantId;
                
                // AUTO-ASSIGN LOGIC
                // If there's no active tenant, or it's 'none', assign the first active tenant to avoid white screens
                if (!activeId || activeId === 'none') {
                  const firstActive = formattedTenants.find(t => t.isActive !== false);
                  if (firstActive) {
                      activeId = firstActive.id;
                      set({ activeTenantId: activeId });
                  }
                }

                if (activeId && activeId !== 'none') {
                  const active = formattedTenants.find(t => t.id === activeId);
                  if (active) set({ tenant: active });
                  await get().fetchConfigs(activeId);
                } else {
                   set({ tenant: NEUTRAL_TENANT });
                }
              }
            } catch (error) {
              console.error('[SystemConfig] Error en sincronización cloud (esperado si está deshabilitado):', error);
            }
          } catch (error) {
            console.error('[SystemConfig] Error crítico al cargar tenants:', error);
            // Asegurar que siempre haya un tenant disponible
            set({ 
              allTenants: [NEUTRAL_TENANT],
              activeTenantId: 'none',
              tenant: NEUTRAL_TENANT 
            });
          }
        },

        fetchConfigs: async (tenantId) => {
          if (!tenantId || tenantId === 'none') {
            set({ taxes: DEFAULT_TAXES, approvalRules: [], tableHeaders: {} });
            return;
          }

          // 1. Cargar desde Respaldo Local (Instantáneo)
          const localConfigs = await localDb.sys_config
            .where('tenant_id')
            .equals(tenantId)
            .toArray();
          
          if (localConfigs.length > 0) {
            const taxE = localConfigs.find(c => c.key === 'venezuela_taxes');
            const apprE = localConfigs.find(c => c.key === 'approval_workflow');
            const headE = localConfigs.find(c => c.key === 'table_headers');
            const maintE = localConfigs.find(c => c.key === 'maintenance_mode');

            set({
              taxes: taxE ? taxE.value_json : DEFAULT_TAXES,
              approvalRules: apprE ? apprE.value_json : [],
              tableHeaders: headE ? headE.value_json : {},
              isMaintenanceMode: maintE ? maintE.value_json?.enabled : false,
              exchangeRate: localConfigs.find(c => c.key === 'exchange_rate')?.value_json?.rate || 1,
            });
          }

          set({ isLoading: true });
          try {
            // CLOUD SYNC DISABLED
            /*
            const { data, error } = await supabase
              .from('sys_config')
              .select('*')
              .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);

            if (error) throw error;
            */
            const data: any[] = [];

            if (data && data.length > 0) {
              const taxEntry = data.find((c: SysConfigEntry) => c.key === 'venezuela_taxes');
              const approvalEntry = data.find((c: SysConfigEntry) => c.key === 'approval_workflow');
              const headersEntry = data.find((c: SysConfigEntry) => c.key === 'table_headers');
              const maintenanceEntry = data.find((c: SysConfigEntry) => c.key === 'maintenance_mode');

              set({
                taxes: taxEntry ? taxEntry.value_json : DEFAULT_TAXES,
                approvalRules: approvalEntry ? approvalEntry.value_json : [],
                tableHeaders: headersEntry ? headersEntry.value_json : {},
                isMaintenanceMode: maintenanceEntry ? maintenanceEntry.value_json?.enabled : false,
                exchangeRate: data.find((c: SysConfigEntry) => c.key === 'exchange_rate')?.value_json?.rate || 1,
              });

              // 2. Actualizar Respaldo Local
              const configToStore = data.map(c => ({
                id: c.id || `${tenantId}_${c.key}`,
                tenant_id: tenantId,
                key: c.key,
                value_json: c.value_json,
                updated_at: c.updated_at
              }));
              await localDb.sys_config.bulkPut(configToStore);
            }
          } catch (error) {
            console.error('Error fetching system configs:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        updateConfig: async (module, key, value) => {
          const tenantId = get().activeTenantId;
          try {
            const dbPayload = {
              tenant_id: tenantId,
              module,
              key,
              value_json: value,
              value_type: typeof value === 'object' ? 'json' : typeof value,
              updated_at: new Date().toISOString(),
            };

            const { error } = await SyncService.mutate(
              'sys_config',
              'INSERT', 
              dbPayload,
              `${tenantId}_${module}_${key}`
            );

            if (error) throw error;

            if (key === 'venezuela_taxes') set({ taxes: value as VenezuelaTaxConfig });
            if (key === 'approval_workflow') set({ approvalRules: value as ApprovalRule[] });
            if (key === 'table_headers') set({ tableHeaders: value as Record<string, Record<string, string>> });
            if (key === 'maintenance_mode') set({ isMaintenanceMode: (value as { enabled: boolean }).enabled });

            // Persistir localmente
            await localDb.sys_config.put({
              id: `${tenantId}_${module}_${key}`,
              tenant_id: tenantId,
              module,
              key,
              value_json: value,
              updated_at: dbPayload.updated_at
            });

            toast.success(`Configuración '${key}' actualizada exitosamente.`);
          } catch (err) {
            console.error('Error updating config:', err);
            toast.error('Error al guardar la configuración.');
          }
        },

        setExchangeRate: async (rate) => {
          try {
            const value = { rate, lastUpdated: new Date().toISOString(), provider: 'manual' };
            await get().updateConfig('global', 'exchange_rate', value);
            set({ exchangeRate: rate });
            
            // Enviar notificación broadcast a todos los usuarios
            sendBroadcastNotification({
              type: 'exchange_rate_update',
              title: 'Tasa de Cambio Actualizada',
              message: `La tasa de cambio BCV ha sido actualizada a ${rate.toFixed(4)} Bs./USD`,
              tenantId: get().activeTenantId || undefined,
              data: { rate, timestamp: new Date().toISOString() }
            });
            
            toast.success(`Tasa de cambio actualizada a ${rate} VES/USD`);
          } catch (err) {
            console.error('Error setting exchange rate:', err);
          }
        },

        updateTenantConfig: (updates) => {
          set((state) => ({
            tenant: { ...state.tenant, ...updates },
            allTenants: state.allTenants.map(t =>
              t.id === state.activeTenantId ? { ...t, ...updates } : t
            )
          }));
        },

        updateTenantById: async (id, updates) => {
          try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name)         dbUpdates.name          = updates.name;
            if (updates.fiscalName)   dbUpdates.fiscal_name   = updates.fiscalName;
            if (updates.rif)          dbUpdates.rif           = updates.rif;
            if (updates.address)      dbUpdates.address       = updates.address;
            if (updates.phone)        dbUpdates.phone         = updates.phone;
            if (updates.logoUrl)      dbUpdates.logo_url      = updates.logoUrl;
            if (updates.primaryColor) dbUpdates.primary_color = updates.primaryColor;
            if (updates.currency)     dbUpdates.currency      = updates.currency;

            const { error } = await SyncService.mutate(
              'tenants',
              'UPDATE',
              { ...dbUpdates, updated_at: new Date().toISOString() },
              id
            );

            if (error) throw error;

            const updatedTenants = get().allTenants.map(t => t.id === id ? { ...t, ...updates } : t);
            set((state) => ({
              allTenants: updatedTenants,
              tenant: state.activeTenantId === id ? { ...state.tenant, ...updates } : state.tenant,
            }));

            // Actualizar Respaldo Local (Dexie)
            const updatedTenant = updatedTenants.find(t => t.id === id);
            if (updatedTenant) await localDb.tenants.put(updatedTenant);

            toast.success('Empresa actualizada correctamente.');
          } catch (err) {
            console.error('Error updating tenant:', err);
            toast.error('Error al actualizar la empresa.');
          }
        },

        createTenant: async (data) => {
          try {
            const tempId = crypto.randomUUID();
            const dbPayload = {
              id: tempId,
              name: data.name,
              slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
              fiscal_name: data.fiscalName,
              rif: data.rif,
              address: data.address,
              phone: data.phone,
              logo_url: data.logoUrl,
              primary_color: data.primaryColor,
              currency: data.currency,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const mutationResult = await SyncService.mutate(
              'tenants',
              'INSERT',
              dbPayload,
              tempId
            );

            if (mutationResult.error) throw mutationResult.error;

            const newTenant: Tenant = {
              id: (mutationResult as any).data?.id || tempId,
              name: dbPayload.name,
              slug: dbPayload.slug,
              rif: dbPayload.rif || '—',
              fiscalName: dbPayload.fiscal_name || dbPayload.name,
              address: dbPayload.address || '',
              phone: dbPayload.phone || '',
              logoUrl: dbPayload.logo_url || '',
              primaryColor: dbPayload.primary_color || '#7c3aed',
              currency: dbPayload.currency || 'USD',
              createdAt: dbPayload.created_at,
              isActive: true,
            };

            set((state) => ({ allTenants: [...state.allTenants, newTenant] }));
            await localDb.tenants.put(newTenant);
            toast.success(`Empresa "${data.name}" creada exitosamente.`);
          } catch (err: any) {
            console.error('Error creating tenant:', err);
            toast.error(`Error al crear la empresa: ${err.message || 'Error desconocido'}`);
          }
        },

        deleteTenant: async (id) => {
          try {
            const { error } = await SyncService.mutate(
              'tenants',
              'DELETE',
              null,
              id
            );

            if (error) throw error;

            set((state) => ({
              allTenants: state.allTenants.filter(t => t.id !== id),
              activeTenantId: state.activeTenantId === id ? null : state.activeTenantId,
              tenant: state.activeTenantId === id ? NEUTRAL_TENANT : state.tenant,
            }));

            await localDb.tenants.delete(id);
            toast.success('Empresa eliminada.');
          } catch (err) {
            console.error('Error deleting tenant:', err);
            toast.error('Error al eliminar la empresa.');
          }
        },

        toggleTenantActive: async (id, active) => {
          try {
            const { error } = await SyncService.mutate(
              'tenants',
              'UPDATE',
              { updated_at: new Date().toISOString() },
              id
            );

            if (error) throw error;

            const updatedTenants = get().allTenants.map(t => t.id === id ? { ...t, isActive: active } : t);
            set({ allTenants: updatedTenants });

            const updatedTenant = updatedTenants.find(t => t.id === id);
            if (updatedTenant) await localDb.tenants.put(updatedTenant);

            toast.success(`Empresa ${active ? 'activada' : 'desactivada'}.`);
          } catch (err) {
            console.error('Error toggling tenant:', err);
            toast.error('Error al cambiar estado de la empresa.');
          }
        },

        setMaintenanceMode: (enabled) => {
          get().updateConfig('global', 'maintenance_mode', { enabled });
        },
        
        syncBcvRate: async () => {
          set({ isLoading: true });
          try {
            const rate = await CurrencyService.getBcvRate();
            if (rate) {
              await get().setExchangeRate(rate);
            } else {
              toast.error("No se pudo obtener la tasa BCV automáticamente.");
            }
          } catch (error) {
            console.error("[SystemConfig] Error syncing BCV rate:", error);
          } finally {
            set({ isLoading: false });
          }
        },

        initializeRealtime: () => {
          const tenantsChannel = supabase
            .channel('tenants_realtime')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'tenants' },
              async (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                  const t = newRecord;
                  const formatted: Tenant = {
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    rif: t.rif || '—',
                    fiscalName: t.fiscal_name || t.name,
                    address: t.address || '',
                    phone: t.phone || '',
                    logoUrl: t.logo_url || '',
                    primaryColor: t.primary_color || '#7c3aed',
                    currency: t.currency || 'USD',
                    createdAt: t.created_at,
                    isActive: t.is_active ?? true,
                  };
                  set(state => ({
                    allTenants: state.allTenants.some(x => x.id === formatted.id)
                      ? state.allTenants.map(x => x.id === formatted.id ? formatted : x)
                      : [...state.allTenants, formatted],
                    tenant: state.activeTenantId === formatted.id ? formatted : state.tenant
                  }));

                  // Actualizar Respaldo Local
                  await localDb.tenants.put(formatted);

                } else if (eventType === 'DELETE' && oldRecord) {
                  set(state => ({
                    allTenants: state.allTenants.filter(x => x.id !== oldRecord.id),
                    activeTenantId: state.activeTenantId === oldRecord.id ? null : state.activeTenantId,
                    tenant: state.activeTenantId === oldRecord.id ? NEUTRAL_TENANT : state.tenant
                  }));

                  // Eliminar de Respaldo Local
                  await localDb.tenants.delete(oldRecord.id);
                }
              }
            )
            .subscribe();

          const configChannel = supabase
            .channel('sys_config_realtime')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'sys_config' },
              (payload) => {
                const { eventType, new: newRecord } = payload;
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                  const activeTenantId = get().activeTenantId;
                  if (!newRecord.tenant_id || newRecord.tenant_id === activeTenantId) {
                    const key = newRecord.key;
                    const value = newRecord.value_json;
                    if (key === 'venezuela_taxes') set({ taxes: value as VenezuelaTaxConfig });
                    if (key === 'approval_workflow') set({ approvalRules: value as ApprovalRule[] });
                    if (key === 'table_headers') set({ tableHeaders: value as Record<string, Record<string, string>> });
                    if (key === 'maintenance_mode') set({ isMaintenanceMode: (value as { enabled: boolean })?.enabled });
                  }
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(tenantsChannel);
            supabase.removeChannel(configChannel);
          };
        },
      }),
      {
        name: 'violet-system-config',
        partialize: (state) => ({ 
          activeTenantId: state.activeTenantId,
          tenant: state.tenant,
          allTenants: state.allTenants,
        }),
      }
    )
  )
);

// --- EFECTO CAMALEÓN (Suscripción Centralizada) ---
if (typeof window !== 'undefined') {
  useSystemConfig.subscribe(
    (state) => state.tenant,
    (tenant) => {
      const root = document.documentElement;
      const color = tenant.primaryColor || '#7c3aed';
      
      root.style.setProperty('--primary', color);
      root.style.setProperty('--ring', color);
      
      document.title = tenant.id === 'none' 
        ? 'Violet ERP' 
        : `${tenant.name} | Violet ERP`;
        
      console.log(`[Branding] Aplicando identidad: ${tenant.name} (${color})`);
    },
    { fireImmediately: true }
  );
}
