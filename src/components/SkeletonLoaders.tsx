/**
 * Skeleton Loaders
 * Componentes de carga para mejorar la percepción de velocidad
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton base con animación de pulso
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      className={`bg-muted/50 rounded animate-pulse ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

/**
 * Skeleton para ProductCard en vista de galería
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
      {/* Image skeleton */}
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        <Skeleton className="w-full h-full" />
        
        {/* Badges skeleton */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Skeleton className="w-16 h-5 rounded" />
          <Skeleton className="w-20 h-5 rounded" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-1">
        <Skeleton className="w-24 h-4 mb-2 rounded" />
        <Skeleton className="w-full h-4 mb-2 rounded" />
        <Skeleton className="w-3/4 h-4 mb-4 rounded" />
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-16 h-3 rounded" />
            <Skeleton className="w-20 h-6 rounded" />
          </div>
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para ProductRow en vista de lista
 */
export const ProductRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 bg-card border border-border/40 rounded-2xl p-2 pr-6 shadow-sm">
      {/* Thumbnail skeleton */}
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />

      {/* Main info skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-4 rounded" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
        <Skeleton className="w-3/4 h-4 rounded" />
      </div>

      {/* Price skeleton */}
      <div className="text-right px-6 space-y-2">
        <Skeleton className="w-16 h-3 rounded ml-auto" />
        <Skeleton className="w-20 h-5 rounded ml-auto" />
      </div>

      {/* Action skeleton */}
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  );
};

/**
 * Skeleton para tabla de facturas
 */
export const InvoiceRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/40">
      <Skeleton className="w-24 h-5 rounded" />
      <Skeleton className="w-32 h-5 rounded" />
      <Skeleton className="w-28 h-5 rounded" />
      <Skeleton className="w-24 h-5 rounded" />
      <Skeleton className="w-20 h-6 rounded" />
      <Skeleton className="w-16 h-8 rounded ml-auto" />
    </div>
  );
};

/**
 * Skeleton para tabla de empleados
 */
export const EmployeeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-32 h-5 rounded" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="w-full h-4 rounded" />
        <Skeleton className="w-3/4 h-4 rounded" />
        <Skeleton className="w-1/2 h-4 rounded" />
      </div>

      <div className="flex gap-2 mt-4">
        <Skeleton className="flex-1 h-9 rounded" />
        <Skeleton className="flex-1 h-9 rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton para Dashboard cards
 */
export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-5 rounded" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      
      <Skeleton className="w-24 h-8 rounded mb-2" />
      <Skeleton className="w-40 h-4 rounded" />
    </div>
  );
};

/**
 * Skeleton para gráficos
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
      <Skeleton className="w-48 h-6 rounded mb-6" />
      
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton 
              className="h-8 rounded" 
              style={{ width: `${Math.random() * 60 + 40}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton para tabla genérica
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 5 
}) => {
  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/40 bg-muted/20">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="flex-1 h-5 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 p-4 border-b border-border/40">
          {[...Array(cols)].map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-5 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Grid de skeletons para productos
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Lista de skeletons para productos
 */
export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <ProductRowSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Indicador de búsqueda
 */
export const SearchingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-primary rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
      <span className="text-sm text-muted-foreground ml-2">Buscando...</span>
    </div>
  );
};

/**
 * Skeleton para página completa
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-8 rounded" />
        <Skeleton className="w-32 h-10 rounded" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
};
