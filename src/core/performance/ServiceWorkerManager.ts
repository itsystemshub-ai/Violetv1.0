/**
 * Service Worker Manager - Gestiona el registro y actualización del SW
 */

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Register service worker
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Manager] ⚠️ Service Workers not supported');
      return;
    }

    try {
      console.log('[SW Manager] 📦 Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Manager] ✅ Service worker registered');

      // Check for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Manager] 🔄 New version available');
              this.notifyUpdate();
            }
          });
        }
      });

      // Check for updates every hour
      setInterval(() => {
        this.checkForUpdates();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[SW Manager] ❌ Registration failed:', error);
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SW Manager] ✅ Checked for updates');
    } catch (error) {
      console.error('[SW Manager] ❌ Update check failed:', error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload page after activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Clear service worker cache
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) return;

    this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW Manager] 🗑️ Cache clear requested');
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.unregister();
      console.log('[SW Manager] 🛑 Service worker unregistered');
      this.registration = null;
    } catch (error) {
      console.error('[SW Manager] ❌ Unregister failed:', error);
    }
  }

  /**
   * Notify user about available update
   */
  private notifyUpdate(): void {
    // You can integrate with your notification system here
    console.log('[SW Manager] 💡 Nueva versión disponible. Recarga la página para actualizar.');
    
    // Optional: Show a toast notification
    if (typeof window !== 'undefined' && 'toast' in window) {
      // @ts-ignore
      window.toast?.info('Nueva versión disponible', {
        description: 'Recarga la página para actualizar',
        action: {
          label: 'Recargar',
          onClick: () => this.skipWaiting(),
        },
      });
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    serviceWorkerManager.register();
  });
}
