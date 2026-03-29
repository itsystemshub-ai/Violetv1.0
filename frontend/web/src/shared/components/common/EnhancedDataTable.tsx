import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Enhanced Data Table - Diseñado con UI/UX Pro Max
 * 
 * Características:
 * - Row highlighting on hover (200ms transition)
 * - Smooth filter animations
 * - Data-dense layout
 * - Sortable columns
 * - Loading states
 * - Accesibilidad WCAG AA
 */
export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className,
}: EnhancedDataTableProps<T>) {
  const isRowClickable = !!onRowClick;
  
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };
  
  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary" />
      : <ChevronDown className="h-4 w-4 text-primary" />;
  };
  
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-slate-200', className)}>
      {/* Loading overlay */}
      {loading && (
        <div 
          className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
          role="status"
          aria-label="Cargando datos"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="animate-data-loading rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            <p className="text-sm text-slate-600 font-body">Cargando datos...</p>
          </div>
        </div>
      )}
      
      {/* Table container with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="table">
          {/* Header */}
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr role="row">
              {columns.map((column, index) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-4',
                    'text-left text-xs font-semibold text-slate-700 uppercase tracking-wider',
                    'font-body',
                    'whitespace-nowrap',
                    
                    // Alignment
                    {
                      'text-left': column.align === 'left' || !column.align,
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    },
                    
                    // Sortable styles
                    column.sortable && [
                      'cursor-pointer',
                      'select-none',
                      'hover:bg-slate-100',
                      'transition-colors duration-200',
                    ],
                    
                    // First/last column
                    index === 0 && 'pl-8',
                    index === columns.length - 1 && 'pr-8',
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                  role="columnheader"
                  aria-sort={
                    sortBy === column.key 
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white divide-y divide-slate-200">
            {data.length === 0 && !loading ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-8 py-12 text-center text-slate-500 font-body"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    // Row highlighting on hover
                    'table-row-hover',
                    'transition-all duration-200',
                    
                    // Clickable styles
                    isRowClickable && [
                      'cursor-pointer',
                      'hover:bg-primary/5',
                    ],
                    
                    // Focus styles
                    'focus-within:bg-primary/10',
                  )}
                  onClick={() => isRowClickable && onRowClick(item)}
                  role="row"
                  tabIndex={isRowClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isRowClickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-6 py-4',
                        'text-sm text-slate-900 font-body',
                        'whitespace-nowrap',
                        
                        // Alignment
                        {
                          'text-left': column.align === 'left' || !column.align,
                          'text-center': column.align === 'center',
                          'text-right': column.align === 'right',
                        },
                        
                        // First/last column
                        colIndex === 0 && 'pl-8',
                        colIndex === columns.length - 1 && 'pr-8',
                      )}
                      role="cell"
                    >
                      {column.render 
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '-')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer with row count */}
      {data.length > 0 && !loading && (
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-600 font-body">
            Mostrando {data.length} {data.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
      )}
    </div>
  );
}

export default EnhancedDataTable;
