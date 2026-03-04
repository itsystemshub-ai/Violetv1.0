/**
 * Routes Configuration
 * 
 * Arquitectura: Configuration as Code
 * - Centraliza todas las rutas de la aplicación
 * - Type-safe route definitions
 * - Facilita refactoring y mantenimiento
 */

import { lazy, ComponentType } from 'react';

// Lazy-loaded Pages
const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'));
const Finance = lazy(() => import('@/features/finance/pages/Finance'));
const Inventory = lazy(() => import('@/features/inventory/pages/Inventory'));
const Sales = lazy(() => import('@/features/sales/pages/Sales'));
const Purchases = lazy(() => import('@/features/purchases/pages/Purchases'));
const HR = lazy(() => import('@/features/hr/pages/HR'));
const Settings = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const Login = lazy(() => import('@/features/auth/pages/Login'));
const InvoicePreview = lazy(() => import('@/modules/sales/pages/InvoicePreviewPage'));
const AccountsReceivable = lazy(() => import('@/modules/accounts-receivable/pages/AccountsReceivablePage'));
const InventoryMovements = lazy(() => import('@/features/inventory/pages/InventoryMovements'));

// Error Pages
const ConnectivityError = lazy(() => import('@/shared/pages/ConnectivityError'));
const Unauthorized = lazy(() => import('@/shared/pages/Unauthorized'));
const NotFound = lazy(() => import('@/shared/pages/not-found/Index'));

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
    path: '/login',
    component: Login,
    title: 'Iniciar Sesión',
    description: 'Página de autenticación',
  },
  {
    path: '/connectivity-error',
    component: ConnectivityError,
    title: 'Error de Conectividad',
  },
  {
    path: '/unauthorized',
    component: Unauthorized,
    title: 'No Autorizado',
  },
];

/**
 * Protected Routes - Authentication required
 */
export const PROTECTED_ROUTES: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
    protected: true,
    title: 'Dashboard',
    description: 'Panel principal con métricas y KPIs',
  },
  {
    path: '/finance',
    component: Finance,
    protected: true,
    permission: 'view:finance',
    title: 'Finanzas',
    description: 'Gestión financiera y contabilidad',
  },
  {
    path: '/inventory',
    component: Inventory,
    protected: true,
    permission: 'view:inventory',
    title: 'Inventario',
    description: 'Control de inventario y productos',
  },
  {
    path: '/inventory-movements',
    component: InventoryMovements,
    protected: true,
    permission: 'view:inventory',
    title: 'Movimientos de Inventario',
    description: 'Historial de movimientos de inventario',
  },
  {
    path: '/sales',
    component: Sales,
    protected: true,
    permission: 'view:sales',
    title: 'Ventas',
    description: 'Gestión de ventas y clientes',
  },
  {
    path: '/invoice-preview',
    component: InvoicePreview,
    protected: true,
    permission: 'view:sales',
    title: 'Vista Previa de Factura',
    description: 'Previsualización de facturas',
  },
  {
    path: '/accounts-receivable',
    component: AccountsReceivable,
    protected: true,
    permission: 'view:finance',
    title: 'Cuentas por Cobrar',
    description: 'Gestión de cuentas por cobrar',
  },
  {
    path: '/purchases',
    component: Purchases,
    protected: true,
    permission: 'view:purchases',
    title: 'Compras',
    description: 'Gestión de compras y proveedores',
  },
  {
    path: '/hr',
    component: HR,
    protected: true,
    permission: 'view:hr',
    title: 'Recursos Humanos',
    description: 'Gestión de empleados y nómina',
  },
  {
    path: '/settings',
    component: Settings,
    protected: true,
    permission: 'view:settings',
    title: 'Configuración',
    description: 'Configuración del sistema',
  },
];

/**
 * 404 Route - Catch all
 */
export const NOT_FOUND_ROUTE: RouteConfig = {
  path: '*',
  component: NotFound,
  title: 'Página No Encontrada',
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
  LOGIN: '/login',
  DASHBOARD: '/',
  FINANCE: '/finance',
  INVENTORY: '/inventory',
  INVENTORY_MOVEMENTS: '/inventory-movements',
  SALES: '/sales',
  INVOICE_PREVIEW: '/invoice-preview',
  ACCOUNTS_RECEIVABLE: '/accounts-receivable',
  PURCHASES: '/purchases',
  HR: '/hr',
  SETTINGS: '/settings',
  CONNECTIVITY_ERROR: '/connectivity-error',
  UNAUTHORIZED: '/unauthorized',
} as const;

/**
 * Type for route paths
 */
export type RoutePath = typeof ROUTE_PATHS[keyof typeof ROUTE_PATHS];
