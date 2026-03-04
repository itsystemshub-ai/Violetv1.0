import { LucideIcon, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStockCardProps {
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  icon?: LucideIcon;
  location?: string;
  lastUpdated?: Date;
  onClick?: () => void;
}

/**
 * Enhanced Stock Card - Diseñado con UI/UX Pro Max
 * 
 * Estilo: Vibrant & Block-based
 * - Bold, energetic, playful
 * - Block layout con geometric shapes
 * - High color contrast
 * - Purple + Orange color scheme
 */
export function EnhancedStockCard({
  productName,
  sku,
  currentStock,
  minStock,
  maxStock,
  icon: Icon,
  location,
  lastUpdated,
  onClick,
}: EnhancedStockCardProps) {
  const isClickable = !!onClick;
  
  // Calculate stock status
  const stockPercentage = maxStock 
    ? (currentStock / maxStock) * 100 
    : (currentStock / minStock) * 100;
  
  const isLowStock = currentStock <= minStock;
  const isCritical = currentStock < minStock * 0.5;
  const isHealthy = currentStock > minStock * 1.5;
  
  const getStockStatus = () => {
    if (isCritical) return { label: 'Crítico', color: 'red' };
    if (isLowStock) return { label: 'Bajo', color: 'yellow' };
    if (isHealthy) return { label: 'Óptimo', color: 'green' };
    return { label: 'Normal', color: 'blue' };
  };
  
  const status = getStockStatus();
  
  return (
    <article
      className={cn(
        // Base styles - Vibrant & Block-based
        'relative overflow-hidden',
        'bg-white rounded-2xl',
        'p-6',
        
        // Border - Bold color
        'border-2',
        {
          'border-red-300': status.color === 'red',
          'border-yellow-300': status.color === 'yellow',
          'border-green-300': status.color === 'green',
          'border-blue-300': status.color === 'blue',
        },
        
        // Shadow
        'shadow-md',
        
        // Hover effects - Bold hover with color shift
        'transition-all duration-300',
        isClickable && [
          'cursor-pointer',
          'hover:shadow-xl',
          'hover:-translate-y-1',
          'hover:scale-[1.02]',
        ],
        
        // Focus states
        'focus-within:ring-4 focus-within:ring-primary/30',
      )}
      onClick={onClick}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${productName}: ${currentStock} unidades en stock`}
    >
      {/* Animated pattern background */}
      <div 
        className={cn(
          'absolute top-0 right-0 w-32 h-32',
          'opacity-10',
          'transition-transform duration-500',
          isClickable && 'group-hover:scale-110 group-hover:rotate-12'
        )}
        aria-hidden="true"
      >
        <div className={cn(
          'w-full h-full rounded-full',
          {
            'bg-red-500': status.color === 'red',
            'bg-yellow-500': status.color === 'yellow',
            'bg-green-500': status.color === 'green',
            'bg-blue-500': status.color === 'blue',
          }
        )} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {/* Status badge - Bold */}
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  'px-3 py-1 rounded-full',
                  'text-xs font-bold uppercase tracking-wider',
                  'transition-all duration-200',
                  'hover:scale-105',
                  {
                    'bg-red-100 text-red-700': status.color === 'red',
                    'bg-yellow-100 text-yellow-700': status.color === 'yellow',
                    'bg-green-100 text-green-700': status.color === 'green',
                    'bg-blue-100 text-blue-700': status.color === 'blue',
                  }
                )}
              >
                {isCritical && <AlertTriangle className="h-3 w-3" />}
                {status.label}
              </span>
              
              {/* SKU */}
              <span className="text-xs text-slate-500 font-mono">
                {sku}
              </span>
            </div>
            
            {/* Product name - Large type */}
            <h3 className="text-xl font-bold text-slate-900 font-heading mb-1">
              {productName}
            </h3>
            
            {/* Location */}
            {location && (
              <p className="text-sm text-slate-600 font-body">
                📍 {location}
              </p>
            )}
          </div>
          
          {/* Icon */}
          {Icon && (
            <div 
              className={cn(
                'p-3 rounded-xl',
                'transition-all duration-300',
                {
                  'bg-red-100': status.color === 'red',
                  'bg-yellow-100': status.color === 'yellow',
                  'bg-green-100': status.color === 'green',
                  'bg-blue-100': status.color === 'blue',
                },
                isClickable && 'group-hover:scale-110 group-hover:rotate-6'
              )}
            >
              <Icon 
                className={cn(
                  'h-6 w-6',
                  {
                    'text-red-700': status.color === 'red',
                    'text-yellow-700': status.color === 'yellow',
                    'text-green-700': status.color === 'green',
                    'text-blue-700': status.color === 'blue',
                  }
                )}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        
        {/* Stock info - Bold sections */}
        <div className="space-y-3">
          {/* Current stock - Oversized */}
          <div>
            <p className="text-sm text-slate-600 font-body mb-1">
              Stock Actual
            </p>
            <p className="text-4xl font-bold text-slate-900 font-heading">
              {currentStock.toLocaleString()}
              <span className="text-lg text-slate-500 ml-2">unidades</span>
            </p>
          </div>
          
          {/* Stock bar - Geometric shape */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-body">
              <span>Mínimo: {minStock}</span>
              {maxStock && <span>Máximo: {maxStock}</span>}
            </div>
            
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0',
                  'rounded-full',
                  'transition-all duration-500',
                  {
                    'bg-red-500': status.color === 'red',
                    'bg-yellow-500': status.color === 'yellow',
                    'bg-green-500': status.color === 'green',
                    'bg-blue-500': status.color === 'blue',
                  }
                )}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                role="progressbar"
                aria-valuenow={currentStock}
                aria-valuemin={0}
                aria-valuemax={maxStock || minStock * 2}
              />
            </div>
          </div>
          
          {/* Trend indicator */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            {currentStock > minStock ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-slate-600 font-body">
              {currentStock > minStock 
                ? `${currentStock - minStock} sobre el mínimo`
                : `${minStock - currentStock} bajo el mínimo`
              }
            </span>
          </div>
          
          {/* Last updated */}
          {lastUpdated && (
            <p className="text-xs text-slate-500 font-body">
              Actualizado: {lastUpdated.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>
      
      {/* Hover indicator - Bold */}
      {isClickable && (
        <div 
          className={cn(
            'absolute bottom-0 left-0 right-0 h-2',
            'transform scale-x-0 transition-transform duration-300',
            'group-hover:scale-x-100',
            {
              'bg-red-500': status.color === 'red',
              'bg-yellow-500': status.color === 'yellow',
              'bg-green-500': status.color === 'green',
              'bg-blue-500': status.color === 'blue',
            }
          )}
          aria-hidden="true"
        />
      )}
    </article>
  );
}

export default EnhancedStockCard;
