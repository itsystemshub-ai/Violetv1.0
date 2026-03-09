import { Suspense, lazy, useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Search, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { cn } from "@/core/shared/utils/utils";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";

// Lazy-loaded components
const InventoryHeader = lazy(() =>
  import("@/modules/inventory/components/InventoryHeader").then((m) => ({
    default: m.InventoryHeader,
  })),
);
const InventoryTable = lazy(() =>
  import("@/modules/inventory/components/InventoryTable").then((m) => ({
    default: m.InventoryTable,
  })),
);
const PriceListPage = lazy(() =>
  import("@/modules/inventory/pages/PriceListPage").then((m) => ({
    default: m.default,
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

export default function InventoryManagementPage() {
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
    <ValeryLayout sidebar={<ValerySidebar />}>
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="flex flex-col gap-6 relative z-0 p-4 sm:p-6">
        <Suspense fallback={<LoadingTab />}>
          <InventoryHeader logic={logic as any} activeTab="stock" />

          <div className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 dark:text-muted-foreground" />
                <Input
                  placeholder="Búsqueda inteligente o código OEM..."
                  className="pl-10 pr-10 h-9 rounded-full backdrop-blur-xl bg-background/95 dark:bg-card/80 border-border/60 dark:border-border text-foreground dark:text-white placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground text-sm"
                  value={logic.searchQuery}
                  onChange={(e) => {
                    logic.setSearchQuery(e.target.value);
                    if (logic.barcodeResult) logic.setBarcodeResult(null);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && logic.handleBarcodeSearch()
                  }
                />
                {logic.isBarcodeLoading && (
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground/60 dark:text-muted-foreground" />
                )}
                {logic.isSearching && !logic.isBarcodeLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <div
                      className="w-1 h-1 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </div>

              <Select
                value={logic.categoryFilter}
                onValueChange={logic.setCategoryFilter}
              >
                <SelectTrigger className="w-[140px] h-9 rounded-full backdrop-blur-xl bg-background/95 dark:bg-card/80 border-border/60 dark:border-border text-foreground dark:text-white text-sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {logic.categories.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={logic.statusFilter}
                onValueChange={logic.setStatusFilter}
              >
                <SelectTrigger className="w-[130px] h-9 rounded-full backdrop-blur-xl bg-background/95 dark:bg-card/80 border-border/60 dark:border-border text-foreground dark:text-white text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquiera</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="poco_stock">Poco Stock</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resultado de búsqueda por código de barras */}
            {logic.barcodeResult && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm animate-in fade-in zoom-in duration-300 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                      ✅ Producto encontrado globalmente
                    </p>
                    <p className="text-base font-bold text-emerald-950">
                      {logic.barcodeResult.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0 w-full sm:w-auto"
                  onClick={() => {
                    logic.setSelectedProduct(logic.barcodeResult);
                    logic.setIsFormOpen(true);
                    logic.setBarcodeResult(null);
                    logic.setSearchQuery("");
                  }}
                >
                  Registrar en Inventario
                </Button>
              </div>
            )}

            {/* Tabla de productos */}
            <InventoryTable logic={logic as any} />
          </div>

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
    </ValeryLayout>
  );
}
