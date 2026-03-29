/**
 * Hook para integrar el sistema de personalización de tablas
 * con el sistema existente de tableHeaders en Inventory
 */

import { useMemo } from 'react';
import { useTableConfigStore } from '@/stores/tableConfigStore';

export const useInventoryTableHeaders = () => {
  const { exportTableHeaders } = useTableConfigStore();

  const tableHeaders = useMemo(() => {
    return {
      inventory: exportTableHeaders('products'),
    };
  }, [exportTableHeaders]);

  return tableHeaders;
};
