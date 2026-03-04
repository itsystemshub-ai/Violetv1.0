import React, { useEffect, useState, Suspense, lazy } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

import { ROUTE_PATHS } from "@/lib";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useBroadcastNotifications } from "@/shared/hooks/useBroadcastNotifications";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProtectedRoute } from "@/core/auth/components/ProtectedRoute";
import { OfflineBanner } from "@/shared/components/feedback/OfflineBanner";
import { RealtimeBootstrap } from "@/core/shared/components/RealtimeBootstrap";
import { ErrorBoundary, RouteErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { OnlineStatusProvider } from "@/core/shared/components/OnlineStatusProvider";
import { NetworkService } from "@/services/LocalNetworkService";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { backupService } from "@/services/backup/BackupService";

// Lazy-loaded Pages
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const Finance = lazy(() => import("@/features/finance/pages/Finance"));
const Inventory = lazy(() => import("@/features/inventory/pages/Inventory"));
const Sales = lazy(() => import("@/features/sales/pages/Sales"));
const Purchases = lazy(() => import("@/features/purchases/pages/Purchases"));
const HR = lazy(() => import("@/features/hr/pages/HR"));
const Settings = lazy(() => import("@/modules/settings/pages/SettingsPage"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const ConnectivityError = lazy(() => import("@/shared/pages/ConnectivityError"));
const Unauthorized = lazy(() => import("@/shared/pages/Unauthorized"));
const NotFound = lazy(() => import("@/shared/pages/not-found/Index"));
const InvoicePreview = lazy(() => import("@/modules/sales/pages/InvoicePreviewPage"));
const AccountsReceivable = lazy(() => import("@/modules/accounts-receivable/pages/AccountsReceivablePage"));
const InventoryMovements = lazy(() => import("@/features/inventory/pages/InventoryMovements"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute top-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-muted-foreground font-medium animate-pulse">
      Cargando módulo...
    </p>
  </div>
);

const App: React.FC = () => {
  const { fetchAllTenants, activeTenantId } = useSystemConfig();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar sistema de notificaciones broadcast
  useBroadcastNotifications(user?.id, activeTenantId || undefined);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await fetchAllTenants();
        const configuredIp = localStorage.getItem("master_ip") || "localhost";
        NetworkService.connect(configuredIp);
        
        // Inicializar servicio de backup automático
        console.log("🔄 Inicializando servicio de backup automático...");
        backupService.getConfig(); // Esto inicia el servicio
        
        setIsInitialized(true);
      } catch (error) {
        console.error("[App] Error al inicializar:", error);
        setIsInitialized(true);
      }
    };
    initializeApp();
  }, [fetchAllTenants]);

  if (!isInitialized) return <LoadingFallback />;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OnlineStatusProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
            <OfflineBanner />
            <RealtimeBootstrap />
            <HashRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />

                  <Route
                    path={ROUTE_PATHS.DASHBOARD}
                    element={
                      <ProtectedRoute>
                        <RouteErrorBoundary routeName="Dashboard">
                          <Dashboard />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.FINANCE}
                    element={
                      <ProtectedRoute requiredPermission="view:finance">
                        <RouteErrorBoundary routeName="Finance">
                          <Finance />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.INVENTORY}
                    element={
                      <ProtectedRoute requiredPermission="view:inventory">
                        <RouteErrorBoundary routeName="Inventory">
                          <Inventory />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.SALES}
                    element={
                      <ProtectedRoute requiredPermission="view:sales">
                        <RouteErrorBoundary routeName="Sales">
                          <Sales />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoice-preview"
                    element={
                      <ProtectedRoute requiredPermission="view:sales">
                        <RouteErrorBoundary routeName="InvoicePreview">
                          <InvoicePreview />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/accounts-receivable"
                    element={
                      <ProtectedRoute requiredPermission="view:finance">
                        <RouteErrorBoundary routeName="AccountsReceivable">
                          <AccountsReceivable />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory-movements"
                    element={
                      <ProtectedRoute requiredPermission="view:inventory">
                        <RouteErrorBoundary routeName="InventoryMovements">
                          <InventoryMovements />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.PURCHASES}
                    element={
                      <ProtectedRoute requiredPermission="view:purchases">
                        <RouteErrorBoundary routeName="Purchases">
                          <Purchases />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.HR}
                    element={
                      <ProtectedRoute requiredPermission="view:hr">
                        <RouteErrorBoundary routeName="HR">
                          <HR />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTE_PATHS.SETTINGS}
                    element={
                      <ProtectedRoute requiredPermission="view:settings">
                        <RouteErrorBoundary routeName="Settings">
                          <Settings />
                        </RouteErrorBoundary>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/connectivity-error"
                    element={<ConnectivityError />}
                  />
                  <Route
                    path="/unauthorized"
                    element={<Unauthorized />}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </HashRouter>
            <Toaster />
            <Sonner position="top-right" expand={false} richColors />
          </TooltipProvider>
        </QueryClientProvider>
      </OnlineStatusProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
