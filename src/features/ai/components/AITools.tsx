/**
 * AITools - Herramientas especializadas de IA
 */

import React, { useState } from 'react';
import { Code, Database, Palette, TestTube, Bug, FileCode, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { aiService } from '@/services/ai/AIService';
import { toast } from 'sonner';

export const AITools: React.FC = () => {
  const [activeToolTab, setActiveToolTab] = useState('code-review');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const tools = [
    {
      id: 'code-review',
      name: 'Revisión de Código',
      description: 'Analiza código y sugiere mejoras',
      icon: Code,
      color: 'text-cyan-500',
      placeholder: 'Pega tu código aquí...',
      action: async (code: string) => {
        return await aiService.analyzeCode(code, 'typescript');
      },
    },
    {
      id: 'db-optimization',
      name: 'Optimización de BD',
      description: 'Optimiza queries SQL',
      icon: Database,
      color: 'text-magenta-500',
      placeholder: 'Pega tu query SQL aquí...',
      action: async (query: string) => {
        return await aiService.optimizeQuery(query);
      },
    },
    {
      id: 'ui-suggestions',
      name: 'Sugerencias UI/UX',
      description: 'Mejora diseño de componentes',
      icon: Palette,
      color: 'text-purple-500',
      placeholder: 'Describe tu componente...',
      action: async (description: string) => {
        return await aiService.getUIUXSuggestions('Componente', description);
      },
    },
    {
      id: 'test-generation',
      name: 'Generación de Tests',
      description: 'Genera tests automáticamente',
      icon: TestTube,
      color: 'text-blue-500',
      placeholder: 'Pega tu código para generar tests...',
      action: async (code: string) => {
        return await aiService.generateTests(code, 'typescript');
      },
    },
    {
      id: 'debugging',
      name: 'Asistente de Debugging',
      description: 'Ayuda a resolver bugs',
      icon: Bug,
      color: 'text-red-500',
      placeholder: 'Describe el error y el contexto...',
      action: async (description: string) => {
        const [error, context] = description.split('\n---\n');
        return await aiService.debugAssistance(error, context || '');
      },
    },
    {
      id: 'typescript-help',
      name: 'Ayuda TypeScript',
      description: 'Asistencia con tipos',
      icon: FileCode,
      color: 'text-indigo-500',
      placeholder: 'Pega tu código TypeScript y pregunta...',
      action: async (input: string) => {
        const [code, question] = input.split('\n---\n');
        return await aiService.typescriptHelp(code, question || '¿Cómo puedo mejorar esto?');
      },
    },
  ];

  const activeTool = tools.find(t => t.id === activeToolTab);

  const handleProcess = async () => {
    if (!input.trim()) {
      toast.error('Por favor ingresa el contenido a procesar');
      return;
    }

    if (!activeTool) return;

    setIsProcessing(true);
    setOutput('');

    try {
      const result = await activeTool.action(input);
      setOutput(result);
      toast.success('Procesado exitosamente');
    } catch (error) {
      console.error('Error processing:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar');
      setOutput('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tools Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all ${
                activeToolTab === tool.id
                  ? 'ring-2 ring-primary bg-accent'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setActiveToolTab(tool.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-${tool.color}/10 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Tool */}
      {activeTool && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg bg-${activeTool.color}/10 flex items-center justify-center`}>
                <activeTool.icon className={`h-6 w-6 ${activeTool.color}`} />
              </div>
              <div>
                <CardTitle>{activeTool.name}</CardTitle>
                <CardDescription>{activeTool.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input */}
              <div className="space-y-2">
                <Label>Entrada</Label>
                <Textarea
                  placeholder={activeTool.placeholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !input.trim()}
                  className="w-full bg-linear-to-br from-cyan-500 to-magenta-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Procesar con IA
                    </>
                  )}
                </Button>
              </div>

              {/* Output */}
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Textarea
                  placeholder="El resultado aparecerá aquí..."
                  value={output}
                  readOnly
                  className="min-h-[400px] font-mono text-sm bg-muted"
                />
                {output && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(output);
                      toast.success('Copiado al portapapeles');
                    }}
                    className="w-full"
                  >
                    Copiar Resultado
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
