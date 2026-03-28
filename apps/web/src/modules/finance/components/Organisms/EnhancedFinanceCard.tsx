import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedFinanceCardProps {
  title: string;
  amount: number;
  currency?: string;
  trend?: {
    value: number;
    period: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  description?: string;
  onClick?: () => void;
}

/**
 * Enhanced Finance Card - Diseñado con UI/UX Pro Max
 * 
 * Estilo: Exaggerated Minimalism
 * - Bold minimalism con oversized typography
 * - High contrast para claridad financiera
 * - Trust & Authority pattern
 * - Navy + Gold color scheme
 */
export function EnhancedFinanceCard({
  title,
  amount,
  currency = '$',
  trend,
  icon: Icon,
  variant = 'default',
  description,
  onClick,
}: EnhancedFinanceCardProps) {
  const isClickable = !!onClick;
  
  return (
    <article
      className={cn(
        // Base styles - Exaggerated Minimalism
        'relative overflow-hidden',
        'bg-white rounded-2xl',
        'p-8',
        'border-2',
        
        // Border colors by variant
        {
          'border-slate-200': variant === 'default',
          'border-green-200': variant === 'success',
          'border-yellow-200': variant === 'warning',
          'border-red-200': variant === 'danger',
        },
        
        // Shadow - Trust & Authority
        'shadow-lg',
        
        // Hover effects - Bold hover
        'transition-all duration-300',
        isClickable && [
          'cursor-pointer',
          'hover:shadow-2xl',
          'hover:-translate-y-2',
          'hover:border-primary',
        ],
        
        // Focus states
        'focus-within:ring-4 focus-within:ring-primary/20',
      )}
      onClick={onClick}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`${title}: ${currency}${amount.toLocaleString()}`}
    >
      {/* Background gradient - Subtle */}
      <div 
        className={cn(
          'absolute inset-0 opacity-5',
          'bg-gradient-to-br',
          {
            'from-slate-500 to-transparent': variant === 'default',
            'from-green-500 to-transparent': variant === 'success',
            'from-yellow-500 to-transparent': variant === 'warning',
            'from-red-500 to-transparent': variant === 'danger',
          }
        )}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-2 font-body">
              {title}
            </h3>
            
            {/* Amount - Oversized typography */}
            <p 
              className={cn(
                'text-5xl font-bold font-heading',
                'tracking-tight',
                'transition-colors duration-300',
                {
                  'text-slate-900': variant === 'default',
                  'text-green-700': variant === 'success',
                  'text-yellow-700': variant === 'warning',
                  'text-red-700': variant === 'danger',
                }
              )}
            >
              {currency}{amount.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          
          {/* Icon - Premium gold accent */}
          <div 
            className={cn(
              'p-4 rounded-xl',
              'transition-all duration-300',
              {
                'bg-slate-100': variant === 'default',
                'bg-green-100': variant === 'success',
                'bg-yellow-100': variant === 'warning',
                'bg-red-100': variant === 'danger',
              },
              isClickable && 'group-hover:scale-110'
            )}
          >
            <Icon 
              className={cn(
                'h-8 w-8',
                {
                  'text-slate-700': variant === 'default',
                  'text-green-700': variant === 'success',
                  'text-yellow-700': variant === 'warning',
                  'text-red-700': variant === 'danger',
                }
              )}
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                'flex items-center gap-2',
                'px-3 py-1.5 rounded-full',
                'text-sm font-semibold font-body',
                'transition-all duration-200',
                {
                  'bg-green-100 text-green-700': trend.value > 0,
                  'bg-red-100 text-red-700': trend.value < 0,
                  'bg-slate-100 text-slate-700': trend.value === 0,
                }
              )}
            >
              <span aria-hidden="true">
                {trend.value > 0 && '↑'}
                {trend.value < 0 && '↓'}
                {trend.value === 0 && '→'}
              </span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-sm text-slate-600 font-body">
              {trend.period}
            </span>
          </div>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600 font-body leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      {/* Hover indicator */}
      {isClickable && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
          aria-hidden="true"
        />
      )}
    </article>
  );
}

export default EnhancedFinanceCard;
