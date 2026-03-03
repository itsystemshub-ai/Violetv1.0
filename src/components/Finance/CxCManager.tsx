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
import { formatCurrency } from "@/lib/index";

interface CxCManagerProps {
  logic: any;
}

export const CxCManager = ({ logic }: CxCManagerProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto (USD)</TableHead>
              <TableHead className="text-right">Monto (Bs)</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logic.invoices
              .filter(
                (i: any) => i.type === "venta" && i.status === "pendiente",
              )
              .map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold">#{inv.number}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>{inv.date.split("T")[0]}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(inv.total, "USD")}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatCurrency(inv.total * logic.exchangeRate, "VES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
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
          </TableBody>
        </Table>
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
