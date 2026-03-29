/**
 * ConfigurableTable - Tabla que usa la configuración personalizable
 * Ejemplo de implementación para usar en cualquier módulo
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useTableColumns } from '@/hooks/useTableColumns';
import { cn } from '@/core/shared/utils/utils';

interface ConfigurableTableProps {
  tableName: string;
  data: any[];
  renderCell: (item: any, columnId: string) => React.ReactNode;
  className?: string;
}

export const ConfigurableTable: React.FC<ConfigurableTableProps> = ({
  tableName,
  data,
  renderCell,
  className,
}) => {
  const { columns, getColumnAlign } = useTableColumns(tableName);

  if (columns.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay columnas visibles. Ve a Configuración > Sistema > Editar Encabezados
        para configurar las columnas.
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No hay datos para mostrar
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {renderCell(item, column.id)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConfigurableTable;
