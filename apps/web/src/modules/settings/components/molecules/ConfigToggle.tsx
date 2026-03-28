import React from "react";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/core/shared/utils/utils";

interface ConfigToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const ConfigToggle: React.FC<ConfigToggleProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
  className,
  disabled,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors",
        className,
      )}
    >
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2 font-medium">
          {icon}
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ConfigToggle;
