import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Send,
  Loader2,
  BarChart3,
  Package,
  History,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { localDb } from "@/core/database/localDb";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { aiService } from "@/services/ai/AIService";

export const SalesAISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { formatMoney } = useCurrencyStore();

  const handleAISearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);

    try {
      const lowerQuery = query.toLowerCase();

      // 1. Intent Detection (Simplified NLP)
      if (
        lowerQuery.includes("ventas") &&
        (lowerQuery.includes("hoy") || lowerQuery.includes("ahora"))
      ) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const sales = await localDb.invoices
          .where("date")
          .startsWith(todayStr)
          .and((inv) => inv.type === "venta")
          .toArray();

        const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        setResult({
          type: "stat",
          title: "Ventas de Hoy",
          icon: BarChart3,
          value: formatMoney(total),
          description: `Se han registrado ${sales.length} facturas hoy.`,
        });
      } else if (
        lowerQuery.includes("stock") ||
        lowerQuery.includes("inventario")
      ) {
        // Fallback to AI for complex stock questions
        const aiResponse = await aiService.debugAssistance(
          "El usuario pregunta sobre stock/inventario: " + query,
          "Modulo de Ventas - Dashboard",
        );
        setResult({
          type: "text",
          title: "Análisis de la IA",
          icon: Sparkles,
          content: aiResponse,
        });
      } else {
        // General Chat Fallback
        const aiResponse = await aiService.debugAssistance(
          "Pregunta del ERP: " + query,
          "Modulo de Ventas - Dashboard",
        );
        setResult({
          type: "text",
          title: "Respuesta de Violet AI",
          icon: Sparkles,
          content: aiResponse,
        });
      }
    } catch (err) {
      console.error("AI Search Error:", err);
      setResult({
        type: "text",
        title: "Error",
        icon: History,
        content:
          "No pude procesar la consulta en este momento. Revisa la conexión con Groq.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-primary via-violet-500 to-magenta-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-800/50 p-1.5 shadow-2xl">
          <div className="pl-5 pr-3 text-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
            placeholder="Pregunta a la IA: '¿Cuánto vendimos hoy?' o 'Resumen de stock crítico'..."
            className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 text-lg font-medium placeholder:text-slate-400"
            disabled={isSearching}
          />
          <Button
            onClick={handleAISearch}
            disabled={isSearching || !query.trim()}
            className="rounded-2xl h-11 px-6 bg-primary font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-primary/20 rounded-[2rem] p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                <result.icon className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="font-black italic uppercase text-xs text-primary tracking-widest">
                  {result.title}
                </h4>
                {result.type === "stat" ? (
                  <div className="space-y-1">
                    <p className="text-4xl font-black italic tracking-tighter text-foreground">
                      {result.value}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {result.description}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    {result.content}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setResult(null)}
                className="rounded-full h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <History className="w-4 h-4 opacity-40" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
