import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  badgeText?: string;
  statusColor?: "emerald" | "amber" | "rose" | "indigo";
  className?: string;
  children?: React.ReactNode;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  badgeText,
  statusColor = "emerald",
  className,
  children,
}) => {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    rose: "bg-rose-500/10 text-rose-500",
    indigo: "bg-indigo-500/10 text-indigo-500",
  };

  const dotColorMap = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
  };

  return (
    <Card
      className={cn(
        "bg-card/50 backdrop-blur-xl border-border/50 group h-full",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg", colorMap[statusColor])}>
            <Icon className="h-5 w-5" />
          </div>
          {badgeText ? (
            <Badge
              variant="secondary"
              className={cn(
                "border-none px-2 h-5 text-[10px] font-bold",
                colorMap[statusColor],
              )}
            >
              {badgeText}
            </Badge>
          ) : (
            <div
              className={cn("h-2 w-2 rounded-full", dotColorMap[statusColor])}
            />
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-left">
          {label}
        </p>
        <div className="flex flex-col items-start mt-1">
          <h3 className="text-2xl font-bold">{value}</h3>
          {subValue && (
            <span className="text-xs font-normal text-muted-foreground">
              {subValue}
            </span>
          )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
};
