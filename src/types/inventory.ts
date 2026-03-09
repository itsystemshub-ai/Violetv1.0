// Types for Inventory Module

export interface Product {
  id: string;
  rowNumber?: number;
  cauplas?: string;
  torflex?: string;
  indomax?: string;
  oem?: string;
  name: string;
  description?: string;
  aplicacion?: string;
  descripcionManguera?: string;
  category: string;
  aplicacionesDiesel?: string;
  isNuevo?: boolean | string;
  ventasHistory?: {
    [year: number]: number;
  };
  rankingHistory?: {
    [year: number]: number | string;
  };
  historial?: number; // Total histórico de ventas (campo del Excel)
  ventasTotal?: number;
  precioFCA?: number;
  margen?: number;
  price: number;
  stock: number;
  minStock: number;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export type SortDirection = 'asc' | 'desc';

export type SortField = 
  | 'rowNumber'
  | 'cauplas'
  | 'torflex'
  | 'indomax'
  | 'oem'
  | 'name'
  | 'category'
  | 'aplicacionesDiesel'
  | 'isNuevo'
  | 'ventasTotal'
  | 'ranking'
  | 'price'
  | 'stock';

export interface TableHeaders {
  inventory?: {
    cauplas?: string;
    torflex?: string;
    indomax?: string;
    oem?: string;
    description?: string;
    category?: string;
    fuel?: string;
    new?: string;
    price?: string;
    stock?: string;
  };
}

export interface InventoryLogic {
  products: Product[];
  filteredProducts: Product[];
  allFilteredProducts: Product[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  sortBy: SortField;
  sortDirection: SortDirection;
  tableHeaders: TableHeaders;
  canManageInventory: boolean;
  forecasts?: Record<string, any>;
  suggestedPurchases?: any[];
  isFormOpen: boolean;
  isAuditOpen: boolean;
  selectedProduct: Product | null;
  auditProduct: Product | null;
  setCurrentPage: (page: number) => void;
  setIsFormOpen: (open: boolean) => void;
  setIsAuditOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;
  setAuditProduct: (product: Product | null) => void;
  handleSort: (field: SortField) => void;
  deleteProduct: (id: string) => void;
}
