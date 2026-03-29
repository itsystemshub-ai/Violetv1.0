import React from "react";
import {
  Bell,
  Mail,
  Package,
  AlertTriangle,
  FileText,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

export const NotificationsPanel = () => {
  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
        <div className="h-1 bg-linear-to-r from-violet-500 via-indigo-500 to-fuchsia-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tighter">
            <Bell className="w-6 h-6 text-violet-500" />
            Centro de Notificaciones
          </CardTitle>
          <CardDescription className="font-medium">
            Configura cómo y cuándo quieres recibir alertas del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <Mail className="w-3 h-3" /> Canales de Entrega
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-card/30 transition-all hover:bg-card/50">
                <div className="space-y-1">
                  <Label className="text-sm font-bold tracking-tight">
                    Notificaciones por Email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recibe alertas críticas directamente en tu bandeja de
                    entrada.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-card/30 transition-all hover:bg-card/50 opacity-60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-bold tracking-tight">
                      Alertas de WhatsApp
                    </Label>
                    <span className="text-[9px] font-black bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                      Premium
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones instantáneas vía WhatsApp Business.
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </section>

          <Separator className="bg-border/30" />

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Alertas del Inventario
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-card/30 transition-all hover:bg-card/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold tracking-tight">
                      Stock Crítico
                    </Label>
                    <p className="text-xs text-muted-foreground font-medium italic">
                      Notificar cuando un producto llegue al mínimo.
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </section>

          <Separator className="bg-border/30" />

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> Operaciones y Ventas
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-card/30 transition-all hover:bg-card/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold tracking-tight">
                      Facturas Vencidas
                    </Label>
                    <p className="text-xs text-muted-foreground font-medium">
                      Alertas de cuentas por cobrar fuera de plazo.
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;
