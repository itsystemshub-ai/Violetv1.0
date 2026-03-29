import React from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { useInventoryLogic } from "@/modules/inventory/hooks/useInventoryLogic";
import { ModuleAIAssistant } from "@/core/ai/components";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Search, Filter, Download, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function PriceListPage() {
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    allFilteredProducts,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useInventoryLogic();

  const getStatusBadge = (product: any) => {
    if (product.status === "inactive") {
      return (
        <Badge className="bg-slate-500 hover:bg-slate-600 text-white">
          Inactivo
        </Badge>
      );
    }
    if (product.stock === 0) {
      return (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
          Agotado
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
        Activo
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  if (isLoading) {
    return (
      <ValeryLayout sidebar={<ValerySidebar />}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </ValeryLayout>
    );
  }

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Lista de Precios
            </h1>
            <p className="text-muted-foreground mt-1">
              Catálogo completo de productos y precios de venta
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar a PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar a Excel
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descripción o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-sm"
            />
          </div>
          <Button variant="outline" size="icon" className="shadow-sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xl">Catálogo Activo</CardTitle>
            <CardDescription>
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "ítem encontrado"
                : "ítems encontrados"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">
                  No se encontraron productos en la lista
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border/50">
                    <tr>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-10">
                        N°
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-20">
                        CAUPLAS
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-20">
                        TORFLEX
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-20">
                        INDOMAX
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-20">
                        OEM
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-[280px]">
                        Descripción del Producto
                      </th>
                      <th className="text-left py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-24">
                        Categoría
                      </th>
                      <th className="text-right py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-24">
                        Precio de Venta
                      </th>
                      <th className="text-center py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-16">
                        Stock
                      </th>
                      <th className="text-center py-3 px-2 font-bold text-muted-foreground text-xs uppercase tracking-wider w-20">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="hover:bg-accent/30 transition-colors group"
                      >
                        <td className="py-2 px-2 font-medium text-[11px] text-muted-foreground">
                          {product.rowNumber || index + 1}
                        </td>
                        <td className="py-2 px-2 font-bold text-primary text-[11px] break-all leading-none">
                          {product.cauplas || "-"}
                        </td>
                        <td className="py-2 px-2 font-medium text-[11px] break-all leading-none">
                          {product.torflex || "-"}
                        </td>
                        <td className="py-2 px-2 font-medium text-[11px] break-all leading-none">
                          {product.indomax || "-"}
                        </td>
                        <td className="py-2 px-2 font-medium text-[10px] text-muted-foreground break-all leading-none">
                          {product.oem || "-"}
                        </td>
                        <td className="py-2 px-2">
                          <p className="font-bold text-foreground max-w-[280px] break-words uppercase text-[11px] leading-tight">
                            {product.descripcionManguera || product.name || "-"}
                          </p>
                        </td>
                        <td className="py-2 px-2">
                          <span className="bg-muted px-2 py-1 rounded text-[10px] font-medium uppercase break-words leading-none inline-block">
                            {product.category || "-"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <p className="font-black text-[13px] tabular-nums text-foreground leading-none">
                            $
                            {formatPrice(
                              product.precioFCA || product.price || 0,
                            )}
                          </p>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`font-bold ${product.stock > 0 ? "text-primary" : "text-rose-500"}`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {getStatusBadge(product)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/20">
                <p className="text-sm text-muted-foreground font-medium">
                  Página {currentPage} de {totalPages} (
                  {allFilteredProducts?.length || 0} ítems en total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ModuleAIAssistant
          moduleName="Lista de Precios"
          suggestions={[
            "Analizar márgenes de ganancia por categoría",
            "Identificar productos con alta rotación",
            "Sugerir ajustes de precio por tipo de cambio",
          ]}
        />
      </div>
    </ValeryLayout>
  );
}
