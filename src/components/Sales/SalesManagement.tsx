import { UserPlus, FileSpreadsheet, Edit2, Trash, Users, Filter } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";

interface SalesManagementProps {
  customers: any[];
  sellers: any[];
  onEditEntity: (entity: any, type: "cliente" | "vendedor") => void;
  onDeleteEntity: (id: string, type: "cliente" | "vendedor") => void;
  onAddEntity: (type: "cliente" | "vendedor") => void;
}

export const SalesManagement = ({
  customers,
  sellers,
  onEditEntity,
  onDeleteEntity,
  onAddEntity,
}: SalesManagementProps) => {
  const [filterType, setFilterType] = useState<"todos" | "cliente" | "vendedor">("todos");
  
  // Unificar datos en una sola tabla
  const unifiedData = useMemo(() => {
    const clientData = customers.map(c => ({
      id: c.id,
      type: "cliente" as const,
      name: c.username,
      empresa: c.empresa,
      rif: c.rif,
      estado: c.estado || "Activo",
      email: c.email,
      contacto: c.contacto,
    }));
    
    const sellerData = sellers.map(s => ({
      id: s.id,
      type: "vendedor" as const,
      name: s.name,
      empresa: null,
      rif: s.cedula || s.rif,
      estado: s.estado || "Activo",
      email: s.email,
      contacto: s.contacto,
    }));
    
    return [...clientData, ...sellerData];
  }, [customers, sellers]);
  
  // Filtrar datos
  const filteredData = useMemo(() => {
    if (filterType === "todos") return unifiedData;
    return unifiedData.filter(item => item.type === filterType);
  }, [unifiedData, filterType]);
  
  return (
    <Card className="rounded-3xl shadow-xl overflow-hidden border backdrop-blur-xl bg-card/80 border-border">
      <CardHeader className="bg-muted/10 dark:bg-muted/5 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
              Gestión de Entidades
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
              Clientes y vendedores unificados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Filtros */}
            <div className="flex bg-muted/30 dark:bg-muted/20 rounded-2xl p-1.5 border border-border/40 shadow-inner">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterType("todos")}
                className={`h-8 px-4 text-[9px] font-black uppercase rounded-xl tracking-wider transition-all ${
                  filterType === "todos"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterType("cliente")}
                className={`h-8 px-4 text-[9px] font-black uppercase rounded-xl tracking-wider transition-all ${
                  filterType === "cliente"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Clientes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterType("vendedor")}
                className={`h-8 px-4 text-[9px] font-black uppercase rounded-xl tracking-wider transition-all ${
                  filterType === "vendedor"
                    ? "bg-purple-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vendedores
              </Button>
            </div>
            
            {/* Botones de acción */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-[9px] font-black uppercase gap-1.5 border-border/60 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30"
              onClick={() => onAddEntity("cliente")}
            >
              <UserPlus className="h-3 w-3" /> Cliente
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-[9px] font-black uppercase gap-1.5 border-border/60 hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30"
              onClick={() => onAddEntity("vendedor")}
            >
              <UserPlus className="h-3 w-3" /> Vendedor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="rounded-b-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background/95 dark:bg-background/80 backdrop-blur-sm">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-background/95 dark:bg-background/80 sticky top-0 z-10 shadow-sm">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 bg-background/95 dark:bg-background/80 sticky top-0 z-10 shadow-sm">
                    Nombre / Empresa
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 bg-background/95 dark:bg-background/80 sticky top-0 z-10 shadow-sm">
                    RIF / CI
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-background/95 dark:bg-background/80 sticky top-0 z-10 shadow-sm">
                    Estado
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-right pr-6 bg-background/95 dark:bg-background/80 sticky top-0 z-10 shadow-sm">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={`${item.type}-${item.id}`}
                    className="border-border/40 hover:bg-muted/10 dark:hover:bg-muted/5 transition-colors group"
                  >
                    <TableCell className="text-center px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase rounded-md px-2 ${
                          item.type === "cliente"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-[11px] uppercase text-foreground leading-none mb-1">
                          {item.name}
                        </span>
                        {item.empresa && (
                          <span className="text-[9px] font-medium text-muted-foreground uppercase opacity-60 leading-none italic">
                            {item.empresa}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[10px] font-bold text-muted-foreground">
                      {item.rif || "N/D"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge
                        className={`uppercase text-[8px] font-black h-5 px-2 ${
                          item.estado === "Activo"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                        }`}
                      >
                        {item.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-[9px] font-black uppercase opacity-60 group-hover:opacity-100"
                          onClick={() => onEditEntity(item, item.type)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase opacity-60 group-hover:opacity-100"
                          onClick={() => onDeleteEntity(item.id, item.type)}
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-40 text-center text-muted-foreground/40 font-black uppercase italic text-xs tracking-widest"
                    >
                      No hay {filterType === "todos" ? "entidades" : filterType === "cliente" ? "clientes" : "vendedores"} registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
