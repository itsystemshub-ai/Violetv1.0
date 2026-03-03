import React from "react";
import { TrendingUp, Receipt, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InsightCard } from "@/components/Cards";
import { formatCurrency } from "@/lib/index";

interface PurchasesInsightsProps {
  suppliers: any[];
  compras: any[];
}

const PurchasesInsights: React.FC<PurchasesInsightsProps> = ({
  suppliers,
  compras,
}) => {
  const processedPurchases = compras.filter((c) => c.estatus === "PROCESADA");
  const pendingRetentions = processedPurchases.length * 45; // Mock calculation logic

  return (
    <div className="space-y-6">
      <InsightCard
        title="Proveedores Estratégicos"
        subtitle="Mayor volumen de compra"
        icon={TrendingUp}
        items={suppliers.slice(0, 4).map((s) => ({
          label: s.name,
          value: s.rif,
          status: s.category,
        }))}
      />

      <Card className="bg-linear-to-br from-[#1E2229] to-[#0F1115] border-white/10 rounded-3xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-violet-400" />
          Retenciones Pendientes
        </h3>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-violet-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Total por declarar
              </span>
              <Badge
                variant="outline"
                className="text-[9px] text-amber-400 border-amber-400/20 bg-amber-400/5"
              >
                Periodo Actual
              </Badge>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">
              {formatCurrency(pendingRetentions, "USD")}
            </div>
            <Button
              variant="link"
              className="text-violet-400 p-0 h-auto text-xs mt-4 flex items-center gap-1 group/btn"
            >
              Generar XML SENIAT
              <ArrowUpRight
                size={12}
                className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
              />
            </Button>
          </div>
        </div>
      </Card>

      <div className="p-6 rounded-3xl bg-violet-600/10 border border-violet-500/20">
        <p className="text-xs text-violet-300/80 italic leading-relaxed">
          "El sistema sugiere diversificar proveedores en la categoría operativa
          para optimizar el CPP trimestral."
        </p>
      </div>
    </div>
  );
};

export default PurchasesInsights;
