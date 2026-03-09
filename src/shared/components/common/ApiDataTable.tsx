import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface ApiDataTableProps<T> {
  data: T[] | null;
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  keyExtractor?: (item: T) => string;
}

export function ApiDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  error = null,
  onRefresh,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  keyExtractor = (item) => String(item.id || Math.random()),
}: ApiDataTableProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        )}
      </div>
    );
  }

  // Data table
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex}>
                  {column.render
                    ? column.render(item)
                    : String(item[column.key as keyof T] || '-')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Helper component for status badges
 */
export function StatusBadge({
  status,
  variant = 'default',
}: {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

/**
 * Helper component for currency display
 */
export function CurrencyCell({
  amount,
  currency = 'USD',
}: {
  amount: number;
  currency?: string;
}) {
  return (
    <span className="font-mono">
      {new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
      }).format(amount)}
    </span>
  );
}

/**
 * Helper component for date display
 */
export function DateCell({ date }: { date: string | Date }) {
  return (
    <span className="text-sm text-muted-foreground">
      {new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date))}
    </span>
  );
}
