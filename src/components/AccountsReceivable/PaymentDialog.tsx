import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, CreditCard, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib";
import { cuentasPorCobrarService } from "@/services/microservices/tesoreria/CuentasPorCobrarService";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: {
    id: string;
    invoice_number: string;
    customer_name: string;
    balance: number;
    currency: string;
  } | null;
  onPaymentRegistered: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  account,
  onPaymentRegistered,
}) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) return;

    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (paymentAmount > account.balance) {
      toast.error("El monto no puede ser mayor al balance pendiente");
      return;
    }

    setIsProcessing(true);

    try {
      await cuentasPorCobrarService.registerPayment(
        account.id,
        paymentAmount,
        paymentMethod,
        reference,
        notes
      );

      toast.success("Pago registrado correctamente");
      
      // Limpiar formulario
      setAmount("");
      setPaymentMethod("cash");
      setReference("");
      setNotes("");
      
      // Cerrar diálogo
      onOpenChange(false);
      
      // Notificar al padre para recargar datos
      onPaymentRegistered();
    } catch (error) {
      toast.error("Error al registrar el pago");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
      case "credit_card":
      case "debit_card":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic">
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Factura: {account.invoice_number} - {account.customer_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Balance Pendiente */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              Balance Pendiente
            </p>
            <p className="text-3xl font-black italic text-primary">
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>

          {/* Monto del Pago */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-bold">
              Monto del Pago *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={account.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12 text-lg font-bold"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance / 2).toFixed(2))}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(account.balance.toFixed(2))}
              >
                100% (Total)
              </Button>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <Label htmlFor="payment-method" className="text-sm font-bold">
              Método de Pago *
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method" className="h-12">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(paymentMethod)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Efectivo
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Transferencia Bancaria
                  </div>
                </SelectItem>
                <SelectItem value="zelle">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Zelle
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    PayPal
                  </div>
                </SelectItem>
                <SelectItem value="credit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta de Crédito
                  </div>
                </SelectItem>
                <SelectItem value="debit_card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta de Débito
                  </div>
                </SelectItem>
                <SelectItem value="check">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cheque
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-sm font-bold">
              Referencia / Número de Transacción
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-12"
              placeholder="Ej: 123456789"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-bold">
              Notas Adicionales
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              placeholder="Información adicional sobre el pago..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isProcessing ? "Procesando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
