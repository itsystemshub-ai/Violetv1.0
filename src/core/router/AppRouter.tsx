/**
 * AppRouter - Configuración centralizada de rutas
 *
 * Arquitectura: Feature-Based Routing
 * - Separa la lógica de routing del componente App
 * - Implementa lazy loading automático
 * - Maneja error boundaries por ruta
 */

import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/core/auth/components/ProtectedRoute";
import { RouteErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  NOT_FOUND_ROUTE,
  RouteConfig,
} from "./routes.config";
import { ValeryLayout } from "@/layouts/ValeryLayout";

/**
 * Loading Fallback Component
 */
const LoadingFallback: React.FC = () => (
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

/**
 * Render a single route with error boundary
 */
const renderRoute = (route: RouteConfig) => {
  const Component = route.component;
  const element = (
    <RouteErrorBoundary routeName={route.title || route.path}>
      <Component />
    </RouteErrorBoundary>
  );

  return <Route key={route.path} path={route.path} element={element} />;
};

/**
 * Render a protected route with authentication and permissions
 */
const renderProtectedRoute = (route: RouteConfig) => {
  const Component = route.component;
  const element = (
    <ProtectedRoute requiredPermission={route.permission}>
      <RouteErrorBoundary routeName={route.title || route.path}>
        <Component />
      </RouteErrorBoundary>
    </ProtectedRoute>
  );

  return <Route key={route.path} path={route.path} element={element} />;
};

/**
 * AppRouter Component
 */
export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        {PUBLIC_ROUTES.map(renderRoute)}

        {/* Protected Routes Wrapper */}
        <Route element={<ValeryLayout />}>
          {PROTECTED_ROUTES.map(renderProtectedRoute)}
        </Route>

        {/* 404 Route */}
        {renderRoute(NOT_FOUND_ROUTE)}
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
