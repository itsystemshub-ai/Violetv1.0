import React, { useState } from 'react';
import { Sparkles, Brain, Zap, Check, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';

export const AIToggle: React.FC = () => {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const handleToggleAI = async (enabled: boolean) => {
    if (enabled && !isConfigured) {
      toast.error('Configura tu API Key primero');
      return;
    }

    try {
      setAiEnabled(enabled);
      
      if (enabled) {
        toast.success('IA activada - Funciones inteligentes habilitadas');
        // Aquí iría la lógica de activación de IA
      } else {
        toast.info('IA desactivada - Funciones básicas activas');
        // Aquí iría la lógica de desactivación de IA
      }
    } catch (error) {
      toast.error('Error al cambiar modo IA');
      setAiEnabled(!enabled);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey.length < 10) {
      toast.error('API Key inválida');
      return;
    }

    // Guardar API key (encriptada)
    localStorage.setItem('groq_api_key', apiKey);
    setIsConfigured(true);
    toast.success('API Key guardada correctamente');
  };

  const aiFeatures = [
    { name: 'Sugerencias de productos', module: 'Facturación' },
    { name: 'Predicción de stock', module: 'Inventario' },
    { name: 'Análisis de ventas', module: 'Reportes' },
    { name: 'Detección de fraude', module: 'Seguridad' },
    { name: 'Optimización de precios', module: 'Ventas' },
    { name: 'Recomendaciones de compra', module: 'Compras' },
    { name: 'Predicción de morosidad', module: 'Cobranza' },
    { name: 'Análisis contable', module: 'Contabilidad' },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {aiEnabled ? (
              <Sparkles className="w-6 h-6 text-violet-500" />
            ) : (
              <Brain className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Inteligencia Artificial</CardTitle>
              <CardDescription>
                {aiEnabled 
                  ? 'Funciones inteligentes activas' 
                  : 'Funciones básicas activas'}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={aiEnabled}
            onCheckedChange={handleToggleAI}
            className="data-[state=checked]:bg-violet-500"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm font-medium">Estado de IA</p>
            <p className="text-xs text-muted-foreground mt-1">
              {aiEnabled ? 'Todas las funciones disponibles' : 'Funciones desactivadas'}
            </p>
          </div>
          <Badge variant={aiEnabled ? 'default' : 'secondary'} className="gap-1">
            {aiEnabled ? (
              <>
                <Zap className="w-3 h-3" />
                Activa
              </>
            ) : (
              'Inactiva'
            )}
          </Badge>
        </div>

        {/* Configuración de API Key */}
        {!isConfigured && (
          <div className="space-y-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                Configuración Requerida
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-xs">
                API Key de Groq
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleSaveApiKey}
                className="w-full bg-violet-500 hover:bg-violet-600"
              >
                Guardar API Key
              </Button>
              <p className="text-xs text-muted-foreground">
                Obtén tu API Key gratis en{' '}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-500 hover:underline"
                >
                  console.groq.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Funciones disponibles */}
        {aiEnabled && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Funciones disponibles:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{feature.name}</p>
                    <p className="text-[10px] text-muted-foreground">{feature.module}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información del proveedor */}
        {aiEnabled && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2">
            <p className="text-xs font-medium">Proveedor de IA:</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-medium">Groq</p>
                  <p className="text-[10px] text-muted-foreground">Llama 3.3 70B</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Ultra-rápido
              </Badge>
            </div>
          </div>
        )}

        {/* Información */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">
              {aiEnabled ? 'IA Activa' : 'IA Desactivada'}
            </p>
            <p className="mt-1">
              {aiEnabled
                ? 'Las funciones de IA están procesando tus datos para brindarte sugerencias inteligentes y análisis predictivos.'
                : 'Activa la IA para obtener sugerencias inteligentes, predicciones y análisis automáticos en todos los módulos.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIToggle;
