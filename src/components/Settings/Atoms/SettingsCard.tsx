import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  accent?: "primary" | "amber" | "emerald" | "destructive";
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  icon,
  className,
  headerAction,
  accent = "primary",
}) => {
  const accentColors = {
    primary: "bg-primary/20",
    amber: "bg-amber-500/20",
    emerald: "bg-emerald-500/20",
    destructive: "bg-destructive/20",
  };

  return (
    <Card
      className={cn("border-border/50 shadow-sm overflow-hidden", className)}
    >
      <div className={cn("h-1 w-full", accentColors[accent])} />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon && (
              <span
                className={cn(
                  accent === "primary" ? "text-primary" : `text-${accent}-500`,
                )}
              >
                {icon}
              </span>
            )}
            {title}
          </CardTitle>
          {headerAction}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
};

export default SettingsCard;
