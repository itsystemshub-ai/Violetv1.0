import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/index";
import {
  Receipt,
  DollarSign,
  Wallet,
  CreditCard,
  Landmark,
  Zap,
} from "lucide-react";

interface CxCManagerProps {
  logic: any;
}

export const CxCManager = ({ logic }: CxCManagerProps) => {
  return (
    <div className="space-y-6">
      <Card className="rounded-4xl shadow-2xl overflow-hidden border-none ring-1 ring-border/5 bg-background/50 backdrop-blur-xl">
        <div className="p-6 bg-muted/10 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase text-primary leading-none mb-1">
                Cuentas por Cobrar
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Gestión de facturas pendientes de cobro
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-7 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase"
          >
            Cartera activa
          </Badge>
        </div>

        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/5">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                  Factura
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                  Cliente / Entidad
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                  Fecha Vence
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                  Monto (USD)
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                  Monto (VES)
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logic.invoices
                .filter(
                  (i: any) => i.type === "venta" && i.status === "pendiente",
                )
                .map((inv: any) => (
                  <TableRow
                    key={inv.id}
                    className="group border-border/40 hover:bg-primary/5 transition-all h-16"
                  >
                    <TableCell className="px-8 py-4">
                      <span className="px-2 py-1 rounded-md bg-muted/30 text-[10px] font-black italic text-foreground tracking-tighter">
                        #{inv.number}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-4 font-black italic uppercase text-xs text-foreground/80 leading-none">
                      {inv.customerName}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-[10px] font-bold text-muted-foreground tabular-nums">
                      {formatDate(inv.date)}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right font-black italic text-sm tabular-nums text-foreground">
                      {formatCurrency(inv.total, "USD")}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right font-black italic text-sm tabular-nums text-emerald-600">
                      {formatCurrency(inv.total * logic.exchangeRate, "VES")}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right">
                      <Button
                        size="sm"
                        className="h-9 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        onClick={() => {
                          logic.setSelectedInvoiceForPayment(inv);
                          logic.setIsPaymentDialogOpen(true);
                        }}
                      >
                        Cobrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {logic.invoices.filter(
                (i: any) => i.type === "venta" && i.status === "pendiente",
              ).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-24 text-muted-foreground/30 font-black uppercase text-[10px] tracking-widest italic leading-relaxed"
                  >
                    No hay facturas pendientes en la cartera <br />
                    <span className="text-[8px] opacity-40">
                      ¡Todo está al día!
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={logic.isPaymentDialogOpen}
        onOpenChange={logic.setIsPaymentDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary mb-4">
              Procesar Cobranza
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-4 relative z-10">
            <div className="p-6 bg-primary/5 rounded-4xl border border-primary/10 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                <span>Cliente / Entidad</span>
                <span className="text-foreground">
                  {logic.selectedInvoiceForPayment?.customerName}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                <span>Número de Factura</span>
                <span className="text-foreground italic">
                  #{logic.selectedInvoiceForPayment?.number}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-primary/15">
                <span className="text-xs font-black uppercase text-primary tracking-widest">
                  Saldo a Liquidar:
                </span>
                <span className="text-2xl font-black italic tracking-tighter text-primary tabular-nums">
                  {formatCurrency(
                    logic.selectedInvoiceForPayment?.total || 0,
                    "USD",
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="text-[10px] font-black uppercase ml-1 opacity-70 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Método de Liquidación
              </Label>
              <Select
                value={logic.paymentMethod}
                onValueChange={logic.setPaymentMethod}
              >
                <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-muted/5 font-bold uppercase text-[11px] tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                  <SelectItem
                    value="efectivo_usd"
                    className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />{" "}
                      Efectivo (USD)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="zelle"
                    className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" /> Zelle (USD)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="pago_movil"
                    className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-emerald-500" /> Pago
                      Móvil (Bs)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="transferencia_ves"
                    className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />{" "}
                      Transferencia (Bs)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="punto_de_venta"
                    className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-rose-500" /> Punto de
                      Venta (Bs)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(logic.paymentMethod === "efectivo_usd" ||
              logic.paymentMethod === "zelle") && (
              <div className="p-5 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/20 flex items-center justify-between group transition-all animate-in zoom-in-95 duration-300">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500 group-hover:animate-pulse" />
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">
                      Retención IGTF (3%)
                    </p>
                  </div>
                  <p className="text-[8px] font-black italic text-amber-600/60 uppercase">
                    Se aplicará un cargo adicional de ley
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black italic tabular-nums text-amber-600">
                    {formatCurrency(
                      (logic.selectedInvoiceForPayment?.total || 0) * 0.03,
                      "USD",
                    )}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={logic.handleProcessPayment}
              className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              Confirmar Liquidación
            </Button>
          </div>

          <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none">
            <Landmark className="h-64 w-64 -mr-20 -mb-20" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
