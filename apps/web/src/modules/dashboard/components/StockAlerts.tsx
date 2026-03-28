import React, { useState, useEffect } from "react";
import { AlertTriangle, Package, TrendingDown, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { cn } from "@/core/shared/utils/utils";

interface StockAlert {
  id: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  severity: "critical" | "warning" | "low";
}

export const StockAlerts: React.FC = () => {
  const { activeTenantId } = useSystemConfig();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadStockAlerts();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStockAlerts, 30000);
    return () => clearInterval(interval);
  }, [activeTenantId]);

  const loadStockAlerts = async () => {
    if (!activeTenantId) return;

    try {
      const products = await localDb.products
        .where("tenant_id")
        .equals(activeTenantId)
        .toArray();

      const lowStockProducts = products
        .filter((p) => p.stock <= p.minStock)
        .map((p) => {
          let severity: "critical" | "warning" | "low" = "low";
          
          if (p.stock === 0) {
            severity = "critical";
          } else if (p.stock < p.minStock * 0.5) {
            severity = "critical";
          } else if (p.stock < p.minStock * 0.75) {
            severity = "warning";
          }

          return {
            id: p.id,
            productName: p.name,
            productCode: p.cauplas || p.id,
            currentStock: p.stock,
            minStock: p.minStock,
            severity,
          };
        })
        .sort((a, b) => {
          // Ordenar por severidad (crítico primero)
          const severityOrder = { critical: 0, warning: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });

      setAlerts(lowStockProducts);
    } catch (error) {
      console.error("Error loading stock alerts:", error);
    }
  };

  if (!isVisible || alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <Card className="border-2 border-red-500/50 bg-red-50/50 dark:bg-red-950/20 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-black italic tracking-tight">
                Alertas de Inventario
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alerts.length} producto(s) requieren atención
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Crítico{criticalCount > 1 ? "s" : ""}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="bg-amber-500 text-white gap-1">
              <TrendingDown className="h-3 w-3" />
              {warningCount} Advertencia{warningCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer",
                  alert.severity === "critical" &&
                    "border-red-500/50 bg-red-100/50 dark:bg-red-950/30",
                  alert.severity === "warning" &&
                    "border-amber-500/50 bg-amber-100/50 dark:bg-amber-950/30",
                  alert.severity === "low" &&
                    "border-orange-500/50 bg-orange-100/50 dark:bg-orange-950/30"
                )}
                onClick={() => navigate(`/inventory?search=${alert.productCode}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-bold">{alert.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {alert.productCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-lg font-black italic",
                        alert.severity === "critical" && "text-red-500",
                        alert.severity === "warning" && "text-amber-500",
                        alert.severity === "low" && "text-orange-500"
                      )}
                    >
                      {alert.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Min: {alert.minStock}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => navigate("/inventory")}
          >
            Ver Inventario
          </Button>
          <Button
            variant="default"
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
            onClick={() => navigate("/purchases")}
          >
            Crear Orden de Compra
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
