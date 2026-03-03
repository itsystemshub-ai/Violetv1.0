import React from "react";
import { Plus, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PurchasesHeaderProps {
  onNewPurchase: () => void;
  onManageSuppliers: () => void;
}

const PurchasesHeader: React.FC<PurchasesHeaderProps> = ({
  onNewPurchase,
  onManageSuppliers,
}) => {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-[#0F1115] border border-white/5 p-8 shadow-2xl">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-violet-500/10 to-transparent opacity-50" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 group-hover:scale-110 transition-transform">
              <Briefcase size={22} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Gestión de Compras
              <Badge
                variant="outline"
                className="text-[10px] uppercase border-violet-500/30 text-violet-400 bg-violet-500/5"
              >
                Venezuela BI
              </Badge>
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-md">
            Centro de abastecimiento inteligente con control de moneda dual, CPP
            y cumplimiento SENIAT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onNewPurchase}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-2xl px-6 py-6 h-auto shadow-lg shadow-violet-600/20 border-t border-white/20 transition-all hover:translate-y-[-2px] active:translate-y-[1px]"
          >
            <Plus size={18} className="mr-2" />
            Nueva Orden
          </Button>
          <Button
            variant="outline"
            onClick={onManageSuppliers}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl px-6 py-6 h-auto transition-all"
          >
            <Users size={18} className="mr-2" />
            Proveedores
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PurchasesHeader;
