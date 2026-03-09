/**
 * Routes Configuration
 *
 * Arquitectura: Configuration as Code
 * - Centraliza todas las rutas de la aplicación
 * - Type-safe route definitions
 * - Facilita refactoring y mantenimiento
 */

import { lazy, ComponentType } from "react";

// Lazy-loaded Pages
import ExecutiveDashboard from "@/modules/dashboard/pages/DashboardPage";
const FinancePage = lazy(() => import("@/modules/finance/pages/FinancePage"));
const Finance = FinancePage;
const AccountsPayable = FinancePage;
const Banks = FinancePage;
const Accounting = FinancePage;
const Inventory = lazy(
  () => import("@/modules/inventory/pages/InventoryManagementPage"),
);
const InventoryMovements = lazy(
  () => import("@/modules/inventory/pages/InventoryMovements"),
);
const Sales = lazy(() => import("@/modules/sales/pages/SalesDashboardPage"));
const PurchasesPage = lazy(
  () => import("@/modules/purchases/pages/PurchasesPage"),
);
const PurchaseOrdersPage = PurchasesPage;
const ReceiptsPage = PurchasesPage;
const SuppliersPage = PurchasesPage;
const Purchases = PurchasesPage;
const HRPage = lazy(() => import("@/modules/hr/pages/HRPage"));
const HR = HRPage;
const AI = lazy(() => import("@/modules/ai/pages/AIPage"));
const AIManagementPage = lazy(
  () => import("@/modules/ai/pages/AIManagementPage"),
);
const CRMPage = lazy(() => import("@/modules/crm/pages/CRMPage"));
const PipelinePage = lazy(() => import("@/modules/crm/pages/PipelinePage"));
const CustomersPage = lazy(() => import("@/modules/crm/pages/CustomersPage"));
const TicketsPage = lazy(() => import("@/modules/crm/pages/TicketsPage"));
const CommunicationsPage = lazy(
  () => import("@/modules/crm/pages/CommunicationsPage"),
);
const AnalyticsPage = lazy(() => import("@/modules/crm/pages/AnalyticsPage"));
const AutomationPage = lazy(() => import("@/modules/crm/pages/AutomationPage"));
const Settings = lazy(() => import("@/modules/settings/pages/SettingsPage"));
const Login = lazy(() => import("@/modules/auth/pages/Login"));
const InvoicePreview = lazy(
  () => import("@/modules/sales/pages/InvoicePreviewPage"),
);
const AccountsReceivable = lazy(
  () => import("@/modules/accounts-receivable/pages/AccountsReceivablePage"),
);
// Finance Pages Migrated to FinancePage Hub
const POSPage = lazy(() => import("@/modules/sales/pages/POSPage"));

// Sales Pages
const ClientsPage = lazy(() => import("@/modules/sales/pages/ClientsPage"));
const SalespeoplePage = lazy(
  () => import("@/modules/sales/pages/SalespeoplePage"),
);
const InvoicesPage = lazy(
  () => import("@/modules/sales/pages/InvoicesPageNew"),
);
const OrdersPage = lazy(() => import("@/modules/sales/pages/OrdersPage"));
const SalesDashboardPage = lazy(
  () => import("@/modules/sales/pages/SalesDashboardPage"),
);
// const mPOSPage = lazy(() => import("@/modules/sales/pages/mPOSPage")); // Removed: Integrated into POSPage

// Inventory Pages
const ProductsPage = lazy(
  () => import("@/modules/inventory/pages/ProductsPage"),
);
const CategoriesPage = lazy(
  () => import("@/modules/inventory/pages/CategoriesPage"),
);
const AdjustmentsPage = lazy(
  () => import("@/modules/inventory/pages/AdjustmentsPage"),
);
const TransfersPage = lazy(
  () => import("@/modules/inventory/pages/TransfersPage"),
);
const PriceListPage = lazy(
  () => import("@/modules/inventory/pages/PriceListPage"),
);
const KardexPage = lazy(
  () => import("@/modules/inventory/pages/KardexPage"),
);


// Purchases Pages Migrated to PurchasesPage Hub

// HR Pages
const EmployeesPage = lazy(() => import("@/modules/hr/pages/EmployeesPage"));
const PayrollPage = lazy(() => import("@/modules/hr/pages/PayrollPage"));
const AttendancePage = lazy(() => import("@/modules/hr/pages/AttendancePage"));

// Reports Pages
const SalesReportsPage = lazy(
  () => import("@/modules/reports/pages/SalesReportsPage"),
);
const InventoryReportsPage = lazy(
  () => import("@/modules/reports/pages/InventoryReportsPage"),
);
const FinancialReportsPage = lazy(
  () => import("@/modules/reports/pages/FinancialReportsPage"),
);

