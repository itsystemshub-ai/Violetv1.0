/**
 * AISettings - Configuración del asistente de IA
 * 
 * Skills aplicadas:
 * - web-design-guidelines: Diseño de formularios
 * - tailwind-design-system: Estilos consistentes
 */

import React from 'react';
import { Bot, Sparkles, Check, X } from 'lucide-react';
import { useAIStore } from '@/services/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';

export const AISettings: React.FC = () => {
  const { config, capabilities, updateConfig, toggleCapability } = useAIStore();

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
