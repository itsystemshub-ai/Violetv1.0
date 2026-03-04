/**
 * App Component - Punto de entrada principal de la aplicación
 * 
 * Arquitectura Mejorada:
 * - Separation of Concerns: Providers, Router, Initialization separados
 * - Composition Pattern: Componentes componibles y reutilizables
 * - Clean Architecture: Dependencias claras y unidireccionales
 * 
 * Mejoras aplicadas:
 * ✅ Providers extraídos a AppProviders
 * ✅ Router extraído a AppRouter
 * ✅ Inicialización extraída a AppInitializer
 * ✅ Notificaciones extraídas a NotificationManager
 * ✅ Mejor separación de responsabilidades
 * ✅ Más fácil de testear y mantener
 */

import React from 'react';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { AppProviders } from '@/core/providers/AppProviders';
import { AppRouter } from '@/core/router/AppRouter';
import { AppInitializer } from '@/core/initialization/AppInitializer';
import { NotificationManager } from '@/core/notifications/NotificationManager';
import { OfflineBanner } from '@/shared/components/feedback/OfflineBanner';
import { RealtimeBootstrap } from '@/core/shared/components/RealtimeBootstrap';

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
 * 8. RealtimeBootstrap - Inicialización de realtime
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppInitializer>
          <HashRouter>
            <AppRouter />
            <NotificationManager />
            <OfflineBanner />
            <RealtimeBootstrap />
          </HashRouter>
        </AppInitializer>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
