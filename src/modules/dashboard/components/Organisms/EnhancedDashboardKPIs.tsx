import React from 'react';
import { EnhancedKPICard } from '@/shared/components/common/EnhancedKPICard';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Landmark, 
  CreditCard, 
  Download,
  DollarSign,
  Users,
  ShoppingCart,
  Package
} from 'lucide-react';

interface EnhancedDashboardKPIsProps {
  data?: {
    sales: { 
      totalSalesVolume: number;
      totalOrders?: number;
      activeCustomers?: number;
    };
    finance: {
      totalRevenue?: number;
      totalExpenses: number;
      margin: number;
      totalAssets: number;
      pendingPayables: number;
      pendingReceivables: number;
    };
    inventory?: {
      totalProducts?: number;
      lowStockItems?: number;
    };
  };
  loading?: boolean;
}

/**
 * Enhanced Dashboard KPIs - Diseñado con UI/UX Pro Max
 * 
 * Características aplicadas:
 * - Data-Dense Dashboard style
 * - Hover tooltips con información adicional
 * - Smooth transitions (200ms)
 * - Metric pulse animation
 * - Badge hover effects
 * - Accesibilidad WCAG AA
 * - Responsive grid layout
 */
const EnhancedDashboardKPIs: React.FC<EnhancedDashboardKPIsProps> = ({ 
  data,
  loading = false 
}) => {
  if (!data && !loading) return null;

  return (
    <div className="space-y-6">
      {/* Sección: Ventas */}
      <section aria-labelledby="sales-heading">
        <h2 
          id="sales-heading" 
          className="text-lg font-semibold text-text mb-4 font-heading"
        >
          Ventas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedKPICard
            label="Volumen de Ventas"
            value={`$${data?.sales.totalSalesVolume?.toLocaleString() || 0}`}
            change={8.2}
            trend="up"
            icon={Activity}
            description="Ventas totales del mes actual"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Órdenes Totales"
            value={data?.sales.totalOrders?.toLocaleString() || 0}
            change={12.5}
            trend="up"
            icon={ShoppingCart}
            description="Número de órdenes procesadas"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Clientes Activos"
            value={data?.sales.activeCustomers?.toLocaleString() || 0}
            change={5.3}
            trend="up"
            icon={Users}
            description="Clientes con compras este mes"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Ticket Promedio"
            value={`$${((data?.sales.totalSalesVolume || 0) / (data?.sales.totalOrders || 1)).toFixed(2)}`}
            change={3.1}
            trend="up"
            icon={DollarSign}
            description="Valor promedio por orden"
            loading={loading}
          />
        </div>
      </section>

      {/* Sección: Finanzas */}
      <section aria-labelledby="finance-heading">
        <h2 
          id="finance-heading" 
          className="text-lg font-semibold text-text mb-4 font-heading"
        >
          Finanzas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EnhancedKPICard
            label="Ingresos Totales"
            value={`$${data?.finance.totalRevenue?.toLocaleString() || 0}`}
            change={10.2}
            trend="up"
            icon={TrendingUp}
            description="Ingresos brutos del período"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Egresos Totales"
            value={`$${data?.finance.totalExpenses?.toLocaleString() || 0}`}
            change={5.4}
            trend="down"
            icon={CreditCard}
            description="Gastos operativos totales"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Margen de Ganancia"
            value={`${data?.finance.margin?.toFixed(1) || 0}%`}
            change={1.5}
            trend="up"
            icon={Zap}
            description="Margen neto de utilidad"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Liquidez (Activos)"
            value={`$${data?.finance.totalAssets?.toLocaleString() || 0}`}
            change={2.1}
            trend="up"
            icon={Landmark}
            description="Total de activos líquidos"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Cuentas por Pagar"
            value={`$${data?.finance.pendingPayables?.toLocaleString() || 0}`}
            change={15}
            trend="down"
            icon={CreditCard}
            description="Obligaciones pendientes"
            loading={loading}
          />
          
          <EnhancedKPICard
            label="Cuentas por Cobrar"
            value={`$${data?.finance.pendingReceivables?.toLocaleString() || 0}`}
            change={4.2}
            trend="up"
            icon={Download}
            description="Facturas por cobrar"
            loading={loading}
          />
        </div>
      </section>

      {/* Sección: Inventario */}
      {data?.inventory && (
        <section aria-labelledby="inventory-heading">
          <h2 
            id="inventory-heading" 
            className="text-lg font-semibold text-text mb-4 font-heading"
          >
            Inventario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <EnhancedKPICard
              label="Productos Totales"
              value={data.inventory.totalProducts?.toLocaleString() || 0}
              change={2.3}
              trend="up"
              icon={Package}
              description="SKUs activos en inventario"
              loading={loading}
            />
            
            <EnhancedKPICard
              label="Stock Bajo"
              value={data.inventory.lowStockItems?.toLocaleString() || 0}
              change={8.5}
              trend="down"
              icon={Package}
              description="Productos con stock crítico"
              loading={loading}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default EnhancedDashboardKPIs;
