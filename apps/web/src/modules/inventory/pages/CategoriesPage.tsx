/**
 * CategoriesPage - Clasificación de Productos: Categorías, Marcas, Combustible, Nuevos Items
 * Datos derivados automáticamente de los productos importados
 */

import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { FolderTree, Search, Car, Fuel, Sparkles, Package } from "lucide-react";
import { useInventoryStore } from "@/modules/inventory/hooks/useInventoryStore";
import { Product } from "@/lib/index";
import { ModuleAIAssistant } from "@/core/ai/components";

const VEHICLE_BRANDS = [
  "CHEVROLET",
  "FORD",
  "TOYOTA",
  "FIAT",
  "VOLKSWAGEN",
  "RENAULT",
  "MAZDA",
  "NISSAN",
  "IVECO",
  "HYUNDAI",
  "PEUGEOT",
  "CHERY",
  "MITSUBISHI",
  "DAEWOO",
  "JEEP",
  "HONDA",
  "MERCEDES BENZ",
  "DODGE",
  "ENCAVA",
  "KIA",
  "JAC",
  "IKCO",
  "JOHN DEERE",
  "HINO",
  "VOLVO",
  "CHRYSLER",
  "AGRALE",
  "HAIMA",
  "DONGFENG",
  "INTERNATIONAL NAVISTAR",
  "ISUZU",
  "MACK",
  "CITROEN",
  "FORDSON",
  "FOTON",
  "SUZUKI",
  "ZETOR",
  "CHANGAN",
  "SEAT",
  "BERA",
  "FORD TRACTOR",
  "YUTONG",
  "MASSEY FERGUSON",
  "JMC",
  "KOMATSU",
  "PERKINS",
  "FREIGTHLINER",
  "MAE",
  "MAS",
  "MFU",
  "MTR",
  "MCG",
  "TAP",
  "TNBR",
  "MAN",
  "MAST",
];

const BRAND_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#D946EF",
  "#0EA5E9",
  "#A855F7",
  "#22C55E",
];

interface GroupItem {
  name: string;
  count: number;
  color: string;
}

