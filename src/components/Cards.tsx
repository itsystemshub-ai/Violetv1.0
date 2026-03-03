import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Wallet,
  Package,
  ShoppingCart,
  Truck,
  Users,
  HelpCircle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCurrency, FinancialAccount, DashboardMetric } from "@/lib/index";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconMap: Record<string, React.ElementType> = {
  Wallet,
  Package,
  ShoppingCart,
  Truck,
  Users,
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

interface MetricCardProps extends DashboardMetric {
  className?: string;
  variant?:
    | "primary"
    | "emerald"
    | "rose"
    | "amber"
    | "blue"
    | "violet"
    | "slate";
}

export function MetricCard({
  label,
  value,
  change,
  trend,
  icon,
  className,
  variant,
}: MetricCardProps) {
  const IconComponent = (LucideIcons as any)[icon] || HelpCircle;

  const variants = {
    primary: "from-fuchsia-200/90 to-fuchsia-300/80 text-fuchsia-950",
    emerald: "from-emerald-200/90 to-emerald-300/80 text-emerald-950",
    rose: "from-rose-200/90 to-rose-300/80 text-rose-950",
    amber: "from-amber-200/90 to-amber-300/80 text-amber-950",
    blue: "from-blue-200/90 to-blue-300/80 text-blue-950",
    violet: "from-indigo-200/90 to-indigo-300/80 text-indigo-950",
    slate: "from-slate-200/90 to-slate-300/80 text-slate-950",
  };

  const activeVariant =
    variant ||
    (trend === "up" ? "emerald" : trend === "down" ? "rose" : "slate");
  const gradientClass =
    variants[activeVariant as keyof typeof variants] || variants.slate;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-xl p-3 shadow-sm transition-all hover:shadow-md group bg-linear-to-br backdrop-blur-md border border-white/20",
        gradientClass,
        className,
      )}
    >
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
          <IconComponent size={16} className="text-current opacity-80" />
        </div>

        <div className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-white shadow-sm">
          {trend === "up" && (
            <TrendingUp size={10} className="text-emerald-500" />
          )}
          {trend === "down" && (
            <TrendingDown size={10} className="text-rose-500" />
          )}
          <span
            className={cn(
              "tracking-tight",
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                  ? "text-rose-600"
                  : "text-slate-600",
            )}
          >
            {Math.abs(change)}%
          </span>
        </div>
      </div>

      <div className="space-y-0.5 relative z-10">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-70">
          {label}
        </p>
        <h3 className="text-xl font-black tracking-tight drop-shadow-sm">
          {value}
        </h3>
      </div>

      {/* Mini sparkline visualization */}
      <div className="mt-3 flex items-end gap-1 h-4 relative z-10">
        {[20, 45, 35, 70, 50, 90, 60, 40, 80, 55, 30].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="flex-1 rounded-t-full bg-linear-to-t from-white/20 to-white/60 transition-all duration-300 group-hover:opacity-100 opacity-60"
          />
        ))}
      </div>

      {/* Glassmorphic Blob Decoration */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />
    </motion.div>
  );
}

interface InsightCardProps {
  title: string;
  icon: string;
  items: Array<{
    label: string;
    value: string | number;
    subValue?: string;
    status?: "success" | "warning" | "danger" | "neutral";
  }>;
  className?: string;
}

export function InsightCard({
  title,
  icon,
  items,
  className,
}: InsightCardProps) {
  const IconComponent = (LucideIcons as any)[icon] || HelpCircle;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden shadow-sm",
        className,
      )}
    >
      <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <IconComponent size={14} className="text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-tight">
            {title}
          </h3>
        </div>
        <ArrowUpRight size={12} className="text-muted-foreground" />
      </div>
      <div className="divide-y divide-border">
        {items?.map((item, i) => (
          <div
            key={i}
            className="px-3 py-2 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-foreground leading-tight">
                {item.label}
              </span>
              {item.subValue && (
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {item.subValue}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{item.value}</span>
              {item.status && (
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    item.status === "success"
                      ? "bg-emerald-500"
                      : item.status === "warning"
                        ? "bg-amber-500"
                        : item.status === "danger"
                          ? "bg-rose-500"
                          : "bg-muted-foreground",
                  )}
                />
              )}
            </div>
          </div>
        ))}
        {(items?.length || 0) === 0 && (
          <div className="px-3 py-6 text-center text-[10px] text-muted-foreground">
            No hay datos relevantes hoy.
          </div>
        )}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  className?: string;
}

export function ModuleCard({
  name,
  path,
  icon,
  description,
  className,
}: ModuleCardProps) {
  const IconComponent = iconMap[icon] || HelpCircle;

  return (
    <Link to={path} className="group block">
      <motion.div
        whileHover={{ y: -2 }}
        transition={springTransition}
        className={cn(
          "h-full rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
          className,
        )}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <IconComponent size={20} />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{name}</h3>
          <ArrowUpRight
            size={16}
            className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100"
          />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {description}
        </p>
      </motion.div>
    </Link>
  );
}

interface FinancialCardProps {
  account: FinancialAccount;
  className?: string;
}

export function FinancialCard({ account, className }: FinancialCardProps) {
  const typeColors = {
    activo: "bg-emerald-500",
    pasivo: "bg-rose-500",
    patrimonio: "bg-blue-500",
    ingreso: "bg-amber-500",
    egreso: "bg-slate-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("h-2 w-2 rounded-full", typeColors[account.type])} />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {account.code}
        </span>
      </div>
      <h4 className="mt-2 font-semibold text-foreground">{account.name}</h4>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-xl font-bold">
          {formatCurrency(account.balance, account.currency)}
        </span>
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {account.type}
        </span>
      </div>
    </motion.div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  percentage: number;
  isPositive: boolean;
  subtitle?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  percentage,
  isPositive,
  subtitle,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-3",
        className,
      )}
    >
      <div className="relative z-10">
        <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em]">{title}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="text-xl font-black tracking-tight">{value}</h2>
          <span
            className={cn(
              "text-[10px] font-black",
              isPositive ? "text-emerald-500" : "text-rose-500",
            )}
          >
            {isPositive ? "+" : ""}
            {percentage}%
          </span>
        </div>
        {subtitle && (
          <p className="mt-1 text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{subtitle}</p>
        )}

        <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.abs(percentage), 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full",
              isPositive ? "bg-emerald-500" : "bg-rose-500",
            )}
          />
        </div>
      </div>

      <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6">
        <div className="h-full w-full bg-primary/5 mask-[radial-gradient(circle,white,transparent)]" />
      </div>
    </div>
  );
}
