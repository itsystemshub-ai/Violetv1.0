import React, { useState } from "react";
import {
  Landmark,
  Activity,
  Archive,
  Users,
  Settings2,
  CheckCircle2,
  EyeOff,
  Brain,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RevenueChart } from "@/shared/components/common/Charts";
import { cn } from "@/core/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { useDashboardStore, WidgetId } from "../../store/useDashboardStore";
import { SortableWidget } from "./SortableWidget";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/shared/components/ui/badge";

interface DashboardMainContentProps {
  charts: { revenue: any[] };
  insights: {
    sales: any[];
    finance: any[];
    inventory: any[];
    hr: any[];
  };
  suggestedPurchases?: any[];
}

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  accentColor: string;
  glowColor: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  icon,
  items,
  accentColor,
  glowColor,
}) => {
  return (
    <div
      className={cn(
        "group relative rounded-3xl p-6 backdrop-blur-xl bg-card/80 border transition-all duration-500 h-full",
        "hover:shadow-2xl hover:-translate-y-1",
        `border-${accentColor}/30 hover:border-${accentColor}/60 hover:shadow-${glowColor}`,
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
          `bg-linear-to-br from-${accentColor}/20 to-transparent`,
        )}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            `bg-linear-to-br from-${accentColor}/20 to-${accentColor}/5 border border-${accentColor}/30`,
          )}
        >
          <div className={`text-${accentColor}`}>{icon}</div>
        </div>
        <h3 className="text-lg font-black text-foreground tracking-tight">
          {title}
        </h3>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm text-muted-foreground font-medium">
              {item.label}
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                item.status === "success" && "text-lime-500 dark:text-lime-400",
                item.status === "warning" &&
                  "text-amber-500 dark:text-amber-400",
                item.status === "danger" && "text-rose-500 dark:text-rose-400",
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AIPurchaseSuggestions: React.FC<{ items: any[] }> = ({ items }) => {
  if (items && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
        <h4 className="font-bold text-foreground">Stock Optimizado</h4>
        <p className="text-sm text-muted-foreground mt-2">
          No se requieren compras urgentes según la IA.
        </p>
      </div>
    );
  }

  const list = items || [];

  return (
    <div className="group relative rounded-3xl p-6 backdrop-blur-xl bg-cyan-500/5 border border-cyan-500/30 transition-all duration-500 h-full hover:shadow-2xl hover:border-cyan-500/60">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
          <Brain className="text-cyan-600 dark:text-cyan-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">
            AI Purchase Suggestions
          </h3>
          <p className="text-[10px] text-cyan-600 font-black uppercase tracking-widest">
            Reabastecimiento Inteligente
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {list.slice(0, 4).map((product, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-primary/10 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground truncate max-w-[140px]">
                {product.name || product.descripcionManguera}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black">
                {product.cauplas || "S/N"}
              </span>
            </div>
            <div className="text-right">
              <div className="text-rose-600 dark:text-rose-400 font-black text-[10px] flex items-center justify-end gap-1 animate-pulse">
                <Clock size={10} />
                Urgente
              </div>
              <div className="text-[10px] text-muted-foreground font-bold">
                Refill:{" "}
                <span className="text-cyan-600">
                  +{Math.max(product.minStock * 2, 10)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {list.length > 4 && (
          <div className="pt-2 text-center">
            <Button
              variant="link"
              className="text-[10px] h-auto p-0 text-cyan-600 font-black uppercase tracking-widest"
            >
              Ver {list.length - 4} más →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
  charts,
  insights,
  suggestedPurchases,
}) => {
  const {
    widgetOrder,
    hiddenWidgets,
    setWidgetOrder,
    toggleWidgetVisibility,
    resetLayout,
  } = useDashboardStore();
  const [isEditMode, setIsEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgetOrder.indexOf(active.id as WidgetId);
      const newIndex = widgetOrder.indexOf(over?.id as WidgetId);
      setWidgetOrder(arrayMove(widgetOrder, oldIndex, newIndex));
    }
  };

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case "revenue_chart":
        return (
          <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl p-6 h-full shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-foreground tracking-tight">
                Crecimiento de Ingresos
              </h3>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20"
              >
                Real-time
              </Badge>
            </div>
            <RevenueChart data={charts.revenue} />
          </div>
        );
      case "top_products":
        return (
          <InsightCard
            title="Top Productos"
            icon={<Archive size={20} />}
            items={insights.sales || []}
            accentColor="blue-500"
            glowColor="blue-500/20"
          />
        );
      case "financial_balance":
        return (
          <InsightCard
            title="Balance Financiero"
            icon={<Landmark size={20} />}
            items={insights.finance || []}
            accentColor="emerald-500"
            glowColor="emerald-500/20"
          />
        );
      case "critical_stock":
        return (
          <InsightCard
            title="Stock Crítico"
            icon={<Activity size={20} />}
            items={insights.inventory || []}
            accentColor="rose-500"
            glowColor="rose-500/20"
          />
        );
      case "human_resources":
        return (
          <InsightCard
            title="Recursos Humanos"
            icon={<Users size={20} />}
            items={insights.hr || []}
            accentColor="indigo-500"
            glowColor="indigo-500/20"
          />
        );
      case "ai_purchase_suggestions":
        return <AIPurchaseSuggestions items={suggestedPurchases || []} />;
      default:
        return null;
    }
  };

  return (
    <div className="col-span-1 lg:col-span-2 space-y-8">
      {/* Header with control */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">
              Smart Dashboard
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Personaliza tu vista con drag & drop
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
                className="rounded-xl border-dashed"
              >
                Resetear Dashboard
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditMode(false)}
                className="rounded-xl bg-primary shadow-lg shadow-primary/25"
              >
                Finalizar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="rounded-xl px-4"
            >
              Editar Layout
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {widgetOrder
              .filter((id) => !hiddenWidgets.includes(id))
              .map((id) => (
                <SortableWidget key={id} id={id} isEditMode={isEditMode}>
                  <div className="h-full relative">
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWidgetVisibility(id);
                        }}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg backdrop-blur-md border border-rose-500/20"
                        title="Ocultar Widget"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    {renderWidget(id)}
                  </div>
                </SortableWidget>
              ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DashboardMainContent;
