import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Landmark,
  Archive,
  Activity,
  Users,
  ShieldCheck,
} from "lucide-react";
import { ERP_MODULES } from "@/lib/index";
import { cn } from "@/core/shared/utils/utils";

const QuickAccessModules: React.FC = () => {
  return (
    <section className="backdrop-blur-xl bg-card/80 border border-border shadow-2xl rounded-3xl p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-foreground flex items-center gap-2">
          <ShoppingCart size={20} className="text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
          Accesos Directos
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {ERP_MODULES.map((module) => {
          const moduleStyle = (
            {
              finance: {
                color: "from-lime-400 to-lime-600",
                shadow: "shadow-lime-500/50",
                glow: "group-hover:shadow-lime-500/70",
                border: "border-lime-400/30",
                hoverBorder: "group-hover:border-lime-400/60",
              },
              inventory: {
                color: "from-amber-400 to-orange-500",
                shadow: "shadow-orange-500/50",
                glow: "group-hover:shadow-orange-500/70",
                border: "border-amber-400/30",
                hoverBorder: "group-hover:border-amber-400/60",
              },
              sales: {
                color: "from-emerald-400 to-emerald-600",
                shadow: "shadow-emerald-500/50",
                glow: "group-hover:shadow-emerald-500/70",
                border: "border-emerald-400/30",
                hoverBorder: "group-hover:border-emerald-400/60",
              },
              purchases: {
                color: "from-cyan-400 to-cyan-600",
                shadow: "shadow-cyan-500/50",
                glow: "group-hover:shadow-cyan-500/70",
                border: "border-cyan-400/30",
                hoverBorder: "group-hover:border-cyan-400/60",
              },
              hr: {
                color: "from-rose-400 to-rose-600",
                shadow: "shadow-rose-500/50",
                glow: "group-hover:shadow-rose-500/70",
                border: "border-rose-400/30",
                hoverBorder: "group-hover:border-rose-400/60",
              },
              security: {
                color: "from-indigo-500 to-indigo-700",
                shadow: "shadow-indigo-500/50",
                glow: "group-hover:shadow-indigo-500/70",
                border: "border-indigo-400/30",
                hoverBorder: "group-hover:border-indigo-400/60",
              },
            } as any
          )[module.id] || {
            color: "from-slate-400 to-slate-600",
            shadow: "shadow-slate-500/50",
            glow: "group-hover:shadow-slate-500/70",
            border: "border-slate-400/30",
            hoverBorder: "group-hover:border-slate-400/60",
          };

          const Icon =
            (
              {
                finance: Landmark,
                inventory: Archive,
                sales: ShoppingCart,
                purchases: Activity,
                hr: Users,
                security: ShieldCheck,
              } as any
            )[module.id] || Users;

          return (
            <Link
              key={module.id}
              to={module.path}
              className={cn(
                "group relative p-4 rounded-3xl flex flex-col items-center gap-2 transition-all duration-500",
                "backdrop-blur-xl bg-card/60 border",
                "hover:-translate-y-2 hover:shadow-2xl",
                moduleStyle.border,
                moduleStyle.hoverBorder,
                moduleStyle.shadow,
                moduleStyle.glow,
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl bg-linear-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                  moduleStyle.color,
                )}
              />
              <div
                className={cn(
                  "relative p-3 rounded-xl bg-linear-to-br transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg",
                  moduleStyle.color,
                )}
              >
                <Icon size={20} className="text-white drop-shadow-lg" />
              </div>
              <div className="relative text-center space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
                  Módulo
                </span>
                <h3 className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {module.name}
                </h3>
              </div>
              <div
                className={cn(
                  "absolute top-3 right-3 w-1.5 h-1.5 rounded-full opacity-30 group-hover:scale-150 group-hover:opacity-100 bg-linear-to-br transition-all duration-500",
                  moduleStyle.color,
                )}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickAccessModules;
