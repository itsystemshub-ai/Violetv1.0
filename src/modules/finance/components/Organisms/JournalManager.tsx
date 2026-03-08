/**
 * JournalManager - Organismo para gestión de Asientos Contables (Modular)
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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
  Plus,
  Download,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

interface JournalManagerProps {
  logic: any;
}

export const JournalManager: React.FC<JournalManagerProps> = ({ logic }) => {
  // Nota: Estos datos deberían venir del hook logic
  // Por ahora usamos una estructura compatible con useFinanceLogic o mock
  const entries = logic.journalEntries || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      draft: "secondary",
      posted: "default",
      void: "destructive",
    };
    return variants[status] || "default";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <CheckCircle className="h-4 w-4" />;
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "void":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">
            Asientos Contables
          </h3>
          <p className="text-sm text-muted-foreground">
            Registro cronológico de transacciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button
            size="sm"
            onClick={() => logic.setIsTransactionDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Asiento
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">
                No hay asientos contables registrados
              </p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => logic.setIsTransactionDialogOpen(true)}
              >
                Crear el primer asiento
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry: any) => (
            <Card
              key={entry.id}
              className="overflow-hidden border-2 hover:border-primary/20 transition-all group"
            >
              <CardHeader className="bg-muted/5 py-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="font-mono bg-background shadow-xs"
                    >
                      {entry.id}
                    </Badge>
                    <Badge
                      variant={getStatusBadge(entry.status)}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(entry.status)}
                      {entry.status === "draft"
                        ? "Borrador"
                        : entry.status === "posted"
                          ? "Registrado"
                          : "Anulado"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {formatDate(entry.date)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        {entry.status === "draft" && (
                          <DropdownMenuItem>Publicar (Post)</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          Anular
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-4">
                  <p className="font-bold text-foreground/90">
                    {entry.description}
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-1">
                    Ref: {entry.reference} • Creado por: {entry.createdBy}
                  </p>
                </div>
                <Table className="border-t">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase px-6">
                        Cuenta
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-right px-6">
                        Débito
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-right px-6">
                        Crédito
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line: any) => (
                      <TableRow key={line.id} className="hover:bg-transparent">
                        <TableCell className="px-6 py-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">
                              {line.accountName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {line.accountCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6 font-mono text-xs">
                          {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right px-6 font-mono text-xs">
                          {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/10 font-black italic">
                      <TableCell className="px-6 py-2 uppercase text-[10px]">
                        Total Asiento
                      </TableCell>
                      <TableCell className="text-right px-6 font-mono text-xs text-emerald-600">
                        {formatCurrency(entry.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right px-6 font-mono text-xs text-red-500">
                        {formatCurrency(entry.totalCredit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
