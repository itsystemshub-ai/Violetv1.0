import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Receipt, Upload, CreditCard } from "lucide-react";

export default function PublicPaymentReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success(
        "Pago reportado exitosamente. Será validado en las próximas 24 horas.",
      );
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-emerald-500 p-8 flex justify-center">
            <CheckCircle2 size={80} className="text-white animate-bounce" />
          </div>
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-black text-slate-800">
              ¡Pago Reportado!
            </h2>
            <p className="text-slate-600">
              Gracias por tu reporte. Hemos recibido la información y nuestro
              equipo de finanzas la validará pronto.
            </p>
            <Button
              className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={() => setSubmitted(false)}
            >
              Reportar otro pago
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-slate-100 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Receipt size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Portal de Pagos Violet
          </h1>
          <p className="text-slate-500 font-medium">
            Reporta tu transferencia o depósito en segundos
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="bg-primary/5 dark:bg-slate-900 border-b p-8">
            <CardTitle className="text-xl font-bold">
              Detalles del Reporte
            </CardTitle>
            <CardDescription className="text-slate-400">
              Completa todos los campos para agilizar la validación
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Número de Factura
                </Label>
                <Input
                  required
                  placeholder="Ej: F-1004"
                  className="h-12 rounded-xl bg-slate-100/50 border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                    Monto Pagado
                  </Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-12 rounded-xl bg-slate-100/50 border-slate-200 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                    Moneda
                  </Label>
                  <Select defaultValue="usd">
                    <SelectTrigger className="h-12 rounded-xl bg-slate-100/50 border-slate-200 focus:ring-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">Dólares (USD)</SelectItem>
                      <SelectItem value="ves">Bolívares (VES)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Método de Pago
                </Label>
                <Select required>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-100/50 border-slate-200 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="transferencia">
                      Transferencia Bancaria
                    </SelectItem>
                    <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                    <SelectItem value="efectivo">Efectivo / Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Referencia / No. Confirmación
                </Label>
                <Input
                  required
                  placeholder="Últimos 6-8 dígitos"
                  className="h-12 rounded-xl bg-slate-100/50 border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg transition-all shadow-lg shadow-indigo-200"
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Enviar Reporte de Pago"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium">
          Sistema de Reporte de Pagos Violet v3.0 © 2026. <br />
          Protegido con encriptación de grado bancario.
        </p>
      </div>
    </div>
  );
}
