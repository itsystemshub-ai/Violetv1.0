/**
 * Store para configuración de tablas personalizables
 * Permite a los usuarios modificar encabezados, visibilidad y orden de columnas
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig {
  [tableName: string]: ColumnConfig[];
}

interface TableConfigStore {
  tables: TableConfig;
  updateColumnLabel: (tableName: string, columnId: string, newLabel: string) => void;
  toggleColumnVisibility: (tableName: string, columnId: string) => void;
  reorderColumns: (tableName: string, columns: ColumnConfig[]) => void;
  updateColumnWidth: (tableName: string, columnId: string, width: number) => void;
  updateColumnAlign: (tableName: string, columnId: string, align: 'left' | 'center' | 'right') => void;
  resetTable: (tableName: string, defaultColumns: ColumnConfig[]) => void;
  getTableConfig: (tableName: string) => ColumnConfig[] | undefined;
  exportTableHeaders: (tableName: string) => Record<string, string>;
}

// Configuraciones por defecto para cada tabla
export const DEFAULT_TABLE_CONFIGS: TableConfig = {
  products: [
    { id: 'cauplas', label: 'CAUPLAS', visible: true, order: 0, align: 'left' },
    { id: 'torflex', label: 'TORFLEX', visible: true, order: 1, align: 'left' },
    { id: 'indomax', label: 'INDOMAX', visible: true, order: 2, align: 'left' },
    { id: 'oem', label: 'OEM', visible: true, order: 3, align: 'left' },
    { id: 'description', label: 'DESCRIPCION DEL PRODUCTO', visible: true, order: 4, align: 'left' },
    { id: 'category', label: 'CATEGORIA', visible: true, order: 5, align: 'left' },
    { id: 'fuel', label: 'TIPO DE COMBUSTIBLE', visible: true, order: 6, align: 'left' },
    { id: 'new', label: 'NUEVOS ITEMS', visible: true, order: 7, align: 'center' },
    { id: 'sales', label: 'VENTAS 23 24 25', visible: true, order: 8, align: 'center' },
    { id: 'ranking', label: 'RANKING 23 24 25', visible: true, order: 9, align: 'center' },
    { id: 'price', label: 'PRECIO FCA CÓRDOBA $', visible: true, order: 10, align: 'right' },
    { id: 'stock', label: 'CANTIDAD', visible: true, order: 11, align: 'center' },
    { id: 'actions', label: 'ACCIONES', visible: true, order: 12, align: 'center' },
  ],
  invoices: [
    { id: 'date', label: 'Fecha', visible: true, order: 0, align: 'center' },
    { id: 'number', label: 'Nro Factura', visible: true, order: 1, align: 'left' },
    { id: 'entity', label: 'Entidad', visible: true, order: 2, align: 'center' },
    { id: 'rif', label: 'RIF', visible: true, order: 3, align: 'left' },
    { id: 'company', label: 'Empresa', visible: true, order: 4, align: 'left' },
    { id: 'quantity', label: 'Cant. Total', visible: true, order: 5, align: 'center' },
    { id: 'total', label: 'Total', visible: true, order: 6, align: 'right' },
    { id: 'status', label: 'Estado', visible: true, order: 7, align: 'center' },
    { id: 'actions', label: 'Acciones', visible: true, order: 8, align: 'right' },
  ],
  orders: [
    { id: 'date', label: 'Fecha', visible: true, order: 0, align: 'center' },
    { id: 'number', label: 'Nro Control', visible: true, order: 1, align: 'left' },
    { id: 'entity', label: 'Entidad', visible: true, order: 2, align: 'center' },
    { id: 'rif', label: 'RIF', visible: true, order: 3, align: 'left' },
    { id: 'company', label: 'Empresa', visible: true, order: 4, align: 'left' },
    { id: 'quantity', label: 'Cant. Total', visible: true, order: 5, align: 'center' },
    { id: 'total', label: 'Total', visible: true, order: 6, align: 'right' },
    { id: 'status', label: 'Estado', visible: true, order: 7, align: 'center' },
    { id: 'actions', label: 'Acciones', visible: true, order: 8, align: 'right' },
  ],
  customers: [
    { id: 'type', label: 'Tipo', visible: true, order: 0, align: 'center' },
    { id: 'rif', label: 'RIF', visible: true, order: 1, align: 'left' },
    { id: 'name', label: 'Nombre', visible: true, order: 2, align: 'left' },
    { id: 'email', label: 'Email', visible: true, order: 3, align: 'left' },
    { id: 'phone', label: 'Teléfono', visible: true, order: 4, align: 'left' },
    { id: 'address', label: 'Dirección', visible: true, order: 5, align: 'left' },
    { id: 'actions', label: 'Acciones', visible: true, order: 6, align: 'center' },
  ],
  suppliers: [
    { id: 'rif', label: 'RIF', visible: true, order: 0, align: 'left' },
    { id: 'name', label: 'Nombre', visible: true, order: 1, align: 'left' },
    { id: 'contact', label: 'Contacto', visible: true, order: 2, align: 'left' },
    { id: 'phone', label: 'Teléfono', visible: true, order: 3, align: 'left' },
    { id: 'email', label: 'Email', visible: true, order: 4, align: 'left' },
    { id: 'actions', label: 'Acciones', visible: true, order: 5, align: 'center' },
  ],
  employees: [
    { id: 'dni', label: 'DNI', visible: true, order: 0, align: 'left' },
    { id: 'name', label: 'Nombre', visible: true, order: 1, align: 'left' },
    { id: 'position', label: 'Cargo', visible: true, order: 2, align: 'left' },
    { id: 'department', label: 'Departamento', visible: true, order: 3, align: 'left' },
    { id: 'salary', label: 'Salario', visible: true, order: 4, align: 'right' },
    { id: 'status', label: 'Estado', visible: true, order: 5, align: 'center' },
    { id: 'actions', label: 'Acciones', visible: true, order: 6, align: 'center' },
  ],
};

export const useTableConfigStore = create<TableConfigStore>()(
  persist(
    (set, get) => ({
      tables: DEFAULT_TABLE_CONFIGS,

      updateColumnLabel: (tableName: string, columnId: string, newLabel: string) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: state.tables[tableName]?.map((col) =>
              col.id === columnId ? { ...col, label: newLabel } : col
            ) || [],
          },
        }));
      },

      toggleColumnVisibility: (tableName: string, columnId: string) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: state.tables[tableName]?.map((col) =>
              col.id === columnId ? { ...col, visible: !col.visible } : col
            ) || [],
          },
        }));
      },

      reorderColumns: (tableName: string, columns: ColumnConfig[]) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: columns.map((col, index) => ({ ...col, order: index })),
          },
        }));
      },

      updateColumnWidth: (tableName: string, columnId: string, width: number) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: state.tables[tableName]?.map((col) =>
              col.id === columnId ? { ...col, width } : col
            ) || [],
          },
        }));
      },

      updateColumnAlign: (tableName: string, columnId: string, align: 'left' | 'center' | 'right') => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: state.tables[tableName]?.map((col) =>
              col.id === columnId ? { ...col, align } : col
            ) || [],
          },
        }));
      },

      resetTable: (tableName: string, defaultColumns: ColumnConfig[]) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableName]: defaultColumns,
          },
        }));
      },

      getTableConfig: (tableName: string) => {
        return get().tables[tableName];
      },

      // Exportar configuración en formato compatible con tableHeaders
      exportTableHeaders: (tableName: string) => {
        const config = get().tables[tableName];
        if (!config) return {};
        
        const headers: Record<string, string> = {};
        config.forEach((col) => {
          headers[col.id] = col.label;
        });
        return headers;
      },
    }),
    {
      name: 'violet-table-config',
    }
  )
);
