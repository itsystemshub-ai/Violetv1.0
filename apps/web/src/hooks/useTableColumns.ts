/**
 * Hook para usar columnas configurables en tablas
 * Aplica automáticamente la configuración guardada por el usuario
 */

import { useMemo } from 'react';
import { useTableConfigStore, type ColumnConfig } from '@/stores/tableConfigStore';

export const useTableColumns = (tableName: string) => {
  const { getTableConfig } = useTableConfigStore();
  
  const columns = useMemo(() => {
    const config = getTableConfig(tableName);
    if (!config) return [];
    
    // Filtrar solo columnas visibles y ordenarlas
    return config
      .filter((col) => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [tableName, getTableConfig]);

  const getColumnLabel = (columnId: string): string => {
    const config = getTableConfig(tableName);
    const column = config?.find((col) => col.id === columnId);
    return column?.label || columnId;
  };

  const getColumnAlign = (columnId: string): 'left' | 'center' | 'right' => {
    const config = getTableConfig(tableName);
    const column = config?.find((col) => col.id === columnId);
    return column?.align || 'left';
  };

  const isColumnVisible = (columnId: string): boolean => {
    const config = getTableConfig(tableName);
    const column = config?.find((col) => col.id === columnId);
    return column?.visible ?? true;
  };

  return {
    columns,
    getColumnLabel,
    getColumnAlign,
    isColumnVisible,
  };
};
