#!/usr/bin/env node

/**
 * Bundle Analyzer
 * 
 * Analiza el bundle de producción y genera recomendaciones
 * Uso: node scripts/analyze-bundle.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Analizando bundle de producción...\n');

const distPath = path.join(__dirname, '../dist/assets/js');

if (!fs.existsSync(distPath)) {
  console.log('❌ Carpeta dist/assets/js no encontrada');
  console.log('   Ejecuta "npm run build" primero\n');
  process.exit(1);
}

// Leer todos los archivos JS
const files = fs.readdirSync(distPath)
  .filter(f => f.endsWith('.js'))
  .map(f => {
    const filePath = path.join(distPath, f);
    const stats = fs.statSync(filePath);
    return {
      name: f,
      size: stats.size,
      type: getFileType(f)
    };
  })
  .sort((a, b) => b.size - a.size);

function getFileType(filename) {
  if (filename.includes('vendor-react')) return 'vendor-react';
  if (filename.includes('vendor-')) return 'vendor';
  if (filename.includes('app-')) return 'app';
  if (filename.includes('index-')) return 'entry';
  return 'page';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Agrupar por tipo
const byType = files.reduce((acc, file) => {
  if (!acc[file.type]) acc[file.type] = [];
  acc[file.type].push(file);
  return acc;
}, {});

// Calcular totales
const totalSize = files.reduce((sum, f) => sum + f.size, 0);

console.log('📊 Resumen del Bundle');
console.log('─────────────────────');
console.log(`Total de archivos: ${files.length}`);
console.log(`Tamaño total: ${formatSize(totalSize)}`);
console.log();

// Mostrar por tipo
console.log('📦 Por Tipo de Chunk');
console.log('────────────────────');

Object.entries(byType).forEach(([type, typeFiles]) => {
  const typeSize = typeFiles.reduce((sum, f) => sum + f.size, 0);
  const percentage = ((typeSize / totalSize) * 100).toFixed(1);
  console.log(`\n${type.toUpperCase()}: ${formatSize(typeSize)} (${percentage}%)`);
  
  typeFiles.slice(0, 5).forEach(file => {
    console.log(`  - ${file.name.substring(0, 50).padEnd(50)} ${formatSize(file.size)}`);
  });
  
  if (typeFiles.length > 5) {
    console.log(`  ... y ${typeFiles.length - 5} más`);
  }
});

console.log();

// Análisis y recomendaciones
console.log('💡 Análisis y Recomendaciones');
console.log('─────────────────────────────');

const largeFiles = files.filter(f => f.size > 1024 * 1024); // >1MB
const mediumFiles = files.filter(f => f.size > 500 * 1024 && f.size <= 1024 * 1024); // 500KB-1MB

if (largeFiles.length > 0) {
  console.log(`\n⚠️  ${largeFiles.length} archivo(s) mayor(es) a 1MB:`);
  largeFiles.forEach(f => {
    console.log(`   - ${f.name}: ${formatSize(f.size)}`);
  });
  console.log('   Recomendación: Considera dividir estos chunks o usar lazy loading');
}

if (mediumFiles.length > 5) {
  console.log(`\n⚠️  ${mediumFiles.length} archivos entre 500KB y 1MB`);
  console.log('   Recomendación: Revisa si algunos pueden combinarse o dividirse');
}

// Verificar vendor chunks
const vendorReact = files.find(f => f.name.includes('vendor-react'));
if (vendorReact && vendorReact.size > 1.5 * 1024 * 1024) {
  console.log('\n⚠️  vendor-react es muy grande');
  console.log('   Recomendación: Considera usar preact o reducir dependencias de React');
}

// Verificar app chunks
const appChunks = files.filter(f => f.type === 'app');
const largeAppChunks = appChunks.filter(f => f.size > 500 * 1024);

if (largeAppChunks.length > 0) {
  console.log(`\n⚠️  ${largeAppChunks.length} app chunk(s) mayor(es) a 500KB:`);
  largeAppChunks.forEach(f => {
    console.log(`   - ${f.name}: ${formatSize(f.size)}`);
  });
  console.log('   Recomendación: Divide estos módulos en chunks más pequeños');
}

// Verificar total
if (totalSize > 5 * 1024 * 1024) {
  console.log('\n⚠️  Bundle total mayor a 5MB');
  console.log('   Recomendación: Considera usar CDN o tree-shaking más agresivo');
} else if (totalSize > 3 * 1024 * 1024) {
  console.log('\n✅ Bundle total aceptable pero puede mejorarse');
} else {
  console.log('\n✅ Bundle total en tamaño óptimo');
}

// Estimación de tiempo de carga
const estimatedLoadTime3G = (totalSize / (750 * 1024)) * 1000; // 750 KB/s
const estimatedLoadTime4G = (totalSize / (3 * 1024 * 1024)) * 1000; // 3 MB/s

console.log('\n⏱️  Tiempo de Carga Estimado');
console.log('───────────────────────────');
console.log(`3G: ${estimatedLoadTime3G.toFixed(2)}ms`);
console.log(`4G: ${estimatedLoadTime4G.toFixed(2)}ms`);

if (estimatedLoadTime3G > 5000) {
  console.log('⚠️  Tiempo de carga en 3G mayor a 5 segundos');
  console.log('   Considera optimizar para usuarios con conexión lenta');
}

console.log();

// Guardar reporte
const report = {
  timestamp: new Date().toISOString(),
  totalFiles: files.length,
  totalSize,
  byType,
  largeFiles: largeFiles.map(f => ({ name: f.name, size: f.size })),
  estimatedLoadTime: {
    '3G': estimatedLoadTime3G,
    '4G': estimatedLoadTime4G
  }
};

const reportPath = path.join(__dirname, '../bundle-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`📄 Reporte guardado en: ${reportPath}`);
console.log('✅ Análisis completado\n');