export default function CategoriesPage() {
  const { products } = useInventoryStore();
  const [activeTab, setActiveTab] = useState("categorias");
  const [searchQuery, setSearchQuery] = useState("");
  const [drillDown, setDrillDown] = useState<{
    name: string;
    tab: string;
  } | null>(null);

  // Get products for the drill-down dialog
  const drillDownProducts: Product[] = useMemo(() => {
    if (!drillDown) return [];
    const { name, tab } = drillDown;
    const sortedBrands = [...VEHICLE_BRANDS].sort(
      (a, b) => b.length - a.length,
    );

    return products.filter((p) => {
      switch (tab) {
        case "categorias":
          return (p.category || "General") === name;
        case "marcas": {
          const aplicacion = (p.aplicacion || "").toUpperCase().trim();
          const desc = (p.descripcionManguera || p.name || "")
            .toUpperCase()
            .trim();
          const combined = aplicacion || desc;
          if (!combined) return false;
          for (const brand of sortedBrands) {
            if (combined.includes(brand)) {
              return brand === name;
            }
          }
          return false;
        }
        case "combustible":
          return (p.aplicacionesDiesel || "").trim() === name;
        case "nuevos":
          return String(p.isNuevo || "").trim() === name;
        default:
          return false;
      }
    });
  }, [drillDown, products]);

  // ─── Categorías ───
  const categoryGroups: GroupItem[] = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || "General";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
  }, [products]);

  // ─── Marcas (detectadas de la descripción del producto) ───
  const brandGroups: GroupItem[] = useMemo(() => {
    const map = new Map<string, number>();
    // Sort brands by length descending so longer names match first (e.g., "MERCEDES BENZ" before "MAN")
    const sortedBrands = [...VEHICLE_BRANDS].sort(
      (a, b) => b.length - a.length,
    );

    products.forEach((p) => {
      // Check aplicacion (vehicle field), name, and descripcionManguera
      const aplicacion = (p.aplicacion || "").toUpperCase().trim();
      const desc = (p.descripcionManguera || p.name || "").toUpperCase().trim();
      const combined = aplicacion || desc;

      if (!combined) return;

      for (const brand of sortedBrands) {
        if (combined.includes(brand)) {
          map.set(brand, (map.get(brand) || 0) + 1);
          break;
        }
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
  }, [products]);

  // ─── Combustible ───
  const fuelGroups: GroupItem[] = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const fuel = (p.aplicacionesDiesel || "").trim();
      if (fuel) {
        map.set(fuel, (map.get(fuel) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
  }, [products]);

  // ─── Nuevos Items ───
  const newItemGroups: GroupItem[] = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const val = String(p.isNuevo || "").trim();
      if (val) {
        map.set(val, (map.get(val) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BRAND_COLORS[i % BRAND_COLORS.length],
      }));
  }, [products]);

  // Filter helper
  const filterItems = (items: GroupItem[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  };

  // Get the current data based on active tab
  const getActiveData = () => {
    switch (activeTab) {
      case "categorias":
        return filterItems(categoryGroups);
      case "marcas":
        return filterItems(brandGroups);
      case "combustible":
        return filterItems(fuelGroups);
      case "nuevos":
        return filterItems(newItemGroups);
      default:
        return [];
    }
  };

  const getActiveIcon = () => {
    switch (activeTab) {
      case "categorias":
        return FolderTree;
      case "marcas":
        return Car;
      case "combustible":
        return Fuel;
      case "nuevos":
        return Sparkles;
      default:
        return Package;
    }
  };

  const getActiveTitle = () => {
    switch (activeTab) {
      case "categorias":
        return "Categorías";
      case "marcas":
        return "Marcas de Vehículos";
      case "combustible":
        return "Tipo de Combustible";
      case "nuevos":
        return "Nuevos Items";
      default:
        return "";
    }
  };

  const activeData = getActiveData();
  const ActiveIcon = getActiveIcon();
  const totalItemsInGroup = activeData.reduce((sum, g) => sum + g.count, 0);

  const kpiStats = [
    {
      label: "Categorías",
      value: categoryGroups.length,
      icon: FolderTree,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Marcas Detectadas",
      value: brandGroups.length,
      icon: Car,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Tipos Combustible",
      value: fuelGroups.length,
      icon: Fuel,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Etiq. Nuevos Items",
      value: newItemGroups.length,
      icon: Sparkles,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-primary" />
            Clasificación de Productos
          </h1>
          <p className="text-muted-foreground mt-1">
            Categorías, marcas, combustible y nuevos items derivados de{" "}
            {products.length} productos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <TabsList className="w-fit">
              <TabsTrigger value="categorias" className="gap-1.5">
                <FolderTree className="w-3.5 h-3.5" />
                Categorías ({categoryGroups.length})
              </TabsTrigger>
              <TabsTrigger value="marcas" className="gap-1.5">
                <Car className="w-3.5 h-3.5" />
                Marcas ({brandGroups.length})
              </TabsTrigger>
              <TabsTrigger value="combustible" className="gap-1.5">
                <Fuel className="w-3.5 h-3.5" />
                Combustible ({fuelGroups.length})
              </TabsTrigger>
              <TabsTrigger value="nuevos" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Nuevos Items ({newItemGroups.length})
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar en ${getActiveTitle().toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {["categorias", "marcas", "combustible", "nuevos"].map((tabKey) => (
            <TabsContent key={tabKey} value={tabKey}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <ActiveIcon className="w-5 h-5 text-primary" />
                    {getActiveTitle()}
                  </CardTitle>
                  <CardDescription>
                    {activeData.length} grupo
                    {activeData.length !== 1 ? "s" : ""} — {totalItemsInGroup}{" "}
                    producto{totalItemsInGroup !== 1 ? "s" : ""} en total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeData.length === 0 ? (
                    <div className="text-center py-12">
                      <ActiveIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "No se encontraron coincidencias"
                          : `No hay datos de ${getActiveTitle().toLowerCase()} en los productos importados`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeData.map((item, index) => (
                        <div
                          key={`${tabKey}-${index}`}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() =>
                            setDrillDown({ name: item.name, tab: tabKey })
                          }
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <ActiveIcon
                              className="w-5 h-5"
                              style={{ color: item.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {item.name}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="shrink-0 font-bold text-xs"
                          >
                            {item.count} items
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* AI Assistant */}
        <ModuleAIAssistant
          moduleName="Clasificación"
          suggestions={[
            "Analizar distribución de productos por marca",
            "Identificar marcas sin stock",
            "Top categorías con más productos",
            "Resumen de combustibles",
          ]}
        />
      </div>

      {/* Drill-down Dialog */}
      <Dialog
        open={!!drillDown}
        onOpenChange={(open) => !open && setDrillDown(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {drillDown?.name}
            </DialogTitle>
            <DialogDescription>
              {drillDownProducts.length} producto
              {drillDownProducts.length !== 1 ? "s" : ""} en este grupo
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-6 px-6">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-semibold text-muted-foreground">
                    Nº
                  </th>
                  <th className="py-2 px-2 font-semibold text-muted-foreground">
                    CAUPLAS
                  </th>
                  <th className="py-2 px-2 font-semibold text-muted-foreground">
                    Descripción
                  </th>
                  <th className="py-2 px-2 font-semibold text-muted-foreground text-right">
                    Stock
                  </th>
                  <th className="py-2 px-2 font-semibold text-muted-foreground text-right">
                    Precio
                  </th>
                  <th className="py-2 px-2 font-semibold text-muted-foreground">
                    Fotos
                  </th>
                </tr>
              </thead>
              <tbody>
                {drillDownProducts.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-accent/20 transition-colors"
                  >
                    <td className="py-2 px-2 text-muted-foreground">
                      {p.rowNumber || i + 1}
                    </td>
                    <td className="py-2 px-2 font-mono font-bold text-xs">
                      {p.cauplas || "-"}
                    </td>
                    <td className="py-2 px-2 max-w-[280px] truncate">
                      {p.descripcionManguera || p.name || "-"}
                    </td>
                    <td className="py-2 px-2 text-right font-bold">
                      {p.stock || 0}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      ${(p.precioFCA || p.price || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2">
                      {p.images && p.images.length > 0 ? (
                        <div className="flex gap-1">
                          {p.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              className="w-8 h-8 rounded object-cover border"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
