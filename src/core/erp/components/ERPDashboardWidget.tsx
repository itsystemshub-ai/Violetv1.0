/**
 * ERPDashboardWidget - Widget de Dashboard para el ERP
 *
 * Componente React que muestra los KPIs integrados del ERP,
 * incluyendo ventas del día, órdenes pendientes, stock bajo, y más.
 *
 * @module core/erp/components/ERPDashboardWidget
 */

import React, { useState, useEffect } from "react";
import { erpReportsService } from "@/core/erp/reports/ERPReportsService";
import { erpNotificationService } from "@/core/erp/notifications/ERPNotificationService";
import { companyContext } from "@/core/erp/company-context/CompanyContext";
import {
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DashboardKPIs {
  todaySales: number;
  pendingOrders: number;
  lowStockCount: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
}

export const ERPDashboardWidget: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notifications, setNotifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const companyId = companyContext.getCompanyId();

  useEffect(() => {
    if (companyId) {
      loadDashboardData();
    }
  }, [companyId]);

  const loadDashboardData = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Cargar KPIs
      const kpisData = await erpReportsService.getQuickKPIs(companyId);
      setKpis(kpisData);

      // Cargar notificaciones no leídas
      const unreadCount =
        await erpNotificationService.getUnreadCount(companyId);
      setNotifications(unreadCount);

      // Cargar actividad reciente (simulada por ahora)
      setRecentActivity([
        {
          id: "1",
          type: "sale",
          description: "Venta completada: $1,250",
          time: "Hace 5 min",
        },
        {
          id: "2",
          type: "purchase",
          description: "Orden de compra recibida",
          time: "Hace 15 min",
        },
        {
          id: "3",
          type: "inventory",
          description: "Ajuste de inventario realizado",
          time: "Hace 30 min",
        },
        {
          id: "4",
          type: "workflow",
          description: "Aprobación de compra pendiente",
          time: "Hace 1 hora",
        },
      ]);
    } catch (error) {
      console.error("[ERPDashboard] Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard ERP</h2>
        {notifications > 0 && (
          <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {notifications} notificaciones
            </span>
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas de Hoy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Hoy</p>
              <p className="text-2xl font-bold">
                {formatCurrency(kpis?.todaySales || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Órdenes Pendientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Órdenes Pendientes</p>
              <p className="text-2xl font-bold">{kpis?.pendingOrders || 0}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos Stock Bajo</p>
              <p className="text-2xl font-bold">{kpis?.lowStockCount || 0}</p>
            </div>
            <Package className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Aprobaciones Pendientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aprobaciones</p>
              <p className="text-2xl font-bold">
                {kpis?.pendingApprovals || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {activity.type === "sale" && (
                <TrendingUp className="w-5 h-5 text-green-500" />
              )}
              {activity.type === "purchase" && (
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              )}
              {activity.type === "inventory" && (
                <Package className="w-5 h-5 text-yellow-500" />
              )}
              {activity.type === "workflow" && (
                <CheckCircle className="w-5 h-5 text-purple-500" />
              )}

              <div className="flex-1">
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors">
            <DollarSign className="w-5 h-5" />
            <span>Nueva Venta</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span>Nueva Compra</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">
            <Package className="w-5 h-5" />
            <span>Ajustar Stock</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors">
            <CheckCircle className="w-5 h-5" />
            <span>Ver Aprobaciones</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ERPDashboardWidget;
