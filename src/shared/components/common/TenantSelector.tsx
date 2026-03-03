import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Building2, Check, ChevronDown, Globe, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TenantSelector() {
  const {
    tenant,
    allTenants,
    setActiveTenant: switchTenant,
  } = useSystemConfig();
  const { user } = useAuth();

  if (!user?.isSuperAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
          >
            <Building2 className="w-4 h-4 text-primary" />
            <div className="text-left hidden md:block">
              <p className="text-[10px] font-bold text-primary/60 leading-none uppercase tracking-widest">
                Empresa Activa
              </p>
              <p className="text-xs font-semibold truncate max-w-[120px]">
                {tenant.id === "none" ? "Violet ERP (Neutro)" : tenant.name}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px] p-2">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-tight opacity-50">
              Gestionar Empresas
            </span>
            <Globe className="w-3 h-3 opacity-30" />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Opción Neutra */}
          <DropdownMenuItem
            onClick={() => switchTenant("none")}
            className={cn(
              "flex items-center justify-between cursor-pointer py-2 rounded-lg",
              tenant.id === "none" && "bg-primary/10 text-primary font-bold",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <Globe className="w-3 h-3" />
              </div>
              <span>Violet ERP (Neutro)</span>
            </div>
            {tenant.id === "none" && <Check className="w-4 h-4" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Lista de Tenants */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {allTenants.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => switchTenant(t.id)}
                className={cn(
                  "flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg hover:bg-muted transition-colors",
                  tenant.id === t.id && "bg-primary/10 text-primary font-bold",
                )}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{t.name}</span>
                  <span className="text-[10px] opacity-50 font-mono uppercase">
                    {t.id}
                  </span>
                </div>
                {tenant.id === t.id && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-primary py-2 font-medium">
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Empresa</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {tenant.id !== "none" && (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-bold animate-in fade-in zoom-in duration-300"
        >
          Activo
        </Badge>
      )}
    </div>
  );
}
