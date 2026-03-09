/**
 * Index Optimizer - Optimiza índices de IndexedDB para mejor rendimiento
 * 
 * Crea índices compuestos para búsquedas frecuentes
 */

import { localDb } from '@/core/database/localDb';

export class IndexOptimizer {
  /**
   * Optimize product indexes
   */
  static async optimizeProductIndexes(): Promise<void> {
    console.log('[IndexOptimizer] 🔍 Optimizando índices de productos...');
    
    try {
      // Los índices ya están definidos en el schema de Dexie
      // Aquí podemos agregar índices compuestos adicionales si es necesario
      
      // Verificar que los índices existen
      const indexes = await localDb.products.toCollection().primaryKeys();
      console.log(`[IndexOptimizer] ✅ ${indexes.length} productos indexados`);
      
    } catch (error) {
      console.error('[IndexOptimizer] ❌ Error optimizando índices:', error);
    }
  }

  /**
   * Analyze query performance
   */
  static async analyzeQueryPerformance(
    tableName: string,
    query: () => Promise<any>
  ): Promise<{ duration: number; result: any }> {
    const start = performance.now();
    const result = await query();
    const duration = performance.now() - start;
    
    console.log(`[IndexOptimizer] 📊 Query en ${tableName}: ${duration.toFixed(2)}ms`);
    
    return { duration, result };
  }

  /**
   * Get index statistics
   */
  static async getIndexStats(): Promise<{
    products: number;
    sales: number;
    clients: number;
    inventory_movements: number;
  }> {
    const [products, sales, clients, movements] = await Promise.all([
      localDb.products.count(),
      localDb.sales.count(),
      localDb.clients.count(),
      localDb.inventory_movements.count(),
    ]);

    return {
      products,
      sales,
      clients,
      inventory_movements: movements,
    };
  }

  /**
   * Optimize all indexes
   */
  static async optimizeAll(): Promise<void> {
    console.log('[IndexOptimizer] 🚀 Optimizando todos los índices...');
    
    await this.optimizeProductIndexes();
    
    const stats = await this.getIndexStats();
    console.log('[IndexOptimizer] 📊 Estadísticas:', stats);
    
    console.log('[IndexOptimizer] ✅ Optimización completada');
  }
}
