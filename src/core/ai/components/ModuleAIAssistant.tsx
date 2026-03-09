import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  X,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Copy,
  Plus,
} from "lucide-react";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAI } from "@/core/ai/hooks/useAI";
import { cn } from "@/core/shared/utils/utils";
import { springPresets } from "@/lib/motion";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  type: "improvement" | "warning" | "insight" | "action";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface ModuleAIAssistantProps {
  moduleName: string;
  moduleContext: string;
  contextData?: any;
  className?: string;
  compact?: boolean;
}

export function ModuleAIAssistant({
  moduleName,
  moduleContext,
  contextData,
  className,
  compact = false,
}: ModuleAIAssistantProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isExpandingAction, setIsExpandingAction] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionText, setExtractionText] = useState("");
  const [extractedOrder, setExtractedOrder] = useState<any>(null);
  const { analyzeNaturalLanguage, extractOrderFromText, isLoading, aiConfig } =
    useAI();

  useEffect(() => {
    if (aiConfig?.apiKey && aiConfig?.enabled) {
      analyzeMod();
    }
  }, [moduleName, contextData]);

  const analyzeMod = async () => {
    if (!aiConfig?.apiKey) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `
Analiza el módulo "${moduleName}" del ERP con el siguiente contexto:
${moduleContext}

Datos actuales del módulo:
${JSON.stringify(contextData || {}, null, 2)}

Proporciona exactamente 4 sugerencias en formato JSON array con esta estructura:
[
  {
    "type": "improvement|warning|insight|action",
    "title": "Título corto",
    "description": "Descripción detallada",
    "priority": "high|medium|low"
  }
]

Las sugerencias deben ser:
1. Una mejora de proceso o eficiencia
2. Una advertencia o riesgo potencial
3. Un insight o análisis de datos
4. Una acción recomendada

Responde SOLO con el JSON array, sin texto adicional.
`;

      const response = await analyzeNaturalLanguage(prompt, moduleContext);

      if (response) {
        try {
          // Limpiar la respuesta de posibles bloques de código markdown
          const cleanResponse = response
            .replace(/```json\n?|\n?```/g, "")
            .trim();
          const parsedSuggestions = JSON.parse(cleanResponse);

          const formattedSuggestions: Suggestion[] = parsedSuggestions.map(
            (s: any, idx: number) => ({
              id: `${moduleName}-${idx}-${Date.now()}`,
              type: s.type || "insight",
              title: s.title || "Sugerencia",
              description: s.description || "",
              priority: s.priority || "medium",
            }),
          );

          setSuggestions(formattedSuggestions);
        } catch (parseError) {
          console.error("Error parsing AI suggestions:", parseError);
          // Crear sugerencias por defecto si falla el parsing
          setSuggestions(createDefaultSuggestions());
        }
      }
    } catch (error) {
      console.error("Error analyzing module:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractOrder = async () => {
    if (!extractionText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await extractOrderFromText(extractionText);
      if (result) {
        setExtractedOrder(result);
        toast.success("Pedido extraído correctamente.");
      }
    } catch (error) {
      toast.error("Error al extraer el pedido.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateDraft = () => {
    // Simulated action
    toast.success(
      `Borrador de pedido para ${extractedOrder.customerName} creado en Ventas.`,
    );
    setIsExpandingAction(false);
    setExtractionText("");
    setExtractedOrder(null);
  };

  const createDefaultSuggestions = (): Suggestion[] => {
    const defaultSuggestions: Record<string, Suggestion[]> = {
      Dashboard: [
        {
          id: "dash-1",
          type: "insight",
          title: "Análisis de Tendencias",
          description:
            "Revisa las métricas de ventas del último mes para identificar patrones estacionales.",
          priority: "medium",
        },
        {
          id: "dash-2",
          type: "action",
          title: "Optimizar Visualización",
          description:
            "Considera agregar gráficos de comparación año a año para mejor análisis.",
          priority: "low",
        },
      ],
      Ventas: [
        {
          id: "sales-1",
          type: "improvement",
          title: "Automatizar Seguimiento",
          description:
            "Implementa recordatorios automáticos para facturas pendientes de pago.",
          priority: "high",
        },
        {
          id: "sales-2",
          type: "insight",
          title: "Clientes Frecuentes",
          description:
            "Identifica tus top 10 clientes y crea programas de fidelización.",
          priority: "medium",
        },
      ],
      Inventario: [
        {
          id: "inv-1",
          type: "warning",
          title: "Stock Bajo",
          description:
            "Varios productos están cerca del punto de reorden. Revisa y genera órdenes de compra.",
          priority: "high",
        },
        {
          id: "inv-2",
          type: "improvement",
          title: "Optimización de Almacén",
          description:
            "Reorganiza productos por rotación para mejorar eficiencia de picking.",
          priority: "medium",
        },
      ],
      Compras: [
        {
          id: "pur-1",
          type: "action",
          title: "Negociar Precios",
          description:
            "Revisa contratos con proveedores principales para obtener mejores términos.",
          priority: "high",
        },
        {
          id: "pur-2",
          type: "insight",
          title: "Análisis de Proveedores",
          description:
            "Evalúa el desempeño de proveedores basado en tiempos de entrega y calidad.",
          priority: "medium",
        },
      ],
      Finanzas: [
        {
          id: "fin-1",
          type: "warning",
          title: "Flujo de Caja",
          description:
            "Proyecta el flujo de caja para los próximos 30 días y asegura liquidez.",
          priority: "high",
        },
        {
          id: "fin-2",
          type: "improvement",
          title: "Reducir Gastos",
          description:
            "Identifica gastos recurrentes que pueden optimizarse o eliminarse.",
          priority: "medium",
        },
      ],
    };

    return (
      defaultSuggestions[moduleName] || [
        {
          id: "default-1",
          type: "insight",
          title: "Análisis Disponible",
          description:
            "El asistente de IA puede proporcionar sugerencias personalizadas para este módulo.",
          priority: "low",
        },
      ]
    );
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "improvement":
        return <TrendingUp className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "insight":
        return <Lightbulb className="w-4 h-4" />;
      case "action":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "improvement":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "insight":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "action":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-500/10 text-red-600 border-red-500/20",
      medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      low: "bg-green-500/10 text-green-600 border-green-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (!aiConfig?.apiKey || !aiConfig?.enabled) {
    return null;
  }

  return (
    <Card className={cn("border-primary/20 shadow-lg", className)}>
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="bg-linear-to-br from-violet-500 to-indigo-500 p-2 rounded-lg">
                <BrainCircuit className="h-4 w-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Asistente IA - {moduleName}
                <Sparkles className="h-3 w-3 text-primary" />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {suggestions.length} sugerencias inteligentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                analyzeMod();
                toast.success("Analizando módulo...");
              }}
              disabled={isAnalyzing}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isAnalyzing && "animate-spin")}
              />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springPresets.gentle}
          >
            <CardContent className="pt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {isAnalyzing ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                        </div>
                      ))}
                    </>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        Haz clic en actualizar para obtener sugerencias
                      </p>
                    </div>
                  ) : (
                    suggestions.map((suggestion, idx) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              getSuggestionColor(suggestion.type),
                            )}
                          >
                            {getSuggestionIcon(suggestion.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm">
                                {suggestion.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  getPriorityBadge(suggestion.priority),
                                )}
                              >
                                {suggestion.priority === "high"
                                  ? "Alta"
                                  : suggestion.priority === "medium"
                                    ? "Media"
                                    : "Baja"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Acciones Especiales
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl h-10 border-primary/20 hover:border-primary/50 hover:bg-primary/5 gap-2 font-bold text-xs"
                    onClick={() => setIsExpandingAction(true)}
                  >
                    <MessageSquareQuote size={14} className="text-primary" />
                    Extraer Pedido
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isExpandingAction} onOpenChange={setIsExpandingAction}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-primary/10 dark:bg-slate-900 border-b">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles size={20} className="text-violet-400" />
              Extraer Pedido con IA
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pega el mensaje de WhatsApp o correo para que la IA extraiga los
              productos y cantidades.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {!extractedOrder ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Ej: Hola! Necesito 5 filtros de aceite y 2 pastillas de freno para hoy..."
                  className="min-h-[150px] rounded-2xl bg-slate-50 border-slate-200 focus:ring-violet-500 font-medium"
                  value={extractionText}
                  onChange={(e) => setExtractionText(e.target.value)}
                />
                <Button
                  className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 font-black uppercase text-xs"
                  onClick={handleExtractOrder}
                  disabled={isAnalyzing || !extractionText.trim()}
                >
                  {isAnalyzing
                    ? "Analizando Texto..."
                    : "Analizar y Extraer Datos"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs font-black uppercase text-slate-500">
                      Cliente Detectado
                    </span>
                    <span className="font-bold text-violet-600">
                      {extractedOrder.customerName}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {extractedOrder.items.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1"
                      >
                        <span className="font-medium text-slate-700">
                          {item.productName}
                        </span>
                        <span className="font-black italic text-slate-900">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-xs font-black uppercase text-slate-500">
                      Total Estimado
                    </span>
                    <span className="font-black text-lg text-slate-900">
                      ${extractedOrder.total}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => setExtractedOrder(null)}
                  >
                    Reintentar
                  </Button>
                  <Button
                    className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs gap-2"
                    onClick={handleCreateDraft}
                  >
                    <Plus size={16} />
                    Crear Borrador Pedido
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
