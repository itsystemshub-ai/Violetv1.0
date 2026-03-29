/**
 * AppProviders - Composición de todos los providers de la aplicación
 * 
 * Arquitectura: Composition Pattern
 * - Separa la configuración de providers del componente App
 * - Facilita testing y mantenimiento
 * - Permite lazy loading de providers
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { OnlineStatusProvider } from '@/core/shared/components/OnlineStatusProvider';
import { GlobalAppProvider } from '@/contexts/GlobalAppContext';

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // No retry on 4xx errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders Component
 * 
 * Orden de providers (de afuera hacia adentro):
 * 1. ThemeProvider - Tema global
 * 2. OnlineStatusProvider - Estado de conectividad
 * 3. GlobalAppProvider - Estado global integrado (Inventario, Ventas, Compras, Finanzas, CRM)
 * 4. QueryClientProvider - React Query
 * 5. TooltipProvider - Tooltips globales
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <OnlineStatusProvider>
        <GlobalAppProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
          </QueryClientProvider>
        </GlobalAppProvider>
      </OnlineStatusProvider>
    </ThemeProvider>
  );
};

// Export query client for external use
export { queryClient };
