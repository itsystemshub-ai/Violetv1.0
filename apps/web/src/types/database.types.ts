/**
 * Tipos para mapeo de base de datos
 * Define la estructura de datos en snake_case (DB) y camelCase (Frontend)
 */

/**
 * Producto en formato de base de datos (snake_case)
 */
export interface ProductDB {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  min_stock: number;
  unit: string;
  category: string;
  warehouse_id?: string;
  image_url?: string;
  image_urls?: string[];
  cauplas?: string;
  torflex?: string;
  indomax?: string;
  oem?: string;
  aplicacion?: string;
  descripcion_manguera?: string;
  aplicaciones_diesel?: string;
  is_nuevo?: boolean | string;
  ventas_history?: any;
  ranking_history?: any;
  precio_fca?: number;
  status: "disponible" | "poco_stock" | "agotado" | "descontinuado" | "active" | "inactive";
  is_combo?: boolean;
  components?: Array<{ productId: string; quantity: number }>;
  warehouse_stocks?: any;
  row_number?: number;
  deactivation_reason?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Factura en formato de base de datos (snake_case)
 */
export interface InvoiceDB {
  id: string;
  tenant_id: string;
  number: string;
  customer_name: string;
  customer_rif: string;
  customer_empresa?: string;
  customer_contacto?: string;
  customer_email?: string;
  customer_direccion?: string;
  seller_id?: string;
  date: string;
  subtotal: number;
  tax_total: number;
  tax_igtf?: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  items: InvoiceItemDB[];
  type: 'venta' | 'compra' | 'pedido';
  exchange_rate_used?: number;
  total_ves?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Item de factura en formato de base de datos
 */
export interface InvoiceItemDB {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
}

/**
 * Usuario en formato de base de datos (snake_case)
 */
export interface UserDB {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  tenant_id: string;
  avatar_url?: string;
  is_2fa_enabled: boolean;
  permissions: string[];
  is_super_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Resultado de operación de base de datos
 */
export interface DBOperationResult<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Resultado de mutación con SyncService
 */
export interface SyncMutationResult<T = any> {
  data?: T;
  error?: Error | { message: string };
  success?: boolean;
}
