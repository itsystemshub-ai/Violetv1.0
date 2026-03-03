import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare,
  BarChart3,
  Loader2
} from "lucide-react";
import { useInventoryAI } from "@/features/inventory/hooks/useInventoryAI";
import { Product } from "@/lib";
import { cn } from "@/lib/utils";

interface InventoryAIPanelProps {
  products: Product[];
  className?: string;
}

export const InventoryAIPanel = ({ products, className }: InventoryAIPanelProps) => {
  const {
    isLoading,
    error,
    aiInsights,
    analyzeInventory,
    detectAnomalies,
    analyzeSalesTrends,
    askAboutInventory,
  } = useInventoryAI();

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const handleAnalyze = async (type: string) => {
    setActiveAnalysis(type);
    setResponse(null);
    
    let result: string | null = null;
    
    switch (type) {
      case "general":
        result = await analyzeInventory(products);
        break;
      case "anomalies":
        result = await detectAnomalies(products);
        break;
      case "trends":
        result = await analyzeSalesTrends(products);
        break;
    }
    
    if (result) {
      setResponse(result);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setActiveAnalysis("question");
    setResponse(null);
    
    const result = await askAboutInventory(question, products);
    if (result) {
      setResponse(result);
      setQuestion("");
    }
  };

  return (
    <Card className={cn("backdrop-blur-xl bg-card/80 border-border shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Brain className="w-5 h-5" />
          Asistente IA de Inventario
          <Badge variant="outline" className="ml-auto">
            Powered by Groq
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botones de análisis rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAnalyze("general")}
            disabled={isLoading}
            className="justify-start gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Análisis General
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAnalyze("anomalies")}
            disabled={isLoading}
            className="justify-start gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Detectar Anomalías
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAnalyze("trends")}
            disabled={isLoading}
            className="justify-start gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Tendencias de Ventas
          </Button>
        </div>

        {/* Chat con IA */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Pregunta algo sobre tu inventario... Ej: ¿Qué productos debo reordenar?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Respuesta de IA */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-6 bg-muted/20 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Analizando con IA...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {response && !isLoading && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase">
                Respuesta de IA
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {response}
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          💡 La IA analiza {products.length} productos con precios FCA Córdoba en tiempo real
        </div>
      </CardContent>
    </Card>
  );
};
