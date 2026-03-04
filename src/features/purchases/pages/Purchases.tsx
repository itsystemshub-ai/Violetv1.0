import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
  lazy,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PurchasesService } from "../services/purchases.service";
import { localDb } from "@/core/database/localDb";
import { Product } from "@/lib/index";
import { ModuleAIAssistant } from "@/core/ai/components";

// Lazy-loaded Organisms
const PurchasesHeader = lazy(
  () => import("@/components/Purchases/Organisms/PurchasesHeader"),
);
const PurchasesStats = lazy(
  () => import("@/components/Purchases/Organisms/PurchasesStats"),
);
const PurchasesHistoryTable = lazy(
  () => import("@/components/Purchases/Organisms/PurchasesHistoryTable"),
);
const PurchasesInsights = lazy(
  () => import("@/components/Purchases/Organisms/PurchasesInsights"),
);
const NewPurchaseDialog = lazy(
  () => import("@/components/Purchases/Organisms/NewPurchaseDialog"),
);
const NewSupplierDialog = lazy(
  () => import("@/components/Purchases/Organisms/NewSupplierDialog"),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12 w-full h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export default function Purchases() {
  const { tenant, exchangeRate } = useSystemConfig();
  const [compras, setCompras] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // New Purchase Form State
  const [newPurchase, setNewPurchase] = useState({
    proveedor_id: "",
    num_factura: "",
    num_control: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    tasa_bcv: exchangeRate || 0,
    items: [] as any[],
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    rif: "",
    category: "Operativo",
    phone: "",
    email: "",
  });

  const fetchData = useCallback(async () => {
    if (!tenant.id) return;
    setIsLoading(true);
    try {
      const [comprasData, suppliersData, productsData] = await Promise.all([
        localDb.compras_maestro
          .where("tenant_id")
          .equals(tenant.id)
          .reverse()
          .toArray(),
        localDb.suppliers.where("tenant_id").equals(tenant.id).toArray(),
        localDb.products.where("tenant_id").equals(tenant.id).toArray(),
      ]);
      setCompras(comprasData || []);
      setSuppliers(suppliersData || []);
      setProducts(productsData || []);
    } catch (error) {
      toast.error("Error al cargar datos del módulo.");
    } finally {
      setIsLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const totalUSD = compras.reduce((acc, c) => acc + (c.total_usd || 0), 0);
    const pendingUSD = compras
      .filter((c) => c.estatus === "PENDIENTE")
      .reduce((acc, c) => acc + (c.total_usd || 0), 0);
    return {
      totalUSD,
      totalBS: totalUSD * (exchangeRate || 0),
      pendingUSD,
      supplierCount: suppliers.length,
      purchaseCount: compras.length,
    };
  }, [compras, suppliers, exchangeRate]);

  const handleProcessPurchase = async () => {
    if (
      !newPurchase.proveedor_id ||
      !newPurchase.num_factura ||
      newPurchase.items.length === 0
    ) {
      toast.error("Complete los campos obligatorios.");
      return;
    }
    try {
      const result = await PurchasesService.procesarCompra(
        newPurchase,
        tenant.id,
      );
      if (result.success) {
        toast.success("Compra procesada.");
        setIsPurchaseModalOpen(false);
        setNewPurchase({
          proveedor_id: "",
          num_factura: "",
          num_control: "",
          fecha_emision: new Date().toISOString().split("T")[0],
          tasa_bcv: exchangeRate || 0,
          items: [],
        });
        fetchData();
      }
    } catch (error) {
      toast.error("Error al procesar la compra.");
    }
  };

  const handleAddSupplier = async () => {
    if (!PurchasesService.validarRIF(newSupplier.rif)) {
      toast.error("RIF inválido.");
      return;
    }
    try {
      await localDb.suppliers.add({
        id: crypto.randomUUID(),
        ...newSupplier,
        tenant_id: tenant.id,
        created_at: new Date().toISOString(),
        is_dirty: 1,
        version: 1,
      });
      toast.success("Proveedor registrado.");
      setIsSupplierModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Error al registrar proveedor.");
    }
  };

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      
      <div className="flex flex-col gap-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full relative z-0">
      <Suspense fallback={<LoadingFallback />}>
        <PurchasesHeader
          onNewPurchase={() => setIsPurchaseModalOpen(true)}
          onManageSuppliers={() => setIsSupplierModalOpen(true)}
        />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
              <TabsTrigger value="dashboard" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="historial" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Historial
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Proveedores
              </TabsTrigger>
              <TabsTrigger value="ordenes" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Órdenes
              </TabsTrigger>
              <TabsTrigger value="reportes" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Reportes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <PurchasesStats stats={stats} exchangeRate={exchangeRate} />
            
            {/* AI Assistant */}
            <ModuleAIAssistant
              moduleName="Compras"
              moduleContext="Gestión de compras, proveedores, órdenes de compra y control de gastos operativos"
              contextData={{
                totalPurchases: compras.length,
                totalSuppliers: suppliers.length,
                totalSpent: stats.totalSpent,
                pendingOrders: compras.filter(c => c.status === 'pendiente').length,
              }}
              compact
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <PurchasesHistoryTable
                  compras={compras.slice(0, 5)}
                  suppliers={suppliers}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
              <div className="space-y-6">
                <PurchasesInsights suppliers={suppliers} compras={compras} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            <PurchasesHistoryTable
              compras={compras}
              suppliers={suppliers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </TabsContent>

          <TabsContent value="proveedores" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-foreground">
                        {supplier.name}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {supplier.rif}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {supplier.category}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {supplier.phone && (
                      <p className="text-muted-foreground">📞 {supplier.phone}</p>
                    )}
                    {supplier.email && (
                      <p className="text-muted-foreground">✉️ {supplier.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ordenes" className="space-y-6">
            <div className="p-8 rounded-2xl border border-border bg-card text-center">
              <h3 className="text-xl font-black text-foreground mb-2">
                Órdenes de Compra
              </h3>
              <p className="text-muted-foreground">
                Gestiona tus órdenes de compra pendientes y aprobadas
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reportes" className="space-y-6">
            <div className="p-8 rounded-2xl border border-border bg-card text-center">
              <h3 className="text-xl font-black text-foreground mb-2">
                Reportes de Compras
              </h3>
              <p className="text-muted-foreground">
                Genera reportes detallados de tus adquisiciones
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <NewPurchaseDialog
          open={isPurchaseModalOpen}
          onOpenChange={setIsPurchaseModalOpen}
          newPurchase={newPurchase}
          setNewPurchase={setNewPurchase}
          suppliers={suppliers}
          products={products}
          onAddStream={() =>
            setNewPurchase((p) => ({
              ...p,
              items: [
                ...p.items,
                {
                  producto_id: "",
                  cantidad: 1,
                  precio_unitario_usd: 0,
                  porcentaje_iva: 16,
                },
              ],
            }))
          }
          onRemoveItem={(idx) =>
            setNewPurchase((p) => ({
              ...p,
              items: p.items.filter((_: any, i: number) => i !== idx),
            }))
          }
          onUpdateItem={(idx, field, val) =>
            setNewPurchase((p) => {
              const items = [...p.items];
              items[idx] = { ...items[idx], [field]: val };
              return { ...p, items };
            })
          }
          onProcess={handleProcessPurchase}
          exchangeRate={exchangeRate}
        />

        <NewSupplierDialog
          open={isSupplierModalOpen}
          onOpenChange={setIsSupplierModalOpen}
          newSupplier={newSupplier}
          setNewSupplier={setNewSupplier}
          onAdd={handleAddSupplier}
        />
      </Suspense>
    </div>
    </div>
  );
}