// Currencies
// Removida por estar obsoleta en la nueva arquitectura

// Support Page
const SupportPage = lazy(() => import("@/modules/support/pages/SupportPage"));
const DatabasePage = lazy(() => import("@/modules/database/pages/DatabasePage"));

// Error Pages
const ConnectivityError = lazy(
  () => import("@/shared/pages/ConnectivityError"),
);
const Unauthorized = lazy(() => import("@/shared/pages/Unauthorized"));
const NotFound = lazy(() => import("@/shared/pages/not-found/Index"));

/**
 * Route Configuration Type
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  protected?: boolean;
  permission?: string;
  title?: string;
  description?: string;
}

/**
 * Public Routes - No authentication required
 */
export const PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: "/login",
    component: Login,
    title: "Iniciar Sesión",
    description: "Página de autenticación",
  },
  {
    path: "/connectivity-error",
    component: ConnectivityError,
    title: "Error de Conectividad",
  },
  {
    path: "/unauthorized",
    component: Unauthorized,
    title: "No Autorizado",
  },
];

/**
 * Protected Routes - Authentication required
 */
export const PROTECTED_ROUTES: RouteConfig[] = [
  {
    path: "/",
    component: ExecutiveDashboard,
    protected: true,
    title: "Dashboard Ejecutivo",
    description: "Panel ejecutivo con métricas y KPIs en tiempo real",
  },
  {
    path: "/finance",
    component: Finance,
    protected: true,
    permission: "view:finance",
    title: "Finanzas",
    description: "Gestión financiera y contabilidad",
  },
  {
    path: "/inventory",
    component: Inventory,
    protected: true,
    permission: "view:inventory",
    title: "Inventario",
    description: "Control de inventario y productos",
  },
  {
    path: "/inventory-movements",
    component: InventoryMovements,
    protected: true,
    permission: "view:inventory",
    title: "Movimientos de Inventario",
    description: "Historial de movimientos de inventario",
  },
  {
    path: "/sales",
    component: Sales,
    protected: true,
    permission: "view:sales",
    title: "Ventas",
    description: "Gestión de ventas y clientes",
  },
  {
    path: "/crm",
    component: CRMPage,
    protected: true,
    permission: "view:crm",
    title: "CRM",
    description: "Sistema avanzado de gestión de relaciones con clientes",
  },
  {
    path: "/crm/pipeline",
    component: PipelinePage,
    protected: true,
    permission: "view:crm",
    title: "Pipeline de Ventas",
    description: "Gestión visual del pipeline de ventas",
  },
  {
    path: "/crm/customers",
    component: CustomersPage,
    protected: true,
    permission: "view:crm",
    title: "Clientes CRM",
    description: "Base de datos de clientes y segmentación",
  },
  {
    path: "/crm/tickets",
    component: TicketsPage,
    protected: true,
    permission: "view:crm",
    title: "Tickets de Soporte",
    description: "Sistema de tickets y atención al cliente",
  },
  {
    path: "/crm/communications",
    component: CommunicationsPage,
    protected: true,
    permission: "view:crm",
    title: "Comunicaciones",
    description: "Historial de comunicaciones con clientes",
  },
  {
    path: "/crm/analytics",
    component: AnalyticsPage,
    protected: true,
    permission: "view:crm",
    title: "Análisis CRM",
    description: "Reportes y análisis de CRM",
  },
  {
    path: "/crm/automation",
    component: AutomationPage,
    protected: true,
    permission: "view:crm",
    title: "Automatización",
    description: "Workflows y automatización de procesos",
  },
  {
    path: "/pos",
    component: POSPage,
    protected: true,
    permission: "view:sales",
    title: "Punto de Venta",
    description: "Interfaz táctil para ventas rápidas",
  },
  // {
  //   path: "/mpos",
  //   component: mPOSPage,
  //   protected: true,
  //   permission: "view:sales",
  //   title: "mPOS (Ventas Móviles)",
  //   description: "Terminal de ventas optimizado para celulares",
  // },
  {
    path: "/invoice-preview",
    component: InvoicePreview,
    protected: true,
    permission: "view:sales",
    title: "Vista Previa de Factura",
    description: "Previsualización de facturas",
  },
  {
    path: "/accounts-receivable",
    component: AccountsReceivable,
    protected: true,
    permission: "view:finance",
    title: "Cuentas por Cobrar",
    description: "Gestión de cuentas por cobrar",
  },
  {
    path: "/accounts-payable",
    component: AccountsPayable,
    protected: true,
    permission: "view:finance",
    title: "Cuentas por Pagar",
    description: "Gestión de cuentas por pagar",
  },
  {
    path: "/banks",
    component: Banks,
    protected: true,
    permission: "view:finance",
    title: "Bancos",
    description: "Gestión de cuentas bancarias y conciliación",
  },
  {
    path: "/accounting",
    component: Accounting,
    protected: true,
    permission: "view:finance",
    title: "Contabilidad",
    description: "Plan de cuentas y estados financieros",
  },
  {
    path: "/purchases",
    component: Purchases,
    protected: true,
    permission: "view:purchases",
    title: "Compras",
    description: "Gestión de compras y proveedores",
  },
  {
    path: "/hr",
    component: HR,
    protected: true,
    permission: "view:hr",
    title: "Recursos Humanos",
    description: "Gestión de empleados y nómina",
  },
  // Sales Sub-pages
  {
    path: "/sales/clients",
    component: ClientsPage,
    protected: true,
    permission: "view:sales",
    title: "Clientes",
    description: "Gestión de clientes y cartera",
  },
  {
    path: "/sales/salespeople",
    component: SalespeoplePage,
    protected: true,
    permission: "view:sales",
    title: "Vendedores",
    description: "Gestión de vendedores y comisiones",
  },
  {
    path: "/sales/invoices",
    component: InvoicesPage,
    protected: true,
    permission: "view:sales",
    title: "Facturas",
    description: "Gestión de facturas de venta",
  },
  {
    path: "/sales/orders",
    component: OrdersPage,
    protected: true,
    permission: "view:sales",
    title: "Pedidos",
    description: "Gestión de pedidos",
  },
  {
    path: "/sales/dashboard",
    component: SalesDashboardPage,
    protected: true,
    permission: "view:sales",
    title: "Dashboard de Ventas",
    description: "Métricas y análisis consolidado de ventas",
  },
  // Inventory Sub-pages
  {
    path: "/inventory/products",
    component: ProductsPage,
    protected: true,
    permission: "view:inventory",
    title: "Productos",
    description: "Catálogo de productos",
  },
  {
    path: "/inventory/categories",
    component: CategoriesPage,
    protected: true,
    permission: "view:inventory",
    title: "Categorías",
    description: "Categorías de productos",
  },
  {
    path: "/inventory/pricelists",
    component: PriceListPage,
    protected: true,
    permission: "view:inventory",
    title: "Lista de Precios",
    description: "Lista completa de productos y precios",
  },

  {
    path: "/inventory/kardex",
    component: KardexPage,
    protected: true,
    permission: "view:inventory",
    title: "Kardex",
    description: "Libro mayor de inventario (Entradas y Salidas)",
  },
  {
    path: "/inventory/adjustments",
    component: AdjustmentsPage,
    protected: true,
    permission: "view:inventory",
    title: "Ajustes",
    description: "Ajustes de inventario",
  },
  {
    path: "/inventory/transfers",
    component: TransfersPage,
    protected: true,
    permission: "view:inventory",
    title: "Transferencias",
    description: "Transferencias entre almacenes",
  },
  // Purchases Sub-pages
  {
    path: "/purchases/dashboard",
    component: PurchaseOrdersPage,
    protected: true,
    permission: "view:purchases",
    title: "Dashboard de Compras",
    description: "Métricas y KPIs de adquisiciones",
  },
  {
    path: "/purchases/orders",
    component: PurchaseOrdersPage,
    protected: true,
    permission: "view:purchases",
    title: "Órdenes de Compra",
    description: "Gestión de órdenes de compra",
  },
  {
    path: "/purchases/receipts",
    component: ReceiptsPage,
    protected: true,
    permission: "view:purchases",
    title: "Recepciones",
    description: "Recepciones de mercancía",
  },
  {
    path: "/purchases/suppliers",
    component: SuppliersPage,
    protected: true,
    permission: "view:purchases",
    title: "Proveedores",
    description: "Directorio de proveedores",
  },
  {
    path: "/purchases/analytics",
    component: PurchasesPage,
    protected: true,
    permission: "view:purchases",
    title: "Análisis de Compras",
    description: "Análisis detallado de compras",
  },
  // HR Sub-pages
  {
    path: "/hr/employees",
    component: EmployeesPage,
    protected: true,
    permission: "view:hr",
    title: "Empleados",
    description: "Gestión de empleados",
  },
  {
    path: "/hr/payroll",
    component: PayrollPage,
    protected: true,
    permission: "view:hr",
    title: "Nómina",
    description: "Procesamiento de nómina",
  },
  {
    path: "/hr/attendance",
    component: AttendancePage,
    protected: true,
    permission: "view:hr",
    title: "Asistencia",
    description: "Control de asistencia",
  },
  // Reports Pages
  {
    path: "/reports/sales",
    component: SalesReportsPage,
    protected: true,
    permission: "view:reports",
    title: "Reportes de Ventas",
    description: "Análisis de ventas",
  },
  {
    path: "/reports/inventory",
    component: InventoryReportsPage,
    protected: true,
    permission: "view:reports",
    title: "Reportes de Inventario",
    description: "Análisis de inventario",
  },
  {
    path: "/reports/financial",
    component: FinancialReportsPage,
    protected: true,
    permission: "view:reports",
    title: "Reportes Financieros",
    description: "Estados financieros",
  },
  {
    path: "/ai",
    component: AI,
    protected: true,
    title: "Inteligencia Artificial",
    description: "Asistente de IA con 21 skills activas",
  },
  {
    path: "/ai/management",
    component: AIManagementPage,
    protected: true,
    title: "Gestión Completa de IA",
    description: "Dashboard, conversaciones, analytics, skills y configuración",
  },
  {
    path: "/settings",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Configuración",
    description: "Configuración del sistema",
  },
  {
    path: "/finance/dashboard",
    component: Finance,
    protected: true,
    permission: "view:finance",
    title: "Dashboard de Finanzas",
    description: "Métricas y análisis financiero",
  },
  {
    path: "/crm/analytics",
    component: CRMPage,
    protected: true,
    permission: "view:crm",
    title: "Dashboard CRM",
    description: "Análisis y métricas de clientes",
  },
  {
    path: "/hr/dashboard",
    component: HR,
    protected: true,
    permission: "view:hr",
    title: "Dashboard de RRHH",
    description: "Análisis visual de capital humano",
  },
  {
    path: "/settings/system",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Configuración del Sistema",
    description: "Gestión avanzada del sistema",
  },
  {
    path: "/finance/dashboard",
    component: Finance,
    protected: true,
    title: "Dashboard Financiero",
  },
  {
    path: "/finance/taxes",
    component: Finance,
    protected: true,
    title: "Configuración de Impuestos",
    description: "Tasas de cambio e impuestos",
  },
  {
    path: "/settings/company",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Configuración de Empresa",
    description: "Datos fiscales y de contacto",
  },
  {
    path: "/settings/users",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Gestión de Usuarios y Roles",
    description: "Administración de usuarios y sus permisos",
  },
  {
    path: "/settings/connectivity",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Conectividad",
    description: "Notificaciones e Integraciones",
  },
  {
    path: "/settings/ai",
    component: Settings,
    protected: true,
    permission: "view:settings",
    title: "Configuración de IA",
    description: "Asistente de inteligencia artificial",
  },
  {
    path: "/settings/password-requests",
    component: Settings,
    protected: true,
    permission: "settings:write",
    title: "Solicitudes de Contraseña",
    description: "Aprobar o rechazar solicitudes de cambio de contraseña",
  },
  {
    path: "/support",
    component: SupportPage,
    protected: true,
    title: "Soporte Técnico",
    description: "Centro de ayuda, diagnóstico y tickets de soporte",
  },
  {
    path: "/database",
    component: DatabasePage,
    protected: true,
    title: "Base de Datos",
    description: "Explorador de base de datos local (IndexedDB)",
  },
];

