import { motion } from "framer-motion";
import { Box, Layers, Car, CheckCircle2, Download } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface InventoryStatsProps {
  logic: any;
}

export const InventoryStats = ({ logic }: InventoryStatsProps) => {
  const totalUnits = (logic.products || []).reduce(
    (acc: any, p: any) => acc + (p.stock || 0),
    0,
  ) || 1;

  return (
    <div className="space-y-6">
      {/* Brand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Stock Cauplas",
            key: "cauplas",
            color: "text-primary",
            bg: "bg-primary/5",
            border: "border-primary/20",
            letter: "C",
          },
          {
            label: "Stock Torflex",
            key: "torflex",
            color: "text-blue-600",
            bg: "bg-blue-500/5",
            border: "border-blue-500/20",
            letter: "T",
          },
          {
            label: "Stock Indomax",
            key: "indomax",
            color: "text-emerald-600",
            bg: "bg-emerald-500/5",
            border: "border-emerald-500/20",
            letter: "I",
          },
          {
            label: "Diesel & Fuel",
            key: "diesel",
            color: "text-amber-600",
            bg: "bg-amber-500/5",
            border: "border-amber-500/20",
            letter: "D",
          },
          {
            label: "Nuevos Items",
            key: "new",
            color: "text-purple-600",
            bg: "bg-purple-500/5",
            border: "border-purple-500/20",
            letter: "N",
          },
        ].map((brand) => (
          <Card
            key={brand.key}
            className={`p-3 ${brand.bg} ${brand.border} relative overflow-hidden group`}
          >
            <div
              className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform`}
            >
              <h1 className="text-7xl font-black">{brand.letter}</h1>
            </div>
            <div className="space-y-0.5 relative z-10">
              <p
                className={`text-[9px] font-black ${brand.color} uppercase tracking-[0.15em]`}
              >
                {brand.label}
              </p>
              <h4 className="text-xl font-black text-foreground">
                {(brand.key === "diesel"
                  ? logic.whStats.fuel.diesel.units
                  : brand.key === "new"
                    ? logic.whStats.new.units
                    : (logic.whStats.brands as any)[brand.key].units
                ).toLocaleString()}
              </h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 backdrop-blur-xl bg-card/80 border border-border rounded-2xl shadow-lg">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" /> Resumen de Unidades
            Disponibles
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar..."
            className="w-[200px] h-9 rounded-full px-4"
            value={logic.whSearchQuery}
            onChange={(e) => logic.setWhSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Distribución por Marca (PRIMERO) */}
        <Card className="p-6 backdrop-blur-xl bg-card/80 border-border shadow-lg">
          <CardTitle className="mb-6 text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-primary">
            <Car className="w-4 h-4" /> Distribución por Marca
          </CardTitle>
          <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(logic.whStats.vehicleBrands)
              .sort((a, b) => (b[1] as any).units - (a[1] as any).units)
              .filter(
                ([name]) =>
                  !logic.whSearchQuery ||
                  name
                    .toLowerCase()
                    .includes(logic.whSearchQuery.toLowerCase()),
              )
              .map(([name, data]: any, idx) => {
                const percentage = (data.units / totalUnits) * 100;
                return (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-foreground/80">
                        {name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {data.count} items
                        </Badge>
                        <p className="text-sm font-black italic text-primary">
                          {data.units.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full bg-linear-to-r from-amber-500 to-orange-500"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% del total
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Distribución por Categoría (SEGUNDO) */}
        <Card className="p-6 backdrop-blur-xl bg-card/80 border-border shadow-lg">
          <CardTitle className="mb-6 text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-primary">
            <Layers className="w-4 h-4" /> Distribución por Categoría
          </CardTitle>
          <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(logic.whStats.categories)
              .sort((a, b) => (b[1] as any).units - (a[1] as any).units)
              .filter(
                ([name]) =>
                  !logic.whSearchQuery ||
                  name
                    .toLowerCase()
                    .includes(logic.whSearchQuery.toLowerCase()),
              )
              .map(([name, data]: any, idx) => {
                const percentage = (data.units / totalUnits) * 100;
                return (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-foreground/80">
                        {name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {data.count} items
                        </Badge>
                        <p className="text-sm font-black italic text-primary">
                          {data.units.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full bg-linear-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% del total
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Distribución por Tipo de Combustible (TERCERO) */}
        <Card className="p-6 backdrop-blur-xl bg-card/80 border-border shadow-lg">
          <CardTitle className="mb-6 text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-primary">
            <Layers className="w-4 h-4" /> Tipo de Combustible
          </CardTitle>
          <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(logic.whStats.fuelTypes || {})
              .sort((a, b) => (b[1] as any).units - (a[1] as any).units)
              .filter(
                ([name]) =>
                  !logic.whSearchQuery ||
                  name
                    .toLowerCase()
                    .includes(logic.whSearchQuery.toLowerCase()),
              )
              .map(([name, data]: any, idx) => {
                const percentage = (data.units / totalUnits) * 100;
                return (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-foreground/80">
                        {name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {data.count} items
                        </Badge>
                        <p className="text-sm font-black italic text-amber-600">
                          {data.units.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full bg-linear-to-r from-amber-500 to-yellow-500"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% del total
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Distribución por Nuevos Items (CUARTO) */}
        <Card className="p-6 backdrop-blur-xl bg-card/80 border-border shadow-lg">
          <CardTitle className="mb-6 text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-primary">
            <Layers className="w-4 h-4" /> Nuevos Items
          </CardTitle>
          <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(logic.whStats.newItems || {})
              .sort((a, b) => (b[1] as any).units - (a[1] as any).units)
              .filter(
                ([name]) =>
                  !logic.whSearchQuery ||
                  name
                    .toLowerCase()
                    .includes(logic.whSearchQuery.toLowerCase()),
              )
              .map(([name, data]: any, idx) => {
                const percentage = (data.units / totalUnits) * 100;
                return (
                  <div
                    key={name}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase text-foreground/80">
                        {name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {data.count} items
                        </Badge>
                        <p className="text-sm font-black italic text-purple-600">
                          {data.units.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full bg-linear-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% del total
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Resumen Crítico - Ahora en una fila separada */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-6 backdrop-blur-xl bg-linear-to-br from-primary/10 to-transparent border-primary/20 shadow-lg">
          <CardTitle className="mb-6 text-base flex items-center gap-2 font-black italic">
            <CheckCircle2 className="w-5 h-5 text-primary" /> RESUMEN CRÍTICO
          </CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <span className="text-xs font-medium">Total Unidades Global</span>
              <span className="text-lg font-black">
                {totalUnits.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <span className="text-xs font-medium">Total Productos</span>
              <span className="text-lg font-black">
                {logic.products?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <span className="text-xs font-medium">Marcas de Vehículos</span>
              <span className="text-lg font-black">
                {Object.keys(logic.whStats.vehicleBrands).length}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <span className="text-xs font-medium">Categorías</span>
              <span className="text-lg font-black">
                {Object.keys(logic.whStats.categories).length}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-6 rounded-full border-primary/30 text-primary hover:bg-primary/5 gap-2"
            onClick={() => logic.handleExport("pdf")}
          >
            <Download className="w-4 h-4" /> Generar Reporte Visual
          </Button>
        </Card>
      </div>
    </div>
  );
};
