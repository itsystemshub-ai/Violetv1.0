import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@features': path.resolve(__dirname, './src/features'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@config': path.resolve(__dirname, './src/config'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    }
  },
  server: {
    port: 8080,
    strictPort: true,
    host: true, // Allow external connections
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - Core libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Query and state management
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'vendor-state';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'vendor-charts';
            }
            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'vendor-forms';
            }
            // Other vendors
            return 'vendor-misc';
          }

          // Feature-based chunks
          if (id.includes('/src/features/dashboard')) {
            return 'feature-dashboard';
          }
          if (id.includes('/src/features/finance') || id.includes('/src/modules/finance')) {
            return 'feature-finance';
          }
          if (id.includes('/src/features/inventory') || id.includes('/src/modules/inventory')) {
            return 'feature-inventory';
          }
          if (id.includes('/src/features/sales') || id.includes('/src/modules/sales')) {
            return 'feature-sales';
          }
          if (id.includes('/src/features/purchases') || id.includes('/src/modules/purchases')) {
            return 'feature-purchases';
          }
          if (id.includes('/src/features/hr') || id.includes('/src/modules/hr')) {
            return 'feature-hr';
          }
          if (id.includes('/src/modules/settings')) {
            return 'feature-settings';
          }

          // Core chunks
          if (id.includes('/src/core')) {
            return 'core';
          }
          if (id.includes('/src/shared')) {
            return 'shared';
          }
        },
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
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
