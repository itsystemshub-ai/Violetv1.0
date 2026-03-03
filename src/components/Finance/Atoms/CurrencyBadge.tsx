import React from "react";
import { Badge } from "@/components/ui/badge";

interface CurrencyBadgeProps {
  currency: "USD" | "VES";
  className?: string;
}

export const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  currency,
  className = "",
}) => {
  const isUSD = currency === "USD";
  return (
    <Badge
      variant="outline"
      className={`text-[9px] font-black uppercase px-2 py-0 h-4 rounded-md border-primary/20 bg-primary/5 text-primary ${className}`}
    >
      {isUSD ? "$ USD" : "Bs. VES"}
    </Badge>
  );
};
