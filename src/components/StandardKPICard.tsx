import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StandardKPICardProps {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  icon: LucideIcon;
  accentColor?: string;
  glowColor?: string;
}

export const StandardKPICard: React.FC<StandardKPICardProps> = ({
  label,
  value,
  change,
  trend,
  icon: Icon,
  accentColor = "blue-400",
  glowColor = "blue-500/50",
}) => {
  return (
    <div
      className={cn(
        "group relative rounded-xl p-3 backdrop-blur-xl bg-card/80 border transition-all duration-500 hover:scale-105",
        "hover:shadow-lg hover:-translate-y-1",
        `border-${accentColor}/30 hover:border-${accentColor}/60 hover:shadow-${glowColor}`,
      )}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
          `bg-linear-to-br from-${accentColor}/20 to-transparent`,
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110",
          `bg-linear-to-br from-${accentColor}/20 to-${accentColor}/5 border border-${accentColor}/30`,
        )}
      >
        <Icon className={`w-4 h-4 text-${accentColor}`} />
      </div>

      {/* Label */}
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="text-xl font-black text-foreground mb-2 tracking-tight">
        {value}
      </p>

      {/* Trend */}
      <div className="flex items-center gap-1.5">
        {trend === "up" ? (
          <TrendingUp className="w-3 h-3 text-lime-500 dark:text-lime-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-rose-500 dark:text-rose-400" />
        )}
        <span
          className={cn(
            "text-[10px] font-black",
            trend === "up"
              ? "text-lime-500 dark:text-lime-400"
              : "text-rose-500 dark:text-rose-400",
          )}
        >
          {trend === "up" ? "+" : "-"}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
};
