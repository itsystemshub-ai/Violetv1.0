/**
 * PaymentDialog
 * 
 * Diálogo para registrar el pago de una factura con diferencial cambiario.
 * Calcula automáticamente la ganancia o pérdida en cambio.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib';
import { ExchangeDifferenceService } from '@/lib/ExchangeDifferenceService';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  currentExchangeRate: number;
  onConfirm: (paymentData: {
    amount_usd: number;
    payment_rate: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
  }) => Promise<void>;
}

export const PaymentDialog = ({
  isOpen,
  onOpenChange,
  invoice,
  currentExchangeRate,
  onConfirm,
}: PaymentDialogProps) => {
  const [paymentRate, setPaymentRate] = useState(currentExchangeRate);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calcular diferencial en tiempo real
  const originalRate = invoice?.exchange_rate || invoice?.exchangeRate || 0;
  const amountUSD = invoice?.total || 0;
  const originalAmountBs = amountUSD * originalRate;
  const paymentAmountBs = amountUSD * paymentRate;
  const differenceBs = paymentAmountBs - originalAmountBs;
  const hasDifference = Math.abs(differenceBs) > 0.01;
  const isGain = differenceBs > 0;
  
  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setPaymentRate(currentExchangeRate);
      setPaymentMethod('transferencia');
      setReference('');
    }
  }, [isOpen, currentExchangeRate]);
  
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({
        amount_usd: amountUSD,
        payment_rate: paymentRate,
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod,
        reference: reference || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error procesando pago:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tighter uppercase">
            Registrar Pago
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
            Factura {invoice?.number} - {invoice?.customerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Información de la factura */}
          <div className="rounded-2xl bg-muted/20 p-4 border border-border/40">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">
                  Monto USD
                </p>
                <p className="text-lg font-black italic text-foreground">
                  {formatCurrency(amountUSD, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">
                  Tasa Factura
                </p>
                <p className="text-lg font-black italic text-foreground">
                  Bs.{originalRate.toFixed(2)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1">
                  Monto Original Bs
                </p>
                <p className="text-xl font-black italic text-primary">
                  {formatCurrency(originalAmountBs, 'VES')}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Datos del pago */}
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider mb-2 block">
                Tasa de Cambio al Cobrar
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={paymentRate}
                  onChange={(e) => setPaymentRate(parseFloat(e.target.value) || 0)}
                  className="pl-10 font-bold rounded-xl"
                  placeholder="Ej: 62.50"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider mb-2 block">
                Método de Pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                  <SelectItem value="punto_venta">Punto de Venta</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider mb-2 block">
                Referencia (Opcional)
              </Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-bold rounded-xl"
                placeholder="Ej: 0001234567"
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Resumen del diferencial */}
          <div className="rounded-2xl bg-muted/20 p-4 border border-border/40">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  Monto a Cobrar Bs
                </span>
                <span className="text-base font-black italic text-foreground">
                  {formatCurrency(paymentAmountBs, 'VES')}
                </span>
              </div>
              
              {hasDifference && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isGain ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {isGain ? 'Ganancia en Cambio' : 'Pérdida en Cambio'}
                      </span>
                    </div>
                    <Badge
                      variant={isGain ? 'default' : 'destructive'}
                      className={`font-black text-xs ${
                        isGain
                          ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-600 border-red-500/30'
                      }`}
                    >
                      {isGain ? '+' : ''}{formatCurrency(differenceBs, 'VES')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[9px] font-bold text-blue-600 leading-relaxed">
                      Se generará automáticamente un asiento contable por el diferencial cambiario
                      (Tasa Bs.{originalRate.toFixed(2)} → Bs.{paymentRate.toFixed(2)})
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="rounded-xl font-bold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || paymentRate <= 0}
            className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
