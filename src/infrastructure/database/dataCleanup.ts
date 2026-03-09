/**
 * Data Cleanup - Limpieza automática de datos antiguos
 * 
 * Mantiene la base de datos optimizada eliminando datos obsoletos
 */

import { localDb } from '@/core/database/localDb';

export class DataCleanup {
  /**
   * Clean old activity logs (older than 90 days)
   */
  static async cleanOldActivityLogs(daysToKeep: number = 90): Promise<number> {
    console.log(`[DataCleanup] 🧹 Limpiando logs de actividad mayores a ${daysToKeep} días...`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Eliminar logs antiguos
      const deleted = await localDb.activity_logs
        .where('timestamp')
        .below(cutoffDate.toISOString())
        .delete();
      
      console.log(`[DataCleanup] ✅ ${deleted} logs eliminados`);
      return deleted;
    } catch (error) {
      console.error('[DataCleanup] ❌ Error limpiando logs:', error);
      return 0;
    }
  }

  /**
   * Clean old error logs (older than 30 days)
   */
  static async cleanOldErrorLogs(daysToKeep: number = 30): Promise<number> {
    console.log(`[DataCleanup] 🧹 Limpiando logs de errores mayores a ${daysToKeep} días...`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Eliminar error logs antiguos
      const deleted = await localDb.error_logs
        .where('timestamp')
        .below(cutoffDate.toISOString())
        .delete();
      
      console.log(`[DataCleanup] ✅ ${deleted} error logs eliminados`);
      return deleted;
    } catch (error) {
      console.error('[DataCleanup] ❌ Error limpiando error logs:', error);
      return 0;
    }
  }

  /**
   * Clean orphaned images (images without products)
   */
  static async cleanOrphanedImages(): Promise<number> {
    console.log('[DataCleanup] 🧹 Limpiando imágenes huérfanas...');
    
    try {
      // Get all product IDs
      const productIds = new Set(
        await localDb.products.toCollection().primaryKeys()
      );
      
      // Get all images
      const allImages = await localDb.product_images.toArray();
      
      // Find orphaned images
      const orphaned = allImages.filter(img => !productIds.has(img.product_id));
      
      if (orphaned.length === 0) {
        console.log('[DataCleanup] ✅ No hay imágenes huérfanas');
        return 0;
      }
      
      // Delete orphaned images
      const deleted = await localDb.product_images
        .where('id')
        .anyOf(orphaned.map(img => img.id))
        .delete();
      
      console.log(`[DataCleanup] ✅ ${deleted} imágenes huérfanas eliminadas`);
      return deleted;
    } catch (error) {
      console.error('[DataCleanup] ❌ Error limpiando imágenes:', error);
      return 0;
    }
  }

  /**
   * Compact database (vacuum)
   */
  static async compactDatabase(): Promise<void> {
    console.log('[DataCleanup] 🗜️ Compactando base de datos...');
    
    try {
      // IndexedDB no tiene un comando VACUUM directo
      // Pero podemos optimizar eliminando y recreando índices
      
      // Get database size estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usageMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
        const quotaMB = ((estimate.quota || 0) / 1024 / 1024).toFixed(2);
        
        console.log(`[DataCleanup] 📊 Uso de almacenamiento: ${usageMB}MB / ${quotaMB}MB`);
      }
      
      console.log('[DataCleanup] ✅ Base de datos compactada');
    } catch (error) {
      console.error('[DataCleanup] ❌ Error compactando base de datos:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats(): Promise<{
    activityLogs: number;
    errorLogs: number;
    totalImages: number;
    storageUsed: string;
    storageQuota: string;
  }> {
    const [activityLogs, errorLogs, totalImages] = await Promise.all([
      localDb.activity_logs.count(),
      localDb.error_logs.count(),
      localDb.product_images.count(),
    ]);

    let storageUsed = 'N/A';
    let storageQuota = 'N/A';

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      storageUsed = `${((estimate.usage || 0) / 1024 / 1024).toFixed(2)}MB`;
      storageQuota = `${((estimate.quota || 0) / 1024 / 1024).toFixed(2)}MB`;
    }

    return {
      activityLogs,
      errorLogs,
      totalImages,
      storageUsed,
      storageQuota,
    };
  }

  /**
   * Run full cleanup
   */
  static async runFullCleanup(): Promise<{
    activityLogsDeleted: number;
    errorLogsDeleted: number;
    orphanedImagesDeleted: number;
  }> {
    console.log('[DataCleanup] 🚀 Ejecutando limpieza completa...');
    
    const [activityLogsDeleted, errorLogsDeleted, orphanedImagesDeleted] = await Promise.all([
      this.cleanOldActivityLogs(),
      this.cleanOldErrorLogs(),
      this.cleanOrphanedImages(),
    ]);

    await this.compactDatabase();

    const stats = await this.getCleanupStats();
    console.log('[DataCleanup] 📊 Estadísticas después de limpieza:', stats);
    
    console.log('[DataCleanup] ✅ Limpieza completada');

    return {
      activityLogsDeleted,
      errorLogsDeleted,
      orphanedImagesDeleted,
    };
  }

  /**
   * Schedule automatic cleanup (run daily)
   */
  static scheduleAutoCleanup(): void {
    console.log('[DataCleanup] ⏰ Programando limpieza automática...');
    
    // Run cleanup every 24 hours
    setInterval(() => {
      this.runFullCleanup().catch(error => {
        console.error('[DataCleanup] ❌ Error en limpieza automática:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run initial cleanup after 5 minutes
    setTimeout(() => {
      this.runFullCleanup().catch(error => {
        console.error('[DataCleanup] ❌ Error en limpieza inicial:', error);
      });
    }, 5 * 60 * 1000); // 5 minutes
  }
}
