import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionNodeProps {
  icon: LucideIcon;
  label: string;
  status: "online" | "checking" | "offline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConnectionNode: React.FC<ConnectionNodeProps> = ({
  icon: Icon,
  label,
  status,
  size = "md",
  className,
}) => {
  const statusColors = {
    online: "bg-emerald-500",
    checking: "bg-amber-500 animate-pulse",
    offline: "bg-rose-500",
  };

  const containerSizes = {
    sm: "h-16 w-16 rounded-xl",
    md: "h-20 w-20 rounded-2xl",
    lg: "h-24 w-24 rounded-3xl",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center gap-3 relative", className)}>
      <div
        className={cn(
          containerSizes[size],
          "bg-card/40 border border-border/50 flex items-center justify-center text-primary shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30",
          status === "online" && "text-emerald-500 shadow-emerald-500/10",
          status === "offline" && "text-rose-500 shadow-rose-500/10",
        )}
      >
        <Icon className={iconSizes[size]} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <div
        className={cn(
          "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
          statusColors[status],
        )}
      />
    </div>
  );
};
