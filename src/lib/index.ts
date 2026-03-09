export const ROUTE_PATHS = {
  DASHBOARD: "/",
  FINANCE: "/finance",
  INVENTORY: "/inventory",
  SALES: "/sales",
  PURCHASES: "/purchases",
  HR: "/hr",
  AI: "/ai",
  SETTINGS: "/settings",
  SECURITY: "/security",
  LOGIN: "/login",
  TODOS: "/todos",
  ORDERS: "/orders",
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "gerente",
  ACCOUNTANT: "contador",
  FINANCE: "finanzas",
  SALES: "ventas",
  CUSTOMER_SERVICE: "atencion_cliente",
  WAREHOUSE: "almacen",
  HR: "recursos_humanos",
  CLIENT: "cliente",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DEPARTMENTS = {
  // Departamentos Comerciales
  SALES: "Ventas",
  MARKETING: "Marketing",
  CUSTOMER_SERVICE: "Atención al Cliente",
  
  // Departamentos Operativos
  WAREHOUSE: "Almacén",
  LOGISTICS: "Logística",
  PRODUCTION: "Producción",
  QUALITY: "Control de Calidad",
  MAINTENANCE: "Mantenimiento",
  
  // Departamentos Administrativos
  FINANCE: "Finanzas",
  ACCOUNTING: "Contabilidad",
  HR: "Recursos Humanos",
  ADMIN: "Administración / IT",
  LEGAL: "Legal",
  
  // Departamentos de Soporte
  PURCHASING: "Compras",
  IT: "Tecnología",
  SECURITY: "Seguridad",
  
  // Otros
  MANAGEMENT: "Gerencia",
  CLIENTS: "Clientes Externos",
} as const;

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

/**
 * Todos los permisos granulares disponibles en el sistema.
 */
export const ALL_PERMISSIONS = [
  // Módulos
  "view:dashboard",
  "view:finance",
  "view:inventory",
  "view:sales",
  "view:purchases",
  "view:hr",
  "view:crm",
  "view:settings",
  // Finanzas
  "finance:read",
  "finance:create",
  "finance:edit",
  "finance:delete",
  "finance:export",
  // Inventario
  "inventory:read",
  "inventory:create",
  "inventory:edit",
  "inventory:delete",
  "inventory:export",
  // Ventas
  "sales:read",
  "sales:create",
  "sales:edit",
  "sales:delete",
  "sales:export",
  // Compras
  "purchases:read",
  "purchases:create",
  "purchases:edit",
  "purchases:delete",
  // RRHH
  "hr:read",
  "hr:create",
  "hr:edit",
  "hr:delete",
  "hr:payroll",
  // CRM
  "crm:read",
  "crm:create",
  "crm:edit",
  "crm:delete",
  "crm:export",
  // Configuración y administración
  "settings:read",
  "settings:edit",
  "tenants:manage",
  "users:read",
  "users:create",
  "users:edit",
  "users:delete",
  "roles:manage",
  "audit:view",
  "system:superadmin",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ERP_MODULES = [
  {
    id: "finance",
    name: "Finanzas",
    path: ROUTE_PATHS.FINANCE,
    icon: "Wallet",
    description: "Contabilidad, estados financieros y conciliación.",
  },
  {
    id: "inventory",
    name: "Inventario",
    path: ROUTE_PATHS.INVENTORY,
    icon: "Package",
    description: "Control de stock, almacenes y trazabilidad.",
  },
  {
    id: "sales",
    name: "Ventas",
    path: ROUTE_PATHS.SALES,
    icon: "ShoppingCart",
    description: "Facturación electrónica y punto de venta.",
  },
  {
    id: "purchases",
    name: "Compras",
    path: ROUTE_PATHS.PURCHASES,
    icon: "Truck",
    description: "Órdenes de compra y gestión de proveedores.",
  },
  {
    id: "hr",
    name: "RRHH",
    path: ROUTE_PATHS.HR,
    icon: "Users",
    description: "Nómina, asistencia y expedientes de empleados.",
  },
  {
    id: "ai",
    name: "IA",
    path: ROUTE_PATHS.AI,
    icon: "Bot",
    description: "Asistente inteligente con 21 skills activas.",
  },
] as const;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  rif: string;
  fiscalName: string;
  commercialName?: string; // Nombre comercial (ej: A.E. Araujo. F.P.)
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  sector?: string; // Sector o zona
  phone: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  createdAt: string;
  isActive?: boolean;
  exchangeRate?: number; // Tasa BCV para el tenant
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  is2FAEnabled: boolean;
  permissions: Permission[];
  isSuperAdmin?: boolean;
  department?: Department;
  email?: string; // Opcional, para notificaciones en producción
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface FinancialAccount {
  id: string;
  code: string;
  name: string;
  type: "activo" | "pasivo" | "patrimonio" | "ingreso" | "egreso";
  balance: number;
  currency: string;
  tenant_id?: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    currency: "USD" | "VES";
    isCashAccount?: boolean;
  };
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  isMain?: boolean;
}

export interface ProductWarehouseStock {
  warehouseId: string;
  stock: number;
}

export interface ProductComponent {
  productId: string;
  quantity: number;
}

export interface Product {
  id: string;
  images: string[];
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number; // Stock total (suma de almacenes o calculado si es combo)
  minStock: number;
  unit: string;
  category: string;
  warehouseId: string; // Almacén por defecto

  // Multi-Almacén
  warehouseStocks?: ProductWarehouseStock[];

  // Combos / Kits
  isCombo?: boolean;
  components?: ProductComponent[];

  // Campos específicos de Cauplas/Inventario
  cauplas?: string;
  torflex?: string;
  indomax?: string;
  oem?: string;
  aplicacion?: string;
  descripcionManguera?: string;
  aplicacionesDiesel?: string;
  isNuevo?: boolean | string;

  // Históricos y Rankings
  ventasHistory?: {
    2023: number;
    2024: number;
    2025: number;
  };
  rankingHistory?: {
    2023: number;
    2024: number;
    2025: number;
  };
  historial?: number;

  precioFCA?: number;
  margen?: number;
  rowNumber?: number; // Número de fila del archivo importado
  status: "disponible" | "poco_stock" | "agotado" | "descontinuado" | "active" | "inactive";
  deactivationReason?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface InvoiceItem {
  productId: string;
  product_id?: string; // Temporarily allow both to facilitate migration/compatibility
  name: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenant_id?: string;
  number: string;
  customerId?: string;
  customerName: string;
  customerRif?: string;
  customer_name?: string;
  customer_rif?: string;
  customer_empresa?: string;
  customer_contacto?: string;
  customer_email?: string;
  customer_direccion?: string;
  customer_empresa_manual?: string;
  supplier_id?: string;
  seller_id?: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  taxTotal: number;
  tax_total?: number;
  tax_igtf?: number;
  total: number;
  total_ves?: number;
  exchange_rate_used?: number;
  status:
    | "pagada"
    | "pendiente"
    | "vencida"
    | "anulada"
    | "borrador"
    | "convertido"
    | "procesado";
  items: InvoiceItem[];
  payment_type?: string;
  payment_status?: string;
  payment_method?: string;
  type: "venta" | "compra" | "pedido" | "nota_entrega";
  controlNumber?: string; // Número de Control Fiscal
  ivaWithholdingPercentage?: number; // 0, 75, 100
  ivaWithholdingAmount?: number;
  islrConceptCode?: string; // Concepto de retención de ISLR (Ej: 001)
  islrWithholdingAmount?: number;
  totalVES?: number; // Total calculado en Bolívares
  exchangeRateUsed?: number; // Tasa utilizada al momento de la factura
  parent_id?: string; // ID del documento origen
  notes?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface Supplier {
  id: string;
  tenant_id?: string;
  name: string;
  rif: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  category: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface FinancialTransaction {
  id: string;
  tenant_id?: string;
  account_id: string;
  date: string;
  description: string;
  type: "debe" | "haber";
  amount: number;
  monto_bs?: number;
  tasa_cambio?: number;
  reference_id?: string;
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface Employee {
  id: string;
  tenant_id?: string;
  firstName: string;
  lastName: string;
  dni: string;
  rif: string;
  militaryRegistration?: string;
  cargasFamiliares: number;
  centroCostos: string; // Administración, Ventas, Operaciones, Producción
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  salarioIntegral?: number;
  joinDate: string;
  terminationDate?: string;
  status: "activo" | "suspendido" | "retirado";
  created_at?: string;
  updated_at?: string;
  last_sync?: string | null;
  is_dirty?: number;
  deleted_at?: string | null;
  version?: number;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary?: number;
}

export const formatCurrency = (amount: number, currency: string = "USD") => {
  if (
    amount === undefined ||
    amount === null ||
    isNaN(amount) ||
    !isFinite(amount)
  ) {
    return currency === "USD" ? "$0,00" : "Bs. 0,00";
  }

  // Formato español para todas las monedas (1.525,00)
  if (currency === "USD") {
    return `$${amount.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else if (currency === "VES" || currency === "Bs") {
    return `Bs. ${amount.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Fallback para otras monedas
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getContrastColor = (hexcolor: string) => {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

// --- EL CEREBRO: Interfaces de Configuración Avanzada ---

export interface SysConfigEntry {
  id?: string;
  tenant_id?: string | null;
  module: string;
  key: string;
  value_type: "string" | "number" | "json" | "boolean";
  value_json: any;
  description?: string;
  version?: number;
}

export interface VenezuelaTaxConfig {
  iva_general: number;
  iva_reducido: number;
  iva_lujo: number;
  igtf_divisas: number;
  rif_mask: string;
  default_iva_withholding?: number;
  utValue: number;
}

export interface ExchangeRateConfig {
  provider: "bcv" | "manual";
  rate: number;
  lastUpdated: string;
}

export interface ApprovalRule {
  rule_name: string;
  condition: {
    field: string;
    operator: ">" | "<" | "==" | "!=";
    value: number | string;
  };
  action: {
    type: "require_approval" | "auto_reject" | "auto_approve";
    role: UserRole;
  };
  notification: "email" | "push" | "both" | "none";
}
