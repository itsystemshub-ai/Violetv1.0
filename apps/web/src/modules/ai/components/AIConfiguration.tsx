/**
 * AIConfiguration - Configuración de IA (Modular)
 */

import React, { useState } from "react";
import {
  Settings,
  Key,
  Sliders,
  Server,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@/shared/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAIStore } from "@/services/ai/AIService";
import { toast } from "sonner";

export const AIConfiguration: React.FC = () => {
  const { config, updateConfig, getDecryptedApiKey } = useAIStore();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [temperature, setTemperature] = useState(config.temperature);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [model, setModel] = useState(config.model);
  const [proxyUrl, setProxyUrl] = useState(config.proxyUrl || "");
  const [enabled, setEnabled] = useState(config.enabled);

  const handleSave = () => {
    updateConfig({
      apiKey: apiKey || undefined,
      temperature,
      maxTokens,
      model,
      proxyUrl: proxyUrl || undefined,
      enabled,
    });
    toast.success("Configuración guardada");
    setApiKey("");
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

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración General
          </CardTitle>
          <CardDescription>
            Configura el comportamiento del asistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable AI */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Habilitar IA</Label>
              <p className="text-sm text-muted-foreground">
                Activa o desactiva el asistente de IA
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
            <p className="text-xs text-muted-foreground">
              Llama 3.3 70B ofrece el mejor balance entre calidad y velocidad
            </p>
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
              Controla la creatividad de las respuestas (0 = preciso, 2 =
              creativo)
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tokens Máximos</Label>
              <span className="text-sm text-muted-foreground">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([value]) => setMaxTokens(value)}
              min={500}
              max={4000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Longitud máxima de las respuestas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuración de API
          </CardTitle>
          <CardDescription>Configura la conexión con Groq API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key de Groq</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
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
          </div>

          {/* Proxy URL */}
          <div className="space-y-2">
            <Label>URL del Proxy</Label>
            <Input
              type="url"
              placeholder="http://localhost:3001/api/groq/chat"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL del servidor proxy para las peticiones a Groq
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-linear-to-br from-cyan-500 to-magenta-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Server className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium">Información del Servidor Proxy</p>
              <p className="text-muted-foreground">
                El servidor proxy debe estar corriendo para que la IA funcione.
                Inicia el sistema completo con:
              </p>
              <code className="block bg-muted px-3 py-2 rounded-md">
                npm run dev:full
              </code>
              <p className="text-muted-foreground">
                El proxy estará disponible en el puerto 3001.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
