/**
 * ValerySidebar - Panel lateral de navegación estilo Valery
 * Módulos organizados por categoría con iconos grandes
 */

// Trigger rebuild - Sparkles fix verification
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  DollarSign,
  CreditCard,
  Landmark,
  Calculator,
  UserCog,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  Building2,
  Bell,
  Plug,
  Sparkles,
  Headphones,
  Database,
  Smartphone,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/core/shared/utils/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard-executive",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: ShoppingCart,
    children: [
      {
        id: "dashboard-ventas",
        label: "Dashboard",
        icon: BarChart3,
        path: "/sales",
      },
      {
        id: "clientes",
        label: "Clientes",
        icon: Users,
        path: "/sales/clients",
      },
      {
        id: "vendedores",
        label: "Vendedores",
        icon: UserCog,
        path: "/sales/salespeople",
      },
      {
        id: "pos",
        label: "Punto de Venta",
        icon: CreditCard,
        path: "/pos",
        badge: "Nuevo",
      },
      {
        id: "pedidos",
        label: "Pedidos",
        icon: ShoppingBag,
        path: "/sales/orders",
      },
      {
        id: "facturas",
        label: "Facturas",
        icon: FileText,
        path: "/sales/invoices",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Users,
    badge: "Nuevo",
    children: [
      {
        id: "pipeline",
        label: "Pipeline",
        icon: BarChart3,
        path: "/crm/pipeline",
      },
      {
        id: "clientes-crm",
        label: "Clientes",
        icon: Users,
        path: "/crm/customers",
      },
      { id: "tickets", label: "Tickets", icon: FileText, path: "/crm/tickets" },
      {
        id: "comunicaciones",
        label: "Comunicaciones",
        icon: FileText,
        path: "/crm/communications",
      },
      {
        id: "analisis",
        label: "Análisis",
        icon: BarChart3,
        path: "/crm/analytics",
      },
      {
        id: "automatizacion",
        label: "Automatización",
        icon: Settings,
        path: "/crm/automation",
      },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: Package,
    children: [
      {
        id: "inventario-dash",
        label: "Dashboard",
        icon: BarChart3,
        path: "/inventory",
      },
      {
        id: "productos",
        label: "Productos",
        icon: Package,
        path: "/inventory/products",
      },
      {
        id: "lista-precios",
        label: "Lista de Precios",
        icon: FileText,
        path: "/inventory/catalog",
      },
      {
        id: "stats-inv",
        label: "Estadísticas",
        icon: BarChart3,
        path: "/inventory/stats",
      },
      {
        id: "analitica-inv",
        label: "Analítica IA",
        icon: Sparkles,
        path: "/inventory/analytics",
      },
    ],
  },
  {
    id: "inventario-extra",
    label: "Operaciones",
    icon: Database,
    children: [
      {
        id: "kardex",
        label: "Kardex",
        icon: FileText,
        path: "/inventory/kardex",
      },

      {
        id: "categorias",
        label: "Categorías",
        icon: Package,
        path: "/inventory/categories",
      },
      {
        id: "ajustes",
        label: "Ajustes",
        icon: Package,
        path: "/inventory/adjustments",
      },
      {
        id: "transferencias",
        label: "Transferencias",
        icon: Package,
        path: "/inventory/transfers",
      },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    icon: ShoppingBag,
    children: [
      {
        id: "compras-dash",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/purchases/dashboard",
      },
      {
        id: "ordenes",
        label: "Órdenes de Compra",
        icon: ShoppingBag,
        path: "/purchases/orders",
      },
      {
        id: "recepciones",
        label: "Recepciones",
        icon: ShoppingBag,
        path: "/purchases/receipts",
      },
      {
        id: "proveedores",
        label: "Proveedores",
        icon: Users,
        path: "/purchases/suppliers",
      },
      {
        id: "compras-analisis",
        label: "Análisis",
        icon: BarChart3,
        path: "/purchases/analytics",
      },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: DollarSign,
    children: [
      {
        id: "monedas",
        label: "Monedas",
        icon: DollarSign,
        path: "/currencies",
      },
      {
        id: "cxc",
        label: "Cuentas por Cobrar",
        icon: CreditCard,
        path: "/accounts-receivable",
      },
      {
        id: "cxp",
        label: "Cuentas por Pagar",
        icon: CreditCard,
        path: "/accounts-payable",
        badge: "Nuevo",
      },
      {
        id: "bancos",
        label: "Bancos",
        icon: Landmark,
        path: "/banks",
        badge: "Nuevo",
      },
      {
        id: "contabilidad",
        label: "Contabilidad",
        icon: Calculator,
        path: "/accounting",
        badge: "Nuevo",
      },
    ],
  },
  {
    id: "rrhh",
    label: "Recursos Humanos",
    icon: UserCog,
    children: [
      {
        id: "empleados",
        label: "Empleados",
        icon: Users,
        path: "/hr/employees",
      },
      { id: "nomina", label: "Nómina", icon: DollarSign, path: "/hr/payroll" },
      {
        id: "asistencia",
        label: "Asistencia",
        icon: UserCog,
        path: "/hr/attendance",
      },
    ],
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: BarChart3,
    children: [
      {
        id: "ventas-rep",
        label: "Reportes de Ventas",
        icon: BarChart3,
        path: "/reports/sales",
      },
      {
        id: "inventario-rep",
        label: "Reportes de Inventario",
        icon: BarChart3,
        path: "/reports/inventory",
      },
      {
        id: "financieros",
        label: "Reportes Financieros",
        icon: BarChart3,
        path: "/reports/financial",
      },
    ],
  },
  {
    id: "ia",
    label: "Inteligencia Artificial",
    icon: Settings,
    path: "/ai/management",
  },
  {
    id: "soporte",
    label: "Soporte Técnico",
    icon: Headphones,
    path: "/support",
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    children: [
      {
        id: "config-seguridad",
        label: "Sistema y Seguridad",
        icon: Shield,
        path: "/settings/security",
      },
      {
        id: "config-empresa",
        label: "Empresa",
        icon: Building2,
        path: "/settings/company",
      },
      {
        id: "config-impuestos",
        label: "Impuestos",
        icon: DollarSign,
        path: "/settings/taxes",
      },
      {
        id: "config-usuarios",
        label: "Usuarios",
        icon: Users,
        path: "/settings/users",
      },
      {
        id: "config-notificaciones",
        label: "Notificaciones",
        icon: Bell,
        path: "/settings/notifications",
      },
      {
        id: "config-integraciones",
        label: "Integraciones",
        icon: Plug,
        path: "/settings/integrations",
      },
      { id: "config-ia", label: "IA", icon: Sparkles, path: "/settings/ai" },
      {
        id: "roles-permisos",
        label: "Roles y Permisos",
        icon: Shield,
        path: "/settings/roles",
      },
      {
        id: "password-requests",
        label: "Solicitudes de Clave",
        icon: Shield,
        path: "/settings/password-requests",
      },
      {
        id: "config-database",
        label: "Base de Datos",
        icon: Database,
        path: "/database",
      },
      {
        id: "config-automation",
        label: "Centro de Automatización",
        icon: Sparkles,
        path: "/settings/automation",
        badge: "Pro",
      },
    ],
  },
];

export const ValerySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand current module and collapse others
  React.useEffect(() => {
    const currentPath = location.pathname;
    let itemToExpand: string | null = null;

    // First, find exact or deepest match
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) =>
            child.path &&
            (currentPath === child.path ||
              currentPath.startsWith(child.path + "/")),
        );
        if (hasActiveChild) {
          itemToExpand = item.id;
        }
      } else if (
        item.path &&
        (currentPath === item.path || currentPath.startsWith(item.path + "/"))
      ) {
        // If it's a top level item with path, it might be the "active" section
        // but usually these don't expand.
      }
    });

    if (itemToExpand) {
      setExpandedItems([itemToExpand]);
    }
  }, [location.pathname]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 px-3",
            level > 0 && "pl-10",
            active && "bg-primary/10 text-primary font-medium",
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else if (item.path) {
              handleNavigate(item.path);
            }
          }}
        >
          <item.icon
            className={cn("h-4 w-4 shrink-0", active && "text-primary")}
          />
          <span className="flex-1 text-left text-sm">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.badge}
            </Badge>
          )}
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ))}
        </Button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-1">
      {menuItems.map((item) => renderMenuItem(item))}
    </div>
  );
};

export default ValerySidebar;
