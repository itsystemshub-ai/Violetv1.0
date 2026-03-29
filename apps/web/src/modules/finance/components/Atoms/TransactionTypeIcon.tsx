import React from "react";
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react";

interface TransactionTypeIconProps {
  type: "debe" | "haber" | "neutral";
  className?: string;
}

export const TransactionTypeIcon: React.FC<TransactionTypeIconProps> = ({
  type,
  className = "h-4 w-4",
}) => {
  switch (type) {
    case "debe":
      return <ArrowUpCircle className={`${className} text-emerald-500`} />;
    case "haber":
      return <ArrowDownCircle className={`${className} text-red-500`} />;
    default:
      return <MinusCircle className={`${className} text-muted-foreground`} />;
  }
};
