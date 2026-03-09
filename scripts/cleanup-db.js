#!/usr/bin/env node

/**
 * Database Cleanup Script
 * 
 * Script para limpiar la base de datos manualmente
 * Uso: node scripts/cleanup-db.js
 */

console.log('🧹 Script de Limpieza de Base de Datos\n');
console.log('Este script debe ejecutarse desde el navegador, no desde Node.js\n');
console.log('Copia y pega el siguiente código en la consola del navegador:\n');
console.log('─────────────────────────────────────────────────────────────\n');

const browserScript = `
// Importar módulos necesarios
import { DataCleanup } from '@/infrastructure/database/dataCleanup';
import { IndexOptimizer } from '@/infrastructure/database/indexOptimizer';

console.log('🧹 Iniciando limpieza de base de datos...');

// Ejecutar limpieza completa
const result = await DataCleanup.runFullCleanup();

console.log('✅ Limpieza completada:');
console.log('  - Logs de actividad eliminados:', result.activityLogsDeleted);
console.log('  - Logs de errores eliminados:', result.errorLogsDeleted);
console.log('  - Imágenes huérfanas eliminadas:', result.orphanedImagesDeleted);

// Obtener estadísticas
const stats = await DataCleanup.getCleanupStats();

console.log('\\n📊 Estadísticas de la base de datos:');
console.log('  - Logs de actividad:', stats.activityLogs);
console.log('  - Logs de errores:', stats.errorLogs);
console.log('  - Imágenes totales:', stats.totalImages);
console.log('  - Almacenamiento usado:', stats.storageUsed);
console.log('  - Cuota disponible:', stats.storageQuota);

// Optimizar índices
console.log('\\n🔍 Optimizando índices...');
await IndexOptimizer.optimizeAll();

const indexStats = await IndexOptimizer.getIndexStats();

console.log('\\n📊 Estadísticas de índices:');
console.log('  - Productos:', indexStats.products);
console.log('  - Ventas:', indexStats.sales);
console.log('  - Clientes:', indexStats.clients);
console.log('  - Movimientos de inventario:', indexStats.inventory_movements);

console.log('\\n✅ Limpieza y optimización completadas');
`;

console.log(browserScript);
console.log('\n─────────────────────────────────────────────────────────────\n');
console.log('💡 Tip: También puedes ejecutar limpieza automática cada 24h');
console.log('   La limpieza automática ya está programada en el sistema\n');
