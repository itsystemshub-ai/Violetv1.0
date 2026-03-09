import React, { Suspense, lazy, useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { AppProviders } from "@/core/providers/AppProviders";
import { AppRouter } from "@/core/router/AppRouter";
import { AppInitializer } from "@/core/initialization/AppInitializer";
import { NotificationManager } from "@/core/notifications/NotificationManager";
import { OfflineBanner } from "@/shared/components/feedback/OfflineBanner";
import { AIFloatingButton } from "@/shared/components/ai";
import { IdleTimer } from "@/core/auth/components/IdleTimer";
import { MaintenanceResponder } from "@/components/shared/MaintenanceResponder";
import { initializeRoutePreloading } from "@/core/performance/RoutePreloader";

// Lazy load heavy components that aren't needed immediately
const RealtimeInitializer = lazy(() =>
  import("@/core/shared/components/RealtimeInitializer").then((m) => ({
    default: m.RealtimeInitializer,
  })),
);

/**
 * App Component
 *
 * Estructura:
 * 1. ErrorBoundary - Captura errores globales
 * 2. AppProviders - Providers de contexto (Theme, Query, etc.)
 * 3. AppInitializer - Inicialización de servicios
 * 4. HashRouter - Routing
 * 5. AppRouter - Configuración de rutas
 * 6. NotificationManager - Sistema de notificaciones
 * 7. OfflineBanner - Banner de estado offline
 * 8. RealtimeInitializer - Inicialización de realtime (lazy loaded)
 *
 * Optimizaciones:
 * - Lazy loading de componentes pesados
 * - Precarga de rutas críticas en idle time
 * - Inicialización paralela de servicios
 */
const App: React.FC = () => {
  // Initialize route preloading after app is mounted
  useEffect(() => {
    initializeRoutePreloading();
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppInitializer>
          <HashRouter>
            <AppRouter />
            <NotificationManager />
            <OfflineBanner />
            <Suspense fallback={null}>
              <RealtimeInitializer />
            </Suspense>
            <AIFloatingButton />
            <IdleTimer />
            <MaintenanceResponder />
          </HashRouter>
        </AppInitializer>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
