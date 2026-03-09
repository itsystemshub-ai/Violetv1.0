/**
 * VirtualTable - Tabla con virtual scrolling
 * Características:
 * - Renderiza solo filas visibles
 * - Soporta miles de filas sin lag
 * - Scroll suave
 * - Columnas configurables
 * - Ordenamiento
 * - Selección de filas
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/core/shared/utils/utils';
import { Checkbox } from '@/shared/components/ui/checkbox';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  selectable?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  overscan = 5,
  onRowClick,
  onSelectionChange,
  selectable = false,
  className,
  emptyMessage = 'No hay datos para mostrar',
}: VirtualTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  // Manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Manejar selección
  const handleSelectRow = (index: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map((_, i) => i)));
    }
  };

  // Notificar cambios de selección
  useEffect(() => {
    if (onSelectionChange) {
      const selected = Array.from(selectedRows).map((i) => sortedData[i]);
      onSelectionChange(selected);
    }
  }, [selectedRows, sortedData, onSelectionChange]);

  // Renderizar icono de ordenamiento
  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted/50 border-b sticky top-0 z-10">
        <div className="flex items-center">
          {selectable && (
            <div className="w-12 flex items-center justify-center shrink-0">
              <Checkbox
                checked={selectedRows.size === sortedData.length}
                onCheckedChange={handleSelectAll}
              />
            </div>
          )}
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'px-4 py-3 text-sm font-medium flex items-center gap-2',
                column.sortable && 'cursor-pointer hover:bg-muted',
                column.className
              )}
              style={{ width: column.width }}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <span>{column.header}</span>
              {column.sortable && renderSortIcon(column.key)}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const item = sortedData[virtualRow.index];
            const isSelected = selectedRows.has(virtualRow.index);

            return (
              <div
                key={virtualRow.index}
                className={cn(
                  'absolute top-0 left-0 w-full border-b hover:bg-accent/50 transition-colors',
                  isSelected && 'bg-accent',
                  onRowClick && 'cursor-pointer'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(item, virtualRow.index)}
              >
                <div className="flex items-center h-full">
                  {selectable && (
                    <div
                      className="w-12 flex items-center justify-center shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRow(virtualRow.index);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                    </div>
                  )}
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm overflow-hidden',
                        column.className
                      )}
                      style={{ width: column.width }}
                    >
                      {column.render
                        ? column.render(item, virtualRow.index)
                        : item[column.key]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer con info */}
      <div className="bg-muted/50 border-t px-4 py-2 text-sm text-muted-foreground flex items-center justify-between">
        <span>
          Mostrando {items.length} de {sortedData.length} filas
        </span>
        {selectable && selectedRows.size > 0 && (
          <span>{selectedRows.size} seleccionadas</span>
        )}
      </div>
    </div>
  );
}

/**
 * VirtualTableCompact - Versión compacta para espacios reducidos
 */
export function VirtualTableCompact<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 40,
  ...props
}: VirtualTableProps<T>) {
  return (
    <VirtualTable
      data={data}
      columns={columns}
      rowHeight={rowHeight}
      {...props}
    />
  );
}
