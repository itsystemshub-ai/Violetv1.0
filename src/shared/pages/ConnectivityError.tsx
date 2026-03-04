import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Monitor, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Atomic Components
import { ConnectionVisualizer } from "@/shared/components/connectivity/organisms/ConnectionVisualizer";
import { InsightCard } from "@/shared/components/connectivity/molecules/InsightCard";

export default function ConnectivityError({ error }: { error?: Error | null }) {
  const { tenant } = useSystemConfig();
  const { user } = useAuth();
  const [presenceCount, setPresenceCount] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);

  // Status for the visualizer
  const [connectionStatus, setConnectionStatus] = useState<any>({
    local: "online",
    master: "checking",
    cloud: "online",
  });

  // Supabase Presence tracking
  useEffect(() => {
    if (!tenant.id || tenant.id === "none") return;

    const channel = supabase.channel(`presence:${tenant.id}`, {
      config: { presence: { key: user?.id || "anonymous" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setPresenceCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
            device: "desktop_app",
            username: user?.name || "Invitado",
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [tenant.id, user]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-12 relative z-10"
      >
        <ConnectionVisualizer status={connectionStatus} />

        {/* Textual Content */}
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1 border-primary/20 bg-primary/5 text-primary animate-bounce"
          >
            Infraestructura en Mantenimiento
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Ups! Algo anda{" "}
            <span className="text-primary italic">desconectado</span>.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hemos detectado una interrupción en la comunicación entre tu
            computadora y el nodo Maestro. No te preocupes, tus datos locales
            están seguros.
          </p>
        </div>

        {/* Real-time Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard
            icon={Activity}
            label="Latencia"
            value="14ms"
            subValue="Excelente"
            statusColor="emerald"
          />

          <InsightCard
            icon={Monitor}
            label="Red Local Activa"
            value={`${presenceCount} Equipos`}
            subValue="conectados"
            statusColor="indigo"
          >
            <div className="flex -space-x-2 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full bg-indigo-500 border-2 border-background animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </InsightCard>

          <InsightCard
            icon={AlertCircle}
            label="Master UUID"
            value="Checking..."
            subValue="Syncing"
            badgeText="REVISANDO"
            statusColor="amber"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <AnimatePresence mode="wait">
              {isRetrying ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  REINTENTANDO...
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  REINTENTAR CONEXIÓN
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8 rounded-2xl text-lg font-bold border-border hover:bg-muted/30"
          >
            Soporte Técnico
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-left max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-2 text-destructive mb-2 font-bold text-sm">
              <AlertCircle className="h-4 w-4" /> Detalle del Error Técnico
            </div>
            <pre className="text-[10px] font-mono opacity-70 overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </motion.div>
        )}

        {/* Footer info filtered/simplified */}
        <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <div className="flex items-center gap-2 text-sm italic">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            PostgreSQL Local: Conectado (Port 5432)
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
            <span>TID: {tenant.id.slice(0, 8)}</span>
            <span className="text-primary">•</span>
            <span>BUILD: 2026.02.RC2</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
