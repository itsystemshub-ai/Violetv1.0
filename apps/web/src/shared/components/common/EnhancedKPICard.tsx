import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedKPICardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
}

/**
 * Enhanced KPI Card - Diseñado con UI/UX Pro Max
 * 
 * Características:
 * - Data-Dense Dashboard style
 * - Hover tooltips con información adicional
 * - Smooth transitions (200ms)
 * - Metric pulse animation
 * - Accesibilidad WCAG AA
 * - Responsive design
 */
export function EnhancedKPICard({
  label,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  description,
  loading = false,
}: EnhancedKPICardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return (
    <div
      className={cn(
        // Base styles - Data-Dense Dashboard
        'relative overflow-hidden',
        'bg-background rounded-xl',
        'p-6',
        'shadow-md',
        
        // Hover effects - Smooth transitions
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        'cursor-pointer',
        
        // Focus states for accessibility
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        
        // Loading state
        loading && 'animate-pulse'
      )}
      role="article"
      aria-label={`${label}: ${value}`}
      tabIndex={0}
    >
      {/* Pulse animation background for metrics */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent',
          'animate-metric-pulse'
        )}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text-muted font-body">
            {label}
          </span>
          
          {/* Icon with hover effect */}
          <div 
            className={cn(
              'p-2 rounded-lg',
              'bg-primary/10',
              'transition-all duration-200',
              'hover:bg-primary/20 hover:scale-105'
            )}
          >
            <Icon 
              className="h-5 w-5 text-primary" 
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Value with smooth stat reveal */}
        <div className="mb-2">
          <p 
            className={cn(
              'text-3xl font-bold text-text font-heading',
              'animate-stat-reveal'
            )}
          >
            {loading ? '---' : value}
          </p>
        </div>
        
        {/* Change indicator */}
        {change !== undefined && !loading && (
          <div className="flex items-center gap-2">
            {/* Trend indicator */}
            <div
              className={cn(
                'flex items-center gap-1',
                'px-2 py-1 rounded-full',
                'text-xs font-semibold font-body',
                'transition-all duration-200',
                
                // Badge hover effect
                'hover:scale-105',
                
                // Color based on trend
                {
                  'bg-green-100 text-green-700': isPositive,
                  'bg-red-100 text-red-700': isNegative,
                  'bg-gray-100 text-gray-700': trend === 'neutral',
                }
              )}
            >
              {/* Arrow indicator */}
              <span aria-hidden="true">
                {isPositive && '↑'}
                {isNegative && '↓'}
                {trend === 'neutral' && '→'}
              </span>
              
              {/* Change percentage */}
              <span>{Math.abs(change)}%</span>
            </div>
            
            {/* Description text */}
            <span className="text-xs text-text-muted font-body">
              vs mes anterior
            </span>
          </div>
        )}
        
        {/* Optional description tooltip */}
        {description && (
          <div 
            className={cn(
              'mt-3 pt-3 border-t border-gray-200',
              'text-xs text-text-muted font-body'
            )}
          >
            {description}
          </div>
        )}
      </div>
      
      {/* Loading spinner */}
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-background/80"
          role="status"
          aria-label="Cargando datos"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}

// Export default for backward compatibility
export default EnhancedKPICard;
