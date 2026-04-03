# Módulo 09: UI/UX - Sistema de Diseño Premium

## Descripción

Sistema de diseño UI/UX premium para ERP ZENITH con tipografía League Spartan, componentes avanzados, temas personalizables, y funciones de IA para sugerencias inteligentes y generación de datos.

---

## 🎨 Identidad Visual

### Tipografía Principal

```css
/* League Spartan - Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@100;200;300;400;500;600;700;800;900&display=swap');

:root {
  --font-primary: 'League Spartan', sans-serif;
  --font-mono: 'JetBrains Mono', monospace; /* Para código */
}

/* Pesos disponibles */
.font-thin { font-weight: 100; }
.font-extralight { font-weight: 200; }
.font-light { font-weight: 300; }
.font-regular { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }
```

### Paleta de Colores Premium

```typescript
// lib/theme/colors.ts

export const colors = {
  // ─── COLORES PRIMARIOS ─────────────────────────────────────────────────────
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Color principal
    600: '#4F46E5', // Hover
    700: '#4338CA', // Active
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },
  
  // ─── COLORES DE ESTADO ─────────────────────────────────────────────────────
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  
  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },
  
  // ─── COLORES NEUTROS ───────────────────────────────────────────────────────
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  
  // ─── COLORES POR MÓDULO ────────────────────────────────────────────────────
  module: {
    administrativo: '#2563EB',   // Azul
    operativo: '#16A34A',         // Verde
    comercial: '#DB2777',         // Rosa
    rrhh: '#C026D3',              // Fucsia
    configuracion: '#64748B',     // Slate
    reportes: '#EA580C',          // Naranja
  },
};

// ─── GRADIENTES PREMIUM ──────────────────────────────────────────────────────
export const gradients = {
  primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  sunset: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  ocean: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
  aurora: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
};

// ─── SOMBRAS PREMIUM ─────────────────────────────────────────────────────────
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(99, 102, 241, 0.5)',
  'glow-success': '0 0 20px rgba(16, 185, 129, 0.5)',
  'glow-danger': '0 0 20px rgba(239, 68, 68, 0.5)',
};
```

---

## 🧩 Componentes Premium

### 1. Tarjetas con Efectos Glassmorphism

```tsx
// components/ui/glass-card.tsx

'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'dark' | 'light' | 'blur';
  gradient?: boolean;
  hover?: boolean;
  children: React.ReactNode;
}

export function GlassCard({
  variant = 'default',
  gradient = false,
  hover = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/80 backdrop-blur-xl border border-white/20',
    dark: 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/30',
    light: 'bg-white/90 backdrop-blur-xl border border-white/40',
    blur: 'bg-white/10 backdrop-blur-2xl border border-white/10',
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        gradient && 'bg-gradient-to-br from-primary-500/10 to-purple-500/10',
        hover && 'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1',
        className
      )}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

### 2. Botones con Animaciones Avanzadas

```tsx
// components/ui/animated-button.tsx

'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  children,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white',
    ghost: 'text-primary-600 hover:bg-primary-50',
    gradient: 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:shadow-xl hover:shadow-primary-500/40',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'relative font-medium rounded-xl transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple Effect */}
      <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-100" />
      
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </motion.button>
  );
}
```

### 3. Tablas Inteligentes con IA

```tsx
// components/ui/smart-table.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Search, ChevronUp, ChevronDown, Download, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { GlassCard } from './glass-card';
import { AnimatedButton } from './animated-button';
import { AISuggestion } from './ai-suggestion';

interface SmartTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  endpoint?: string; // Para cargar datos automáticamente
  searchable?: boolean;
  exportable?: boolean;
  aiInsights?: boolean; // Mostrar sugerencias de IA
  pageSize?: number;
}

