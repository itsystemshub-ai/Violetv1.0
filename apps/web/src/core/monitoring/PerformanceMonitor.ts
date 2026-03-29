/**
 * Performance Monitor - Monitorea el rendimiento de la aplicación
 * 
 * Recopila métricas de performance y las almacena para análisis
 */

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'resource' | 'measure' | 'paint' | 'custom';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    console.log('[PerformanceMonitor] 🚀 Inicializando monitoreo de rendimiento...');

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor resource timing
    this.observeResourceTiming();

    // Monitor paint timing
    this.observePaintTiming();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor layout shifts
    this.observeLayoutShifts();

    // Monitor first input delay
    this.observeFirstInputDelay();

    console.log('[PerformanceMonitor] ✅ Monitoreo inicializado');
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            this.recordMetric({
              name: 'navigation.domContentLoaded',
              value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              category: 'navigation',
              metadata: {
                type: navEntry.type,
                redirectCount: navEntry.redirectCount,
              },
            });

            this.recordMetric({
              name: 'navigation.loadComplete',
              value: navEntry.loadEventEnd - navEntry.loadEventStart,
              category: 'navigation',
            });

            this.recordMetric({
              name: 'navigation.domInteractive',
              value: navEntry.domInteractive - navEntry.fetchStart,
              category: 'navigation',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ Navigation timing not supported');
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Only track slow resources (>1s)
            if (resourceEntry.duration > 1000) {
              this.recordMetric({
                name: 'resource.slow',
                value: resourceEntry.duration,
                category: 'resource',
                metadata: {
                  name: resourceEntry.name,
                  type: resourceEntry.initiatorType,
                  size: resourceEntry.transferSize,
                },
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ Resource timing not supported');
    }
  }

  /**
   * Observe paint timing
   */
  private observePaintTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordMetric({
              name: `paint.${entry.name}`,
              value: entry.startTime,
              category: 'paint',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ Paint timing not supported');
    }
  }

  /**
   * Observe long tasks (>50ms)
   */
  private observeLongTasks(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'longtask',
            value: entry.duration,
            category: 'measure',
            metadata: {
              startTime: entry.startTime,
            },
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ Long task monitoring not supported');
    }
  }

  /**
   * Observe layout shifts (CLS)
   */
  private observeLayoutShifts(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            
            this.recordMetric({
              name: 'cls',
              value: clsValue,
              category: 'measure',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ Layout shift monitoring not supported');
    }
  }

  /**
   * Observe first input delay (FID)
   */
  private observeFirstInputDelay(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          
          this.recordMetric({
            name: 'fid',
            value: fidEntry.processingStart - fidEntry.startTime,
            category: 'measure',
          });
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[PerformanceMonitor] ⚠️ First input delay monitoring not supported');
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      ...metric,
    };

    this.metrics.push(fullMetric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.value > 1000) {
      console.warn(`[PerformanceMonitor] ⚠️ Slow operation: ${metric.name} (${metric.value.toFixed(2)}ms)`);
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    averages: Record<string, number>;
    slowOperations: PerformanceMetric[];
  } {
    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const metric of this.metrics) {
      if (!averages[metric.name]) {
        averages[metric.name] = 0;
        counts[metric.name] = 0;
      }
      averages[metric.name] += metric.value;
      counts[metric.name]++;
    }

    for (const name in averages) {
      averages[name] = averages[name] / counts[name];
    }

    const slowOperations = this.metrics
      .filter(m => m.value > 1000)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalMetrics: this.metrics.length,
      averages,
      slowOperations,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[PerformanceMonitor] 🗑️ Métricas limpiadas');
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    console.log('[PerformanceMonitor] 🛑 Monitoreo detenido');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize
if (typeof window !== 'undefined') {
  performanceMonitor.initialize();
}
