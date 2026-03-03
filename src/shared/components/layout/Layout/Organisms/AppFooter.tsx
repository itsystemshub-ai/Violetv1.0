import React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib";

interface AppFooterProps {
  isSecureConnection: boolean;
  currentDate: Date;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  isSecureConnection,
  currentDate,
}) => {
  return (
    <footer className="py-4 px-8 border-t border-border bg-card/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-medium text-muted-foreground mt-auto relative z-20">
      <p>© 2026 Violet ERP. Todos los derechos reservados.</p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3" />
          <span>Protegido por Violet Firewall</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium",
            isSecureConnection
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          )}
        >
          <Lock className="w-3 h-3" />
          <span>
            {isSecureConnection
              ? "Conexión Cifrada (SSL)"
              : "Conexión no cifrada"}
          </span>
        </div>
        <p className="hidden md:block">{formatDate(currentDate)}</p>
      </div>
    </footer>
  );
};
