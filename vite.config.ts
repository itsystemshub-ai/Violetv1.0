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
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Optimized manual chunking to reduce main bundle size
        manualChunks: (id) => {
          // Vendor chunks - separate large libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Data management
            if (id.includes('zustand') || id.includes('@tanstack') || id.includes('dexie')) {
              return 'vendor-data';
            }
            // Utilities
            if (id.includes('date-fns') || id.includes('lodash') || id.includes('xlsx')) {
              return 'vendor-utils';
            }
            // Everything else
            return 'vendor-misc';
          }
          
          // Application chunks - combine sales and inventory to avoid circular deps
          if (id.includes('/src/modules/')) {
            // Combine sales and inventory (they share dependencies)
            if (id.includes('/modules/inventory/') || id.includes('/modules/sales/')) {
              return 'app-sales-inventory';
            }
            if (id.includes('/modules/finance/')) return 'app-finance';
            if (id.includes('/modules/hr/')) return 'app-hr';
            if (id.includes('/modules/purchases/')) return 'app-purchases';
            if (id.includes('/modules/settings/')) return 'app-settings';
            if (id.includes('/modules/ai/')) return 'app-ai';
          }
          
          // Core and shared utilities
          if (id.includes('/src/core/')) return 'app-core';
          if (id.includes('/src/shared/')) return 'app-shared';
        },
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
