import React from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/core/shared/utils/utils";

interface DashboardHeaderProps {
  tenantName: string;
  activeRange: string;
  onRangeChange: (range: "today" | "week" | "month" | "year") => void;
  onPickerOpen: (type: "week" | "month" | "year") => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  tenantName,
  activeRange,
  onRangeChange,
  onPickerOpen,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.2)] dark:drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          Centro de Control
        </h1>
        <p className="text-muted-foreground font-medium text-sm">
          Resumen ejecutivo del inquilino:{" "}
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{tenantName}</span>
        </p>
      </div>
      <div className="flex items-center gap-2 backdrop-blur-xl bg-card/80 p-1.5 rounded-2xl border border-border shadow-lg">
        {[
          { id: "today", label: "Hoy", action: () => onRangeChange("today") },
          { id: "week", label: "Semana", action: () => onPickerOpen("week") },
          { id: "month", label: "Mes", action: () => onPickerOpen("month") },
          { id: "year", label: "Año", action: () => onPickerOpen("year") },
        ].map((range) => (
          <Button
            key={range.id}
            size="sm"
            variant="ghost"
            className={cn(
              "text-[10px] font-black px-4 rounded-xl transition-all duration-300 uppercase tracking-widest",
              activeRange === range.id
                ? "bg-linear-to-r from-cyan-500 to-magenta-600 text-white shadow-lg shadow-cyan-500/50"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={range.action as any}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
