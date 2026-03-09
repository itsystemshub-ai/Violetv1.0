import { Suspense, lazy, useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/core/shared/utils/utils";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";

// Lazy-loaded components
const InventoryDashboard = lazy(() =>
  import("@/modules/inventory/components/InventoryDashboard").then((m) => ({
    default: m.InventoryDashboard,
  })),
);
const InventoryDialogs = lazy(() =>
  import("@/modules/inventory/components/InventoryDialogs").then((m) => ({
    default: m.InventoryDialogs,
  })),
);

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function InventoryDashboardPage() {
  const logic = useInventoryLogic();
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollButtons(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

  return (
    <>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="flex flex-col gap-6 relative z-0 p-4 sm:p-6">
        <Suspense fallback={<LoadingTab />}>
          {/* Solo Dashboard - Sin tabs ni header */}
          <InventoryDashboard />

          <InventoryDialogs logic={logic as any} />
        </Suspense>

        {/* Floating Scroll Buttons */}
        <div
          className={cn(
            "fixed bottom-8 right-8 flex flex-col gap-2 transition-all duration-300 z-50",
            showScrollButtons
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 pointer-events-none",
          )}
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg backdrop-blur-xl bg-card/80 border border-border hover:bg-primary hover:text-primary-foreground"
            onClick={scrollToTop}
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg backdrop-blur-xl bg-card/80 border border-border hover:bg-primary hover:text-primary-foreground"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </>
  );
}
