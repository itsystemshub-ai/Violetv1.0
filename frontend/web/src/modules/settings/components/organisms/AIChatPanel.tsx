import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Key,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Zap,
  Eye,
  EyeOff,
  Save,
  Bot,
  Code,
  Database,
  Palette,
  TestTube,
  Bug,
  FileCode,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@/shared/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "sonner";
import { useAIStore } from "@/services/ai/AIService";

interface AIChatPanelProps {
  aiConfig?: any;
  updateAIConfig?: (updates: any) => void;
  isMaster?: boolean;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ isMaster }) => {
  const {
    config,
    capabilities,
    updateConfig: updateAIStoreConfig,
    toggleCapability,
    getDecryptedApiKey,
  } = useAIStore();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [temperature, setTemperature] = useState(config.temperature);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [model, setModel] = useState(config.model);
  const [enabled, setEnabled] = useState(config.enabled);

  useEffect(() => {
    // Sincronizar con el store al montar
    setTemperature(config.temperature);
    setMaxTokens(config.maxTokens);
    setModel(config.model);
    setEnabled(config.enabled);
  }, [config]);

  const handleSaveConfig = () => {
    // Guardar en el store de IA (único source of truth)
    updateAIStoreConfig({
      apiKey: apiKey || undefined,
      temperature,
      maxTokens,
      model,
      enabled,
    });

    toast.success("Configuración de IA guardada correctamente");
    setApiKey(""); // Limpiar el campo por seguridad
    setShowApiKey(false);
  };

  const handleLoadApiKey = () => {
    const decrypted = getDecryptedApiKey();
    if (decrypted) {
      setApiKey(decrypted);
      setShowApiKey(true);
      toast.success("API Key cargada");
    } else {
      toast.error("No hay API Key guardada");
    }
  };

  const models = [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Recomendado)" },
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  ];

  const categoryIcons = {
    analysis: Code,
    automation: Zap,
    suggestion: Palette,
    chat: MessageSquare,
  };

  const categoryColors = {
    analysis: "text-cyan-500 bg-cyan-500/10",
    automation: "text-magenta-500 bg-magenta-500/10",
    suggestion: "text-purple-500 bg-purple-500/10",
    chat: "text-blue-500 bg-blue-500/10",
  };

  const enabledCapabilities = capabilities.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración General */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Configura el comportamiento del asistente de IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div>
                <p className="text-sm font-medium">Habilitar IA</p>
                <p className="text-xs text-muted-foreground">
                  Activa o desactiva el asistente
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperatura</Label>
                <span className="text-sm text-muted-foreground">
                  {temperature}
                </span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([value]) => setTemperature(value)}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controla la creatividad (0 = preciso, 2 = creativo)
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tokens Máximos</Label>
                <span className="text-sm text-muted-foreground">
                  {maxTokens}
                </span>
              </div>
              <Slider
                value={[maxTokens]}
                onValueChange={([value]) => setMaxTokens(value)}
                min={500}
                max={4000}
                step={100}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Configuración de API
            </CardTitle>
            <CardDescription>
              Configura la conexión con Groq API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>API Key de Groq</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button variant="outline" onClick={handleLoadApiKey}>
                  Cargar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtén tu API key en{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.groq.com/keys
                </a>
              </p>
              {apiKey && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>API Key lista para guardar</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Servidor Proxy</p>
                  <p className="text-muted-foreground">
                    El proxy debe estar corriendo en el puerto 3001
                  </p>
                  <code className="block bg-muted px-3 py-2 rounded-md text-xs">
                    npm run dev:full
                  </code>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveConfig}
              className="w-full bg-linear-to-r from-cyan-500 to-magenta-600"
            >
              <Save className="w-4 h-4 mr-2" /> Guardar Configuración
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Capacidades de IA */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Capacidades de IA ({enabledCapabilities}/21 activas)
          </CardTitle>
          <CardDescription>
            Gestiona las skills disponibles para el asistente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {capabilities.map((capability) => {
              const Icon =
                categoryIcons[
                  capability.category as keyof typeof categoryIcons
                ] || Code;
              const colorClass =
                categoryColors[
                  capability.category as keyof typeof categoryColors
                ];

              return (
                <div
                  key={capability.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`h-8 w-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">
                        {capability.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={capability.enabled}
                    onCheckedChange={() => toggleCapability(capability.id)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatPanel;
