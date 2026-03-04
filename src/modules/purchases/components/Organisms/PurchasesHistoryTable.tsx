import React from "react";
import { Search, Filter, History } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/index";
import { cn } from "@/core/shared/utils/utils";

interface PurchasesHistoryTableProps {
  compras: any[];
  suppliers: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

const PurchasesHistoryTable: React.FC<PurchasesHistoryTableProps> = ({
  compras,
  suppliers,
  searchQuery,
  setSearchQuery,
}) => {
  const filteredCompras = compras.filter(
    (c) =>
      c.num_factura.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suppliers
        .find((s) => s.id === c.proveedor_id)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <Tabs defaultValue="history" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-white/5 p-1 rounded-2xl border border-white/10 h-11">
          <TabsTrigger
            value="history"
            className="rounded-xl px-5 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs"
          >
            Historial
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-xl px-5 data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs"
          >
            Por Recibir
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-400 transition-colors"
              size={14}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Factura o proveedor..."
              className="bg-white/5 border-white/10 rounded-xl pl-9 h-10 w-56 text-xs focus:ring-violet-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-10 w-10 border-white/10 bg-white/5 hover:bg-white/10"
          >
            <Filter size={14} />
          </Button>
        </div>
      </div>

      <TabsContent
        value="history"
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <Card className="bg-[#0F1115] border-white/10 overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-medium text-xs">
                    Factura
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium text-xs">
                    Proveedor
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium text-xs">
                    Fecha
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium text-xs">
                    USD
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium text-xs">
                    Bolívares
                  </TableHead>
                  <TableHead className="text-gray-400 font-medium text-xs">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompras.length > 0 ? (
                  filteredCompras.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="font-mono text-white text-[10px]">
                        {c.num_factura}
                      </TableCell>
                      <TableCell className="text-white text-xs">
                        {suppliers.find((s) => s.id === c.proveedor_id)?.name ||
                          "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-[10px]">
                        {formatDate(c.fecha_emision)}
                      </TableCell>
                      <TableCell className="font-semibold text-white text-sm">
                        {formatCurrency(c.total_usd, "USD")}
                      </TableCell>
                      <TableCell className="text-gray-400 text-[10px]">
                        {formatCurrency(
                          c.total_usd * c.tasa_bcv_aplicada,
                          "VES",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg px-2 py-0.5 text-[9px] font-bold",
                            c.estatus === "PROCESADA"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          )}
                        >
                          {c.estatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                        <History size={40} className="text-gray-700" />
                        <p className="text-sm">No se encontraron registros.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="pending">
        <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-3xl text-gray-500 text-sm italic">
          Módulo de recepción de mercancía próximamente.
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default PurchasesHistoryTable;
