/**
 * Sistema de analytics para Violet ERP.
 * Soporta múltiples proveedores (Google Analytics, Mixpanel, etc.)
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  tenantId?: string;
  plan?: string;
}

class Analytics {
  private enabled: boolean;
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};

  constructor() {
    this.enabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
    
    if (this.enabled) {
      this.initializeProviders();
    }
  }

  /**
   * Inicializa los proveedores de analytics.
   */
  private initializeProviders() {
    // Google Analytics 4
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      this.initGA4();
    }

    console.log('[Analytics] Initialized');
  }

  /**
   * Inicializa Google Analytics 4.
   */
  private initGA4() {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    // Cargar script de GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Configurar GA4
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // Manejamos pageviews manualmente
    });

    (window as any).gtag = gtag;
  }

  /**
   * Identifica al usuario actual.
   * 
   * @param user - Información del usuario
   * 
   * @example
   * ```typescript
   * analytics.identify({
   *   id: user.id,
   *   email: user.email,
   *   name: user.name,
   *   tenantId: user.tenantId,
   *   plan: 'premium'
   * });
   * ```
   */
  identify(user: AnalyticsUser) {
    if (!this.enabled) return;

    this.userId = user.id;
    this.userProperties = {
      email: user.email,
      name: user.name,
      tenant_id: user.tenantId,
      plan: user.plan,
    };

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_id: user.id,
        ...this.userProperties,
      });
    }

    console.log('[Analytics] User identified:', user.id);
  }

  /**
   * Registra un evento.
   * 
   * @param name - Nombre del evento
   * @param properties - Propiedades del evento
   * 
   * @example
   * ```typescript
   * analytics.track('sale_completed', {
   *   amount: 1500,
   *   currency: 'USD',
   *   items: 3,
   *   category: 'retail'
   * });
   * ```
   */
  track(name: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log('[Analytics] Event tracked (disabled):', name, properties);
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        user_id: this.userId,
        timestamp: Date.now(),
      },
    };

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', name, event.properties);
    }

    console.log('[Analytics] Event tracked:', name, properties);
  }

  /**
   * Registra una vista de página.
   * 
   * @param path - Ruta de la página
   * @param title - Título de la página
   * 
   * @example
   * ```typescript
   * analytics.page('/dashboard', 'Dashboard');
   * ```
   */
  page(path: string, title?: string) {
    if (!this.enabled) return;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
        user_id: this.userId,
      });
    }

    console.log('[Analytics] Page view:', path, title);
  }

  /**
   * Limpia los datos del usuario (al hacer logout).
   * 
   * @example
   * ```typescript
   * analytics.reset();
   * ```
   */
  reset() {
    if (!this.enabled) return;

    this.userId = null;
    this.userProperties = {};

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_id: undefined,
      });
    }

    console.log('[Analytics] User data cleared');
  }
}

// Singleton instance
export const analytics = new Analytics();

// Declaración de tipos para window
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Hook de React para tracking de eventos.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const trackEvent = useAnalytics();
 *   
 *   const handleClick = () => {
 *     trackEvent('button_clicked', { button: 'submit' });
 *   };
 *   
 *   return <button onClick={handleClick}>Submit</button>;
 * }
 * ```
 */
export function useAnalytics() {
  return (name: string, properties?: Record<string, any>) => {
    analytics.track(name, properties);
  };
}

/**
 * Hook para tracking automático de pageviews.
 * 
 * @example
 * ```typescript
 * function App() {
 *   usePageTracking();
 *   return <Router>...</Router>;
 * }
 * ```
 */
export function usePageTracking() {
  if (typeof window === 'undefined') return;

  // Track initial page
  analytics.page(window.location.pathname, document.title);

  // Track navigation changes
  const handleNavigation = () => {
    analytics.page(window.location.pathname, document.title);
  };

  window.addEventListener('popstate', handleNavigation);
  
  return () => {
    window.removeEventListener('popstate', handleNavigation);
  };
}
