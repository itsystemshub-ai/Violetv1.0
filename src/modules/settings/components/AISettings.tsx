/**
 * AISettings - Configuración del asistente de IA
 * 
 * Skills aplicadas:
 * - web-design-guidelines: Diseño de formularios
 * - tailwind-design-system: Estilos consistentes
 */

import React from 'react';
import { Bot, Sparkles, Check, Eye, EyeOff, Save } from 'lucide-react';
import { useAIStore } from '@/services/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export const AISettings: React.FC = () => {
  const { config, capabilities, updateConfig, toggleCapability, getDecryptedApiKey } = useAIStore();
  const [apiKeyInput, setApiKeyInput] = React.useState('');
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Load decrypted API key on mount
  React.useEffect(() => {
    const decryptedKey = getDecryptedApiKey();
    setApiKeyInput(decryptedKey);
  }, [getDecryptedApiKey]);

  const handleSaveApiKey = () => {
    updateConfig({ apiKey: apiKeyInput });
    toast.success('API Key guardada correctamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bot className="h-8 w-8 text-primary" />
          <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Asistente de IA</h2>
          <p className="text-muted-foreground">
            Configuración del asistente inteligente con 21 skills instaladas
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Activa o desactiva el asistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-enabled">Habilitar Asistente de IA</Label>
              <p className="text-sm text-muted-foreground">
                Muestra el botón flotante del asistente en todas las páginas
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Groq API</CardTitle>
          <CardDescription>
            Configura tu API key de Groq para usar el asistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key de Groq</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSaveApiKey} disabled={!apiKeyInput}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtén tu API key en{' '}
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

          <div className="space-y-2">
            <Label htmlFor="model">Modelo de IA</Label>
            <select
              id="model"
              value={config.model}
              onChange={(e) => updateConfig({ model: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Recomendado)</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="gemma2-9b-it">Gemma 2 9B</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Llama 3.3 70B ofrece el mejor balance entre velocidad y calidad
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperatura: {config.temperature}</Label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Menor = más preciso y determinista | Mayor = más creativo y variado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Tokens máximos: {config.maxTokens}</Label>
            <input
              id="max-tokens"
              type="range"
              min="500"
              max="4000"
              step="100"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controla la longitud máxima de las respuestas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidades del Asistente</CardTitle>
          <CardDescription>
            Activa o desactiva capacidades específicas basadas en las skills instaladas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {capabilities.map((capability) => (
              <div
                key={capability.id}
                className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{capability.name}</h4>
                    <Badge variant={capability.enabled ? 'default' : 'secondary'} className="text-xs">
                      {capability.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>
                </div>
                <Switch
                  checked={capability.enabled}
                  onCheckedChange={() => toggleCapability(capability.id)}
                  className="ml-4"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Status */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Instaladas</CardTitle>
          <CardDescription>
            Estado de las skills que potencian el asistente de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'code-review-excellence', category: 'Core' },
              { name: 'architecture-patterns', category: 'Core' },
              { name: 'vercel-react-best-practices', category: 'Core' },
              { name: 'typescript-advanced-types', category: 'Core' },
              { name: 'web-design-guidelines', category: 'UI/UX' },
              { name: 'tailwind-design-system', category: 'UI/UX' },
              { name: 'shadcn-ui', category: 'UI/UX' },
              { name: 'test-driven-development', category: 'Testing' },
              { name: 'webapp-testing', category: 'Testing' },
              { name: 'systematic-debugging', category: 'Testing' },
              { name: 'supabase-postgres-best-practices', category: 'Database' },
              { name: 'nodejs-backend-patterns', category: 'Backend' },
              { name: 'api-design-principles', category: 'Backend' },
              { name: 'better-auth-best-practices', category: 'Security' },
              { name: 'subagent-driven-development', category: 'Workflow' },
              { name: 'using-git-worktrees', category: 'Workflow' },
              { name: 'requesting-code-review', category: 'Workflow' },
              { name: 'writing-skills', category: 'Workflow' },
              { name: 'vercel-composition-patterns', category: 'Patterns' },
              { name: 'verification-before-completion', category: 'Quality' },
              { name: 'mcp-builder', category: 'Advanced' },
            ].map((skill) => (
              <div
                key={skill.name}
                className="flex items-center gap-2 p-2 border border-border rounded-md"
              >
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{skill.name}</p>
                  <p className="text-xs text-muted-foreground">{skill.category}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Asistente Potenciado con Skills</p>
              <p className="text-sm text-muted-foreground">
                El asistente de IA utiliza las 21 skills instaladas para proporcionar
                respuestas precisas y útiles basadas en las mejores prácticas de la industria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
