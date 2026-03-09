import React from "react";
import { Card } from "@/shared/components/ui/card";
import { CurrencyBadge } from "../atoms/CurrencyBadge";
import { formatCurrency } from "@/core/shared/utils/utils";

interface AccountSummaryItemProps {
  name: string;
  code: string;
  balance: number;
  currency: "USD" | "VES";
  onClick?: () => void;
}

export const AccountSummaryItem: React.FC<AccountSummaryItemProps> = ({
  name,
  code,
  balance,
  currency,
  onClick,
}) => {
  return (
    <Card
      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-sm ring-1 ring-border/5"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black uppercase text-primary/60 tracking-tighter leading-none mb-1">
            {code}
          </span>
          <h4 className="font-bold text-xs truncate uppercase text-foreground leading-none">
            {name}
          </h4>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="font-black italic text-sm text-foreground tabular-nums">
            {formatCurrency(balance)}
          </span>
          <CurrencyBadge currency={currency} className="mt-1" />
        </div>
      </div>
    </Card>
  );
};