/**
 * 404 Route - Catch all
 */
export const NOT_FOUND_ROUTE: RouteConfig = {
  path: "*",
  component: NotFound,
  title: "Página No Encontrada",
};

/**
 * All Routes Combined
 */
export const ALL_ROUTES = [
  ...PUBLIC_ROUTES,
  ...PROTECTED_ROUTES,
  NOT_FOUND_ROUTE,
];

/**
 * Route Paths - For navigation
 */
export const ROUTE_PATHS = {
  LOGIN: "/login",
  DASHBOARD: "/",
  FINANCE: "/finance",
  INVENTORY: "/inventory",
  INVENTORY_MOVEMENTS: "/inventory-movements",
  SALES: "/sales",
  POS: "/pos",
  // MPOS: "/mpos",
  INVOICE_PREVIEW: "/invoice-preview",
  ACCOUNTS_RECEIVABLE: "/accounts-receivable",
  BANKS: "/finance/banks",
  ACCOUNTING: "/finance/accounting",
  ACCOUNTS_PAYABLE: "/finance/payable",
  PURCHASES: "/purchases",
  PURCHASES_DASHBOARD: "/purchases/dashboard",
  PURCHASES_ORDERS: "/purchases/orders",
  PURCHASES_RECEIPTS: "/purchases/receipts",
  PURCHASES_SUPPLIERS: "/purchases/suppliers",
  PURCHASES_ANALYTICS: "/purchases/analytics",
  HR: "/hr",
  AI: "/ai",
  SETTINGS: "/settings",
  PASSWORD_REQUESTS: "/settings/password-requests",
  CONNECTIVITY_ERROR: "/connectivity-error",
  UNAUTHORIZED: "/unauthorized",
} as const;

/**
 * Type for route paths
 */
export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
