/**
 * Violet ERP - Tipos compartidos del sistema
 * 
 * Este paquete contiene todos los tipos TypeScript utilizados
 * en toda la aplicación Violet ERP.
 */

// ============================================================================
# USUARIOS Y AUTENTICACIÓN
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve';
  description: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ============================================================================
# PRODUCTOS E INVENTARIO
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  unitId: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  maxStock?: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  barcode?: string;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  isActive: boolean;
  isTaxable: boolean;
  taxRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  position: number;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  value: string;
  unit?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  path: string;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  type: 'unit' | 'weight' | 'volume' | 'length' | 'area';
  conversionFactor?: number;
  baseUnitId?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
# VENTAS Y FACTURACIÓN
// ============================================================================

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  salespersonId?: string;
  warehouseId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type SaleStatus = 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface Customer {
  id: string;
  type: 'individual' | 'company';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  taxId?: string;
  email: string;
  phone: string;
  mobile?: string;
  addresses: Address[];
  contacts: Contact[];
  creditLimit?: number;
  currentBalance: number;
  notes?: string;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping' | 'both';
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Contact {
  id: string;
  name: string;
  position?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

// ============================================================================
# COMPRAS Y PROVEEDORES
// ============================================================================

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  receivedAmount: number;
  balance: number;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  warehouseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';

export interface PurchaseItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  phone: string;
  website?: string;
  addresses: Address[];
  contacts: Contact[];
  paymentTerms?: string;
  creditLimit?: number;
  currentBalance: number;
  rating?: number;
  notes?: string;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
# FINANZAS Y CONTABILIDAD
// ============================================================================

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  level: number;
  path: string;
  balance: number;
  isActive: boolean;
  isSystem: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  items: JournalEntryItem[];
  referenceType?: string;
  referenceId?: string;
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  postedBy?: string;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryItem {
  id: string;
  entryId: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
  description?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'sales' | 'purchase';
  customerId?: string;
  supplierId?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  type: 'receipt' | 'payment';
  customerId?: string;
  supplierId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: Date;
  notes?: string;
  attachments?: Attachment[];
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'credit' | 'other';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

// ============================================================================
# REPORTES Y DASHBOARD
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  userId: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percent';
  format?: string;
  isVisible: boolean;
}

export interface ReportData {
  columns: string[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

// ============================================================================
# SISTEMA Y AUDITORÍA
// ============================================================================

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isPublic: boolean;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
# UTILIDADES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';

export type ModuleName = 
  | 'auth'
  | 'users'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'purchases'
  | 'suppliers'
  | 'finance'
  | 'accounting'
  | 'reports'
  | 'settings';

export interface ModuleConfig {
  name: ModuleName;
  label: string;
  icon: string;
  enabled: boolean;
  permissions: string[];
  routes: RouteConfig[];
}

export interface RouteConfig {
  path: string;
  label: string;
  permissions?: string[];
}
