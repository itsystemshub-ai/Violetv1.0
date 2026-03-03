import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/index";
import { TransactionTypeIcon } from "../Atoms/TransactionTypeIcon";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";

interface LedgerManagerProps {
  logic: any;
}

export const LedgerManager = ({ logic }: LedgerManagerProps) => {
  // Paginación
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  } = usePagination(logic.ledgerTransactions, 15);

  return (
    <Card className="rounded-3xl shadow-xl overflow-hidden border-none ring-1 ring-border/5">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary leading-none mb-1">
              Libro Mayor
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Movimientos detallados por cuenta y fecha
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="w-full max-w-sm space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1 opacity-70">
              Seleccionar Cuenta Contable
            </Label>
            <Select onValueChange={logic.handleSelectLedgerAccount}>
              <SelectTrigger className="rounded-xl border-border/50 bg-muted/5">
                <SelectValue placeholder="Busque una cuenta..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/40">
                {logic.accounts.map((acc: any) => (
                  <SelectItem
                    key={acc.id}
                    value={acc.id}
                    className="rounded-lg text-xs font-bold uppercase py-2"
                  >
                    <span className="text-primary/60 font-black mr-2">
                      {acc.code}
                    </span>{" "}
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!logic.selectedLedgerAccount ? (
            <div className="flex items-center justify-center h-80 border-2 border-dashed rounded-4xl bg-muted/5 border-border/20">
              <div className="text-center space-y-4">
                <div className="bg-primary/5 p-4 rounded-full inline-block">
                  <FileSpreadsheet className="h-10 w-10 text-primary/30" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                    Seleccione una cuenta para ver el detalle
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] overflow-hidden border border-border/40 shadow-sm bg-card">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">
                      Fecha
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">
                      Descripción
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center">
                      Tipo
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-right">
                      Monto
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.ledgerTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-16 text-muted-foreground/40 font-black uppercase italic text-xs tracking-widest"
                      >
                        No hay movimientos registrados para esta cuenta
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((tx: any) => (
                      <TableRow
                        key={tx.id}
                        className="border-border/40 hover:bg-muted/10 transition-colors group h-14"
                      >
                        <TableCell className="px-6 py-4 text-[10px] font-bold text-muted-foreground">
                          {formatDate(tx.created_at || tx.date)}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-bold text-xs uppercase text-foreground/80 leading-none">
                          {tx.description}
                        </TableCell>
                        <TableCell className="text-center px-6 py-4">
                          <div className="flex justify-center">
                            <TransactionTypeIcon
                              type={tx.type as "debe" | "haber"}
                              className="h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </TableCell>
                        <TableCell
                          className={`px-6 py-4 text-right font-black italic text-sm tabular-nums ${tx.type === "debe" ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {tx.type === "debe" ? "+" : "-"}{" "}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              {logic.ledgerTransactions.length > 0 && (
                <div className="p-4 border-t border-border/40">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={logic.ledgerTransactions.length}
                    onPageChange={goToPage}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
