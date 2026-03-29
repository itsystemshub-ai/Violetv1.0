/**
 * RoutePreloader - Precarga rutas críticas en idle time
 * 
 * Mejora la percepción de velocidad precargando las páginas
 * más usadas cuando el navegador está inactivo.
 */

// Rutas críticas que se usan frecuentemente
const CRITICAL_ROUTES = [
  () => import('@/modules/sales/pages/POSPage'),
  () => import('@/modules/inventory/pages/ProductsPage'),
  () => import('@/modules/sales/pages/ClientsPage'),
  () => import('@/modules/inventory/pages/InventoryDashboardPage'),
];

// Rutas secundarias (menos prioritarias)
const SECONDARY_ROUTES = [
  () => import('@/modules/sales/pages/InvoicesPageNew'),
  () => import('@/modules/sales/pages/OrdersPage'),
  () => import('@/modules/inventory/pages/CategoriesPage'),
  () => import('@/modules/finance/pages/FinancePage'),
];

/**
 * Preload critical routes during idle time
 */
export const preloadCriticalRoutes = () => {
  // Check if requestIdleCallback is supported
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      console.log('[RoutePreloader] 🚀 Precargando rutas críticas...');
      
      CRITICAL_ROUTES.forEach((route, index) => {
        setTimeout(() => {
          route().then(() => {
            console.log(`[RoutePreloader] ✅ Ruta crítica ${index + 1}/${CRITICAL_ROUTES.length} precargada`);
          }).catch((error) => {
            console.warn(`[RoutePreloader] ⚠️ Error precargando ruta ${index + 1}:`, error);
          });
        }, index * 100); // Stagger loading
      });
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      console.log('[RoutePreloader] 🚀 Precargando rutas críticas (fallback)...');
      
      CRITICAL_ROUTES.forEach((route, index) => {
        setTimeout(() => {
          route().catch((error) => {
            console.warn(`[RoutePreloader] ⚠️ Error precargando ruta ${index + 1}:`, error);
          });
        }, index * 200);
      });
    }, 3000); // Wait 3 seconds after initial load
  }
};

/**
 * Preload secondary routes (lower priority)
 */
export const preloadSecondaryRoutes = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      console.log('[RoutePreloader] 📦 Precargando rutas secundarias...');
      
      SECONDARY_ROUTES.forEach((route, index) => {
        setTimeout(() => {
          route().then(() => {
            console.log(`[RoutePreloader] ✅ Ruta secundaria ${index + 1}/${SECONDARY_ROUTES.length} precargada`);
          }).catch((error) => {
            console.warn(`[RoutePreloader] ⚠️ Error precargando ruta secundaria ${index + 1}:`, error);
          });
        }, index * 200);
      });
    }, { timeout: 5000 });
  }
};

/**
 * Initialize route preloading
 */
export const initializeRoutePreloading = () => {
  // Wait for initial page to be fully loaded
  if (document.readyState === 'complete') {
    preloadCriticalRoutes();
    preloadSecondaryRoutes();
  } else {
    window.addEventListener('load', () => {
      preloadCriticalRoutes();
      preloadSecondaryRoutes();
    });
  }
};
