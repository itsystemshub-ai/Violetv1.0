import React, { useState } from "react";
import {
  Plug,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Cloud,
  MessageSquare,
  ShoppingBag,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/core/shared/utils/utils";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "pending";
  lastSync?: string;
  icon: React.ElementType;
  description: string;
}

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    type: "Mensajería",
    enabled: true,
    status: "connected",
    lastSync: new Date().toISOString(),
    icon: MessageSquare,
    description: "Envío automático de facturas y notificaciones por WhatsApp.",
  },
  {
    id: "ml",
    name: "MercadoLibre",
    type: "Marketplace",
    enabled: true,
    status: "connected",
    lastSync: new Date().toISOString(),
    icon: ShoppingBag,
    description: "Sincronización de stock y ventas con MercadoLibre.",
  },
  {
    id: "drive",
    name: "Google Drive",
    type: "Cloud Storage",
    enabled: false,
    status: "disconnected",
    icon: Cloud,
    description: "Respaldo automático de documentos y reportes en la nube.",
  },
  {
    id: "slack",
    name: "Slack / Teams",
    type: "Colaboración",
    enabled: false,
    status: "disconnected",
    icon: MessageSquare,
    description: "Notificaciones de eventos críticos en canales de equipo.",
  },
  {
    id: "seniat",
    name: "SENIAT Direct",
    type: "Fiscal",
    enabled: true,
    status: "connected",
    lastSync: new Date().toISOString(),
    icon: FileText,
    description: "Reporte automático de libros de compra y venta.",
  },
];

export const IntegrationsPanel = () => {
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const handleToggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              enabled: !item.enabled,
              status: !item.enabled ? "connected" : "disconnected",
            }
          : item,
      ),
    );
    const item = integrations.find((i) => i.id === id);
    toast.success(
      `${item?.name} ${!item?.enabled ? "habilitado" : "deshabilitado"}`,
    );
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigOpen(true);
  };

  const saveConfig = () => {
    toast.success(
      `Configuración de ${selectedIntegration?.name} guardada correctamente`,
    );
    setConfigOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-violet-500" />
            Integraciones Externas
          </CardTitle>
          <CardDescription>
            Conecta Violet ERP con servicios de terceros para automatizar tu
            negocio de forma inteligente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border bg-card/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:border-violet-500/30 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                      integration.enabled
                        ? "bg-violet-500/10 text-violet-500"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <integration.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm tracking-tight text-foreground">
                        {integration.name}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0"
                      >
                        {integration.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium line-clamp-1">
                      {integration.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {integration.status === "connected" ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">
                          <CheckCircle2 className="w-3 h-3" /> Conectado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          <XCircle className="w-3 h-3" /> Sin conexión
                        </span>
                      )}
                      {integration.lastSync && (
                        <span className="text-[10px] text-muted-foreground/60 italic">
                          • Sinc:{" "}
                          {new Date(integration.lastSync).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="flex flex-col items-end gap-1 px-3 border-r border-border/50">
                    <Label className="text-[9px] font-black tracking-tighter text-muted-foreground uppercase">
                      Estado
                    </Label>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggle(integration.id)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 px-4 text-xs font-bold gap-2 hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/30"
                    onClick={() => handleConfigure(integration)}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configurar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          variant="outline"
          className="rounded-full gap-2 border-dashed px-8 border-violet-500/30 text-violet-500 hover:bg-violet-500/5"
        >
          <RefreshCw className="w-4 h-4" /> Buscar en Market de Violet
        </Button>
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-violet-500/20 shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-2">
              <Settings className="w-6 h-6 text-violet-500" />
            </div>
            <DialogTitle>Configurar {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Introduce las credenciales necesarias para establecer la conexión
              segura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                API Key / Client ID
              </Label>
              <Input
                placeholder="Introducir clave..."
                className="rounded-xl bg-muted/50 border-border/50"
                type="password"
                defaultValue="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Secret Token
              </Label>
              <Input
                placeholder="Introducir token..."
                className="rounded-xl bg-muted/50 border-border/50"
                type="password"
                defaultValue="••••••••••••••••"
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium italic">
                Tus datos están encriptados y protegidos por la bóveda de
                seguridad de Violet.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfigOpen(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveConfig}
              className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
            >
              Guardar Conexión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsPanel;
