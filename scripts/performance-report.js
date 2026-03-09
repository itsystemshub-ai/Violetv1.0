#!/usr/bin/env node

/**
 * Performance Report Generator
 * 
 * Genera un reporte de performance del sistema
 * Uso: node scripts/performance-report.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 Generando reporte de performance...\n');

// Analizar tamaño de archivos en dist
function analyzeDistSize() {
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Carpeta dist no encontrada. Ejecuta "npm run build" primero.\n');
    return null;
  }

  const stats = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    otherSize: 0,
    files: []
  };

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        const size = stat.size;
        const ext = path.extname(file);
        
        stats.totalSize += size;
        stats.files.push({ name: file, size, path: filePath });
        
        if (ext === '.js') stats.jsSize += size;
        else if (ext === '.css') stats.cssSize += size;
        else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) stats.imageSize += size;
        else stats.otherSize += size;
      }
    });
  }

  walkDir(distPath);
  
  return stats;
}

// Formatear tamaño
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generar reporte
const stats = analyzeDistSize();

if (stats) {
  console.log('📦 Tamaño Total del Build');
  console.log('─────────────────────────');
  console.log(`Total:    ${formatSize(stats.totalSize)}`);
  console.log(`JS:       ${formatSize(stats.jsSize)} (${((stats.jsSize / stats.totalSize) * 100).toFixed(1)}%)`);
  console.log(`CSS:      ${formatSize(stats.cssSize)} (${((stats.cssSize / stats.totalSize) * 100).toFixed(1)}%)`);
  console.log(`Imágenes: ${formatSize(stats.imageSize)} (${((stats.imageSize / stats.totalSize) * 100).toFixed(1)}%)`);
  console.log(`Otros:    ${formatSize(stats.otherSize)} (${((stats.otherSize / stats.totalSize) * 100).toFixed(1)}%)`);
  console.log();

  // Top 10 archivos más grandes
  console.log('📊 Top 10 Archivos Más Grandes');
  console.log('─────────────────────────────────');
  
  const topFiles = stats.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
  
  topFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name.padEnd(40)} ${formatSize(file.size)}`);
  });
  console.log();

  // Recomendaciones
  console.log('💡 Recomendaciones');
  console.log('──────────────────');
  
  const largeFiles = stats.files.filter(f => f.size > 500 * 1024); // >500KB
  
  if (largeFiles.length > 0) {
    console.log(`⚠️  ${largeFiles.length} archivo(s) mayor(es) a 500KB detectado(s)`);
    console.log('   Considera usar code splitting o lazy loading');
  } else {
    console.log('✅ Todos los archivos tienen tamaño razonable');
  }
  
  if (stats.totalSize > 5 * 1024 * 1024) { // >5MB
    console.log('⚠️  Build total mayor a 5MB');
    console.log('   Considera optimizar assets o usar CDN');
  } else {
    console.log('✅ Tamaño total del build es aceptable');
  }
  
  console.log();
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    topFiles: topFiles.map(f => ({ name: f.name, size: f.size }))
  };
  
  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Reporte guardado en: ${reportPath}`);
  console.log();
}

console.log('✅ Reporte completado\n');
