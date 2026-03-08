import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/lib/index";
import { 
  History, 
  MessageCircle, 
  ExternalLink, 
  AlertCircle, 
  Calendar, 
  Clock, 
  CheckCircle2,
  TrendingDown,
  CreditCard
} from "lucide-react";
import { cn } from "@/core/shared/utils/utils";
import { useCRMStore } from "@/modules/crm/hooks/useCRMStore";
import { Badge } from "@/shared/components/ui/badge";

interface CxCManagerProps {
  logic: any;
}

export const CxCManager = ({ logic }: CxCManagerProps) => {
  const { sendMessage, setTab, setActiveChat } = useCRMStore();

  const handleSendReminder = (inv: any) => {
    // 1. Log to CRM
    const message = `Recordatorio de Pago: La factura #${inv.number} por ${formatCurrency(inv.total, "USD")} se encuentra pendiente. Por favor, realice su pago para evitar cargos adicionales.`;
    sendMessage("1", message); // Demo: always logic to first chat for now or match by customer
    
    // 2. Open WhatsApp (Simulated)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    
    logic.fetchData(); // Refresh if needed
  };

  return (
    <div className="space-y-6">
      {/* Aging Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Pendiente", value: logic.ageingData.total, icon: AlertCircle, color: "primary", glow: "primary/20" },
          { label: "Al Día", value: logic.ageingData.current, icon: CheckCircle2, color: "emerald-500", glow: "emerald-500/20" },
          { label: "> 30 Días", value: logic.ageingData.pastDue30, icon: Clock, color: "amber-500", glow: "amber-500/20" },
          { label: "> 60 Días", value: logic.ageingData.pastDue60, icon: TrendingDown, color: "orange-500", glow: "orange-500/20" },
          { label: "> 90 Días", value: logic.ageingData.pastDue90, icon: History, color: "rose-500", glow: "rose-500/20" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={cn(
              "p-4 border shadow-md relative overflow-hidden group hover:-translate-y-1 transition-all duration-300",
              `border-${stat.color}/20 hover:border-${stat.color}/50`
            )}>
              <div className={cn("absolute -right-4 -top-4 opacity-5 group-hover:scale-150 transition-transform", `text-${stat.color}`)}>
                <Icon size={80} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <h3 className={cn("text-xl font-black", `text-${stat.color}`)}>{formatCurrency(stat.value, "USD")}</h3>
            </Card>
          );
        })}
      </div>

      <Card className="border shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-card/80">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Calendar className="text-primary" size={20} />
            Cuentas por Cobrar Detalladas
          </h3>
          <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 uppercase">
            {logic.invoices.filter((i: any) => i.type === "venta" && i.status === "pendiente").length} Facturas Pendientes
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px]">Factura</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Cliente</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Fecha Emisión</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Monto (USD)</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Monto Est. (Bs)</TableHead>
                <TableHead className="font-black uppercase text-[10px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logic.invoices
                .filter(
                  (i: any) => i.type === "venta" && i.status === "pendiente",
                )
                  .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((inv: any) => {
                  const now = new Date();
                  const dueDate = new Date(inv.date);
                  const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <TableRow key={inv.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="font-black text-primary">#{inv.number}</TableCell>
                      <TableCell className="font-bold">{inv.customerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{inv.date.split("T")[0]}</span>
                          <span className={cn(
                            "text-[9px] font-black uppercase",
                            diffDays > 30 ? "text-rose-500" : "text-muted-foreground"
                          )}>
                            {diffDays} días de retraso
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-foreground">
                        {formatCurrency(inv.total, "USD")}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-bold">
                        {formatCurrency(inv.total * logic.exchangeRate, "VES")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Recordatorio WhatsApp"
                            onClick={() => handleSendReminder(inv)}
                          >
                            <MessageCircle size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Generar Link de Pago"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://violet-pay.com/invoice/${inv.id}`);
                              toast.success("Enlace de pago copiado al portapapeles.");
                            }}
                          >
                            <ExternalLink size={14} />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 font-black px-4 rounded-lg ml-2"
                            onClick={() => {
                              logic.setSelectedInvoiceForPayment(inv);
                              logic.setIsPaymentDialogOpen(true);
                            }}
                          >
                            Cobrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={logic.isPaymentDialogOpen}
        onOpenChange={logic.setIsPaymentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Cobranza</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-muted/50 rounded-xl border space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cliente:</span>
                <span className="font-bold">
                  {logic.selectedInvoiceForPayment?.customerName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Factura:</span>
                <span className="font-bold">
                  #{logic.selectedInvoiceForPayment?.number}
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t font-black">
                <span>Total a Pagar:</span>
                <span>
                  {formatCurrency(
                    logic.selectedInvoiceForPayment?.total || 0,
                    "USD",
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Método de Pago</Label>
              <Select
                value={logic.paymentMethod}
                onValueChange={logic.setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo_usd">Efectivo (USD)</SelectItem>
                  <SelectItem value="zelle">Zelle (USD)</SelectItem>
                  <SelectItem value="pago_movil">Pago Móvil (Bs)</SelectItem>
                  <SelectItem value="transferencia_ves">
                    Transferencia (Bs)
                  </SelectItem>
                  <SelectItem value="punto_de_venta">
                    Punto de Venta (Bs)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(logic.paymentMethod === "efectivo_usd" ||
              logic.paymentMethod === "zelle") && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 dark:bg-amber-950/20 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Aviso de IGTF (3%):
                </p>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Se aplicará una retención de{" "}
                  {formatCurrency(
                    (logic.selectedInvoiceForPayment?.total || 0) * 0.03,
                    "USD",
                  )}
                </p>
              </div>
            )}

            <Button
              onClick={logic.handleProcessPayment}
              className="w-full mt-4"
            >
              Registrar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
