/**
 * ValerySidebar - Panel lateral de navegación estilo Valery
 * Módulos organizados por categoría con iconos grandes
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/lib/utils';

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
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: ShoppingCart,
    children: [
      { id: 'facturas', label: 'Facturas', icon: FileText, path: '/sales/invoices' },
      { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, path: '/sales/quotes' },
      { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag, path: '/sales/orders' },
      { id: 'pos', label: 'Punto de Venta', icon: CreditCard, path: '/sales/pos', badge: 'Nuevo' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Package,
    children: [
      { id: 'productos', label: 'Productos', icon: Package, path: '/inventory/products' },
      { id: 'categorias', label: 'Categorías', icon: Package, path: '/inventory/categories' },
      { id: 'ajustes', label: 'Ajustes', icon: Package, path: '/inventory/adjustments' },
      { id: 'transferencias', label: 'Transferencias', icon: Package, path: '/inventory/transfers' },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    icon: ShoppingBag,
    children: [
      { id: 'ordenes', label: 'Órdenes de Compra', icon: ShoppingBag, path: '/purchases/orders' },
      { id: 'recepciones', label: 'Recepciones', icon: ShoppingBag, path: '/purchases/receipts' },
      { id: 'proveedores', label: 'Proveedores', icon: Users, path: '/purchases/suppliers' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: DollarSign,
    children: [
      { id: 'cxc', label: 'Cuentas por Cobrar', icon: CreditCard, path: '/finance/receivables' },
      { id: 'cxp', label: 'Cuentas por Pagar', icon: CreditCard, path: '/finance/payables', badge: 'Nuevo' },
      { id: 'bancos', label: 'Bancos', icon: Landmark, path: '/finance/banks', badge: 'Nuevo' },
      { id: 'contabilidad', label: 'Contabilidad', icon: Calculator, path: '/finance/accounting', badge: 'Nuevo' },
    ],
  },
  {
    id: 'rrhh',
    label: 'Recursos Humanos',
    icon: UserCog,
    children: [
      { id: 'empleados', label: 'Empleados', icon: Users, path: '/hr/employees' },
      { id: 'nomina', label: 'Nómina', icon: DollarSign, path: '/hr/payroll' },
      { id: 'asistencia', label: 'Asistencia', icon: UserCog, path: '/hr/attendance' },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    children: [
      { id: 'ventas-rep', label: 'Reportes de Ventas', icon: BarChart3, path: '/reports/sales' },
      { id: 'inventario-rep', label: 'Reportes de Inventario', icon: BarChart3, path: '/reports/inventory' },
      { id: 'financieros', label: 'Reportes Financieros', icon: BarChart3, path: '/reports/financial' },
    ],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    path: '/settings',
  },
];

export const ValerySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['ventas', 'inventario']);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
            'w-full justify-start gap-3 h-10 px-3',
            level > 0 && 'pl-10',
            active && 'bg-primary/10 text-primary font-medium'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else if (item.path) {
              handleNavigate(item.path);
            }
          }}
        >
          <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
          <span className="flex-1 text-left text-sm">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          )}
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
