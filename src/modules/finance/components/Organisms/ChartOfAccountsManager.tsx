/**
 * ChartOfAccountsManager - Organismo para gestión del Plan de Cuentas (Modular)
 */

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Search, Plus, Download, Filter, MoreVertical } from "lucide-react";
import { formatCurrency } from "@/lib";

interface ChartOfAccountsManagerProps {
  logic: any;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({
  logic,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const accounts = logic.accounts || [];

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((a: any) => {
        const matchesSearch =
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.includes(searchQuery);
        const matchesType = typeFilter === "all" || a.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a: any, b: any) => a.code.localeCompare(b.code));
  }, [accounts, searchQuery, typeFilter]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activo: "Activo",
      pasivo: "Pasivo",
      patrimonio: "Patrimonio",
      ingreso: "Ingreso",
      egreso: "Gasto",
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      activo: "default",
      pasivo: "destructive",
      patrimonio: "secondary",
      ingreso: "outline",
      egreso: "destructive",
    };
    return variants[type] || "default";
  };

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md">
      <CardHeader className="bg-muted/10 border-b pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary leading-none mb-1">
              Plan de Cuentas
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Configuración y estructura contable del sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/40"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button
              size="sm"
              className="rounded-xl shadow-lg shadow-primary/20"
              onClick={() => logic.setIsAccountDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 border-b bg-muted/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/50 h-11 bg-background"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px] rounded-xl border-border/50 h-11 bg-background">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Tipo de cuenta" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-2xl">
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="pasivo">Pasivos</SelectItem>
              <SelectItem value="patrimonio">Patrimonio</SelectItem>
              <SelectItem value="ingreso">Ingresos</SelectItem>
              <SelectItem value="egreso">Gastos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/40 hover:bg-transparent uppercase">
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12 w-[120px]">
                  Código
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12">
                  Nombre de Cuenta
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12 w-[120px]">
                  Tipo
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12 text-right">
                  Balance Total
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12 w-[100px] text-center">
                  Estado
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest px-6 h-12 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20 text-muted-foreground italic"
                  >
                    No se encontraron cuentas contables con los criterios
                    actuales
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account: any) => (
                  <TableRow
                    key={account.id}
                    className="border-border/20 hover:bg-primary/5 transition-colors group"
                  >
                    <TableCell className="px-6 py-4 font-mono font-black text-xs text-primary/70">
                      {account.code}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground/80 uppercase tracking-tight">
                          {account.name}
                        </span>
                        {account.parentId && (
                          <span className="text-[9px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest flex items-center gap-1">
                            Subcuenta de: {account.parentId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant={getTypeBadge(account.type)}
                        className="text-[10px] h-5 rounded-md px-2 font-black uppercase"
                      >
                        {getTypeLabel(account.type)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`px-6 py-4 text-right font-black italic text-sm tabular-nums ${account.balance >= 0 ? "text-foreground" : "text-red-500"}`}
                    >
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div
                          className={`h-2.5 w-2.5 rounded-full shadow-xs ${account.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