export function SmartTable<T>({
  columns,
  data,
  endpoint,
  searchable = true,
  exportable = true,
  aiInsights = true,
  pageSize = 20,
}: SmartTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Cargar datos si hay endpoint
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get(endpoint!).then(r => r.data),
    enabled: !!endpoint,
  });

  const tableData = endpoint ? fetchedData : data;

  // Obtener insights de IA
  const { data: insights } = useQuery({
    queryKey: ['table-insights', endpoint],
    queryFn: () => api.post('/ia/table-insights', { data: tableData }).then(r => r.data),
    enabled: aiInsights && !!tableData,
  });

  const table = useReactTable({
    data: tableData || [],
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const exportToExcel = () => {
    // Implementar exportación
  };

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y acciones */}
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {aiInsights && insights && (
            <AISuggestion insights={insights} />
          )}
          
          {exportable && (
            <AnimatedButton
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={exportToExcel}
            >
              Exportar
            </AnimatedButton>
          )}
        </div>
      </div>

      {/* Insights de IA */}
      <AnimatePresence>
        {aiInsights && insights?.suggestions?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard variant="blur" className="bg-gradient-to-r from-primary-500/10 to-purple-500/10">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-primary-900 mb-2">Insights de IA</h4>
                  <div className="space-y-2">
                    {insights.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {suggestion.type === 'alert' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">{suggestion.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-primary-500 to-purple-500 text-white">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No se encontraron resultados</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-100 hover:bg-primary-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Mostrando {table.getRowModel().rows.length} de {tableData?.length || 0} resultados
        </p>
        
        <div className="flex items-center gap-2">
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </AnimatedButton>
          
          <span className="text-sm text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
```

### 4. Componente de Sugerencias de IA

```tsx
// components/ui/ai-suggestion.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { GlassCard } from './glass-card';
import { AnimatedButton } from './animated-button';
import { useState } from 'react';

interface AISuggestionProps {
  insights: {
    suggestions?: Array<{
      type: 'alert' | 'opportunity' | 'trend' | 'success';
      message: string;
      action?: string;
      priority?: 'high' | 'medium' | 'low';
      data?: any;
    }>;
    summary?: string;
  };
  onClose?: () => void;
}

const icons = {
  alert: AlertTriangle,
  opportunity: Lightbulb,
  trend: TrendingUp,
  success: CheckCircle,
};

const colors = {
  alert: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  opportunity: 'from-primary-500/20 to-purple-500/20 border-primary-500/30',
  trend: 'from-success-500/20 to-emerald-500/20 border-success-500/30',
  success: 'from-success-500/20 to-green-500/20 border-success-500/30',
};

export function AISuggestion({ insights, onClose }: AISuggestionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!insights?.suggestions?.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <GlassCard
          variant="blur"
          className={cn(
            'relative overflow-hidden',
            'bg-gradient-to-r border',
            colors[insights.suggestions[0].type]
          )}
        >
          {/* Icono decorativa */}
          <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/5" />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  {(() => {
                    const Icon = icons[insights.suggestions[0].type];
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <h4 className="font-semibold text-white">
                  {insights.summary || 'Sugerencias de IA'}
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-white hover:bg-white/20"
                >
                  {expanded ? 'Ver menos' : 'Ver más'}
                </AnimatedButton
                
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Sugerencias */}
            <div className="space-y-2">
              {insights.suggestions.slice(0, expanded ? insights.suggestions.length : 3).map((suggestion, index) => {
                const Icon = icons[suggestion.type];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                  >
                    <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white text-sm">{suggestion.message}</p>
                      {suggestion.action && (
                        <AnimatedButton
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-white hover:bg-white/20 h-auto py-1"
                        >
                          {suggestion.action}
                        </AnimatedButton>
                      )}
                    </div>
                    {suggestion.priority && (
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        suggestion.priority === 'high' && 'bg-red-500/30 text-red-100',
                        suggestion.priority === 'medium' && 'bg-amber-500/30 text-amber-100',
                        suggestion.priority === 'low' && 'bg-green-500/30 text-green-100'
                      )}>
                        {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
```

### 5. Dashboard con Gráficos Animados

```tsx
// components/dashboard/kpi-card.tsx

'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from '../ui/glass-card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  gradient?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  gradient = 'from-primary-500 to-purple-500',
  delay = 0,
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <GlassCard gradient className="relative overflow-hidden">
        {/* Background Icon */}
        <div className="absolute -right-6 -bottom-6 opacity-10">
          {icon && (
            <div className="w-32 h-32">
              {icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {icon && (
              <div className={cn(
                'p-2 rounded-lg bg-gradient-to-br text-white',
                gradient
              )}>
                {icon}
              </div>
            )}
          </div>

          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>

          {change !== undefined && (
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success-600" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4 text-danger-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={cn(
                'text-sm font-medium',
                isPositive && 'text-success-600',
                isNegative && 'text-danger-600'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
```

---

## 🤖 Funciones de IA para UI

### 1. Generador de Datos de Ejemplo

```typescript
// lib/ai/mock-data-generator.ts

import { faker } from '@faker-js/faker';

export class MockDataGenerator {
  // Generar ventas aleatorias
  static generateVentas(count: number = 50) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      numero: `V-${faker.number.int({ min: 100000, max: 999999 })}`,
      fecha: faker.date.past(),
      cliente: faker.company.name(),
      rif: `J-${faker.number.int({ min: 10000000, max: 99999999 })}-9`,
      total: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
      status: faker.helpers.arrayElement(['DRAFT', 'CONFIRMED', 'INVOICED', 'CANCELLED']),
      vendedor: faker.person.fullName(),
    }));
  }

  // Generar productos con IA
  static generateProductos(count: number = 100) {
    const categories = ['Electrónica', 'Hogar', 'Oficina', 'Alimentos', 'Ropa'];
    
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      code: `PROD-${faker.number.int({ min: 1000, max: 9999 })}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(categories),
      price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      cost: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
      stock: faker.number.int({ min: 0, max: 1000 }),
      minStock: faker.number.int({ min: 5, max: 50 }),
    }));
  }

  // Generar clientes realistas
  static generateClientes(count: number = 50) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      businessName: faker.company.name(),
      rif: `J-${faker.number.int({ min: 10000000, max: 99999999 })}-${faker.number.int({ min: 0, max: 9 })}`,
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      email: faker.company.email(),
      creditLimit: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
      totalCompras: faker.number.float({ min: 0, max: 500000, fractionDigits: 2 }),
      lastCompra: faker.date.recent(),
    }));
  }

  // Generar insights de IA
  static generateInsights(data: any[]) {
    const insights = [];
    
    // Analizar tendencias
    const total = data.reduce((sum, item) => sum + (item.total || item.price || 0), 0);
    const avg = total / data.length;
    
    if (total > 100000) {
      insights.push({
        type: 'success' as const,
        message: `Ventas totales superiores al promedio (${(total / 1000).toFixed(1)}K)`,
        priority: 'low' as const,
      });
    }

    // Detectar anomalías
    const outliers = data.filter(item => (item.total || item.price || 0) > avg * 3);
    if (outliers.length > 0) {
      insights.push({
        type: 'alert' as const,
        message: `${outliers.length} transacciones inusualmente altas detectadas`,
        priority: 'medium' as const,
        action: 'Revisar transacciones',
      });
    }

    // Sugerir oportunidades
    const lowStock = data.filter(item => item.stock < item.minStock);
    if (lowStock.length > 0) {
      insights.push({
        type: 'opportunity' as const,
        message: `${lowStock.length} productos con stock bajo requieren reposición`,
        priority: 'high' as const,
        action: 'Generar orden de compra',
      });
    }

    return {
      summary: `Se analizaron ${data.length} registros`,
      suggestions: insights,
    };
  }
}
```

### 2. Analizador de Tendencias con IA

```typescript
// lib/ai/trend-analyzer.ts

export class TrendAnalyzer {
  // Analizar tendencia de ventas
  static analyzeSalesTrend(ventas: any[], months: number = 12) {
    // Agrupar por mes
    const byMonth = ventas.reduce((acc, venta) => {
      const month = new Date(venta.fecha).getMonth();
      if (!acc[month]) acc[month] = 0;
      acc[month] += venta.total || 0;
      return acc;
    }, {} as Record<number, number>);

    // Calcular tendencia
    const values = Object.values(byMonth);
    const slope = this.calculateSlope(values);
    
    let trend = 'ESTABLE';
    let prediction = '';
    
    if (slope > 0.1) {
      trend = 'CRECIENTE';
      prediction = `Se proyecta un crecimiento del ${(slope * 100).toFixed(1)}% mensual`;
    } else if (slope < -0.1) {
      trend = 'DECRECIENTE';
      prediction = `Se proyecta una disminución del ${(Math.abs(slope) * 100).toFixed(1)}% mensual`;
    } else {
      prediction = 'Se espera estabilidad en las ventas';
    }

    // Detectar estacionalidad
    const maxMonth = values.indexOf(Math.max(...values));
    const minMonth = values.indexOf(Math.min(...values));
    
    const seasonality = {
      peakMonth: this.getMonthName(maxMonth),
      lowMonth: this.getMonthName(minMonth),
      variance: ((Math.max(...values) - Math.min(...values)) / Math.max(...values) * 100).toFixed(1) + '%',
    };

    return {
      trend,
      prediction,
      seasonality,
      avgMonthly: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      growth: (slope * 100).toFixed(2) + '%',
    };
  }

  private static calculateSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + idx * val, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // Normalizado
  }

  private static getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  }
}
```

---

## 📱 Layouts Premium

### Layout Principal con Sidebar Animado

```tsx
// app/(dashboard)/layout.tsx

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Ventas', href: '/ventas' },
  { icon: Package, label: 'Inventario', href: '/inventario' },
  { icon: Users, label: 'RRHH', href: '/rrhh' },
  { icon: Settings, label: 'Configuración', href: '/configuracion' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-purple-50/30">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        className="fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-white/20 z-50"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <motion.div 
            className="flex items-center justify-between"
          >
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                    ERP ZENITH
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">Panel de Control</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </motion.div>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.a>
            );
          })}
        </nav>
      </motion.aside>

      {/* Contenido Principal */}
      <main 
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-20' : 'ml-72'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navItems.find(item => item.href === pathname)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-VE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <GlassCard className="px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

## ⚙️ Configuración de Tailwind

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['League Spartan', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 📁 Archivos del Módulo

```
09-modulo-ui-ux/
├── diseño-premium.md (este archivo)
├── componentes.md
├── layouts.md
├── animaciones.md
└── ia-ui.md
```

**Anterior**: `07-integraciones/ia.md` | **Siguiente**: `09-modulo-ui-ux/componentes.md`
