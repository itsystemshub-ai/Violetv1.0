import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@config': path.resolve(__dirname, './src/config'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Allow external connections
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunk size
    rollupOptions: {
      output: {
        // Let Rollup handle all code splitting automatically (no manualChunks)
        // Manual chunking was causing circular dependency issues in production
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      }
    },
    chunkSizeWarningLimit: 1000,
    // Minification options
    minify: 'esbuild',
    target: 'es2020',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
