import React from "react";
import {
  BrainCircuit,
  Key,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "sonner";

interface AIChatPanelProps {
  aiConfig: any;
  updateAIConfig: (updates: any) => void;
  isMaster?: boolean;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
  aiConfig = {},
  updateAIConfig,
  isMaster,
}) => {
  const [apiKey, setApiKey] = React.useState(aiConfig?.apiKey || '');

  React.useEffect(() => {
    setApiKey(aiConfig?.apiKey || '');
  }, [aiConfig]);

  const handleSaveConfig = () => {
    if (updateAIConfig) {
      updateAIConfig({
        apiKey,
        enabled: true, // Siempre activo
      });
      toast.success('API Key de IA guardada correctamente');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Configuración de IA */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            Asistente Violet IA
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px]">
              Llama 3.3 70B · Groq
            </Badge>
          </CardTitle>
          <CardDescription>
            Configura la integración con servicios de IA para análisis y automatización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Groq API Key
            </Label>
            <Input
              type="password"
              placeholder="gsk_xxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Obtén tu API key en{" "}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.groq.com
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-primary/5">
            <div>
              <p className="text-sm font-medium">Estado de IA</p>
              <p className="text-xs text-muted-foreground">
                Inteligencia artificial siempre activa
              </p>
            </div>
            <Switch
              checked={true}
              disabled={true}
              className="opacity-100"
            />
          </div>

          <Button onClick={handleSaveConfig} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Guardar API Key
          </Button>
        </CardContent>
      </Card>

      {/* Funciones de IA */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Funciones Disponibles</CardTitle>
          <CardDescription>
            Módulos de IA que puedes activar en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "OCR de Facturas",
              desc: "Extracción automática de datos de facturas escaneadas",
              key: "ai_ocr_enabled",
            },
            {
              label: "Analista SQL",
              desc: "Consultas en lenguaje natural a la base de datos",
              key: "ai_sql_analyst_enabled",
            },
            {
              label: "Asistente de Ventas",
              desc: "Recomendaciones inteligentes de productos",
              key: "ai_sales_assistant_enabled",
            },
            {
              label: "Predicción de Inventario",
              desc: "Análisis predictivo de stock y demanda",
              key: "ai_inventory_prediction_enabled",
            },
          ].map((feat) => (
            <div key={feat.key} className="flex items-center justify-between p-3 rounded-xl border bg-primary/5">
              <div className="flex-1">
                <p className="text-sm font-medium">{feat.label}</p>
                <p className="text-xs text-muted-foreground">
                  {feat.desc}
                </p>
              </div>
              <Switch
                checked={true}
                disabled={true}
                className="opacity-100"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatPanel;
