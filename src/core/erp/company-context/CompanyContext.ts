/**
 * Company Context - Contexto de Empresa Activa
 * 
 * Responsabilidad:
 * - Definir empresa activa en el sistema
 * - Bloquear operaciones sin empresa seleccionada
 * - Mantener el tenant_id actual para todas las operaciones
 * 
 * @module core/erp/company-context
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: string;
  name: string;
  rif: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: 'USD' | 'VES';
  createdAt: string;
  updatedAt: string;
}

interface CompanyContextState {
  // Estado actual
  activeCompany: Company | null;
  isCompanySelected: boolean;
  
  // Acciones
  setCompany: (company: Company) => void;
  clearCompany: () => void;
  updateCompany: (updates: Partial<Company>) => void;
  
  // Validación
  requireCompany: () => Company;
}

/**
 * Store de Zustand para gestionar el contexto de empresa
 * Persiste en localStorage para mantener la sesión
 */
export const useCompanyContext = create<CompanyContextState>()(
  persist(
    (set, get) => ({
      activeCompany: null,
      isCompanySelected: false,

      setCompany: (company: Company) => {
        set({
          activeCompany: company,
          isCompanySelected: true,
        });
        console.log('[CompanyContext] Empresa seleccionada:', company.name);
      },

      clearCompany: () => {
        set({
          activeCompany: null,
          isCompanySelected: false,
        });
        console.log('[CompanyContext] Empresa deseleccionada');
      },

      updateCompany: (updates: Partial<Company>) => {
        const current = get().activeCompany;
        if (current) {
          set({
            activeCompany: { ...current, ...updates, updatedAt: new Date().toISOString() },
          });
        }
      },

      requireCompany: () => {
        const company = get().activeCompany;
        if (!company) {
          throw new Error('No hay empresa seleccionada. Por favor seleccione una empresa primero.');
        }
        return company;
      },
    }),
    {
      name: 'violet-company-context',
      partialize: (state) => ({
        activeCompany: state.activeCompany,
        isCompanySelected: state.isCompanySelected,
      }),
    }
  )
);

/**
 * Hook para acceder al contexto de empresa en componentes
 * 
 * @example
 * ```typescript
 * const { activeCompany, setCompany } = useCompany();
 * 
 * // Validar empresa antes de operar
 * const company = useCompany_require();
 * ```
 */
export const useCompany = () => useCompanyContext();

/**
 * Hook que lanza error si no hay empresa seleccionada
 * 
 * @throws Error si no hay empresa activa
 */
export const useCompanyRequired = () => {
  const { requireCompany, activeCompany } = useCompanyContext();
  return activeCompany ? activeCompany : requireCompany();
};

/**
 * Selector para obtener solo el ID de la empresa activa
 * Útil para consultas rápidas
 */
export const useCompanyId = () => useCompanyContext((state) => state.activeCompany?.id ?? null);

/**
 * Verificar si hay empresa seleccionada
 */
export const useHasCompany = () => useCompanyContext((state) => state.isCompanySelected);

// Export para uso en lógica de negocio (no React)
export const companyContext = {
  getCompany: () => useCompanyContext.getState().activeCompany,
  getCompanyId: () => useCompanyContext.getState().activeCompany?.id ?? null,
  hasCompany: () => useCompanyContext.getState().isCompanySelected,
  
  setCompany: (company: Company) => useCompanyContext.getState().setCompany(company),
  clearCompany: () => useCompanyContext.getState().clearCompany(),
};

export default useCompanyContext;