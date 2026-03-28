import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@core/shared/utils/utils";

/**
 * PremiumHUD - Interfaz tipo "Sala de Guerra" (War Room)
 * Proporciona un overlay de HUD avanzado con micro-gráficos reactivos.
 */

interface PremiumHUDProps {
  children: React.ReactNode;
  active?: boolean;
}

export const PremiumHUD: React.FC<PremiumHUDProps> = ({
  children,
  active = true,
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground dark:bg-slate-950 dark:text-slate-100">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-20 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none dark:opacity-50" />

      {/* HUD Vignette */}
      <div className="absolute inset-0 z-0 bg-transparent dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />

      {/* HUD Corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-primary/10 dark:border-primary/30 m-4 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-primary/10 dark:border-primary/30 m-4 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-primary/10 dark:border-primary/30 m-4 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-primary/10 dark:border-primary/30 m-4 rounded-br-3xl pointer-events-none" />

      {/* Scanning Line */}
      <motion.div
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 dark:via-primary/40 to-transparent z-10 pointer-events-none blur-sm"
      />

      {/* Main Content */}
      <div className="relative z-10 transition-all duration-1000">
        {children}
      </div>

      {/* HUD Status Bar Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-border/50 bg-background/50 dark:bg-slate-900/50 backdrop-blur-xl z-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                pulse ? "bg-primary animate-pulse" : "bg-primary/50",
              )}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              System Core Active
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Stitch Pro v4.0.0-Beta
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
              Connection Yield
            </span>
            <span className="text-[10px] font-black text-emerald-400">
              99.98% OK
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
              Data Latency
            </span>
            <span className="text-[10px] font-black text-primary">12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
