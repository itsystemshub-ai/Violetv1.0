import React from "react";
import { Briefcase } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

const PurchasesHeader: React.FC = () => {
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
      </div>
    </header>
  );
};

export default PurchasesHeader;
