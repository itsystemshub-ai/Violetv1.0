import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { lookupBarcode } from "@/lib/barcodeService";
import { withAIHealing } from "@/lib/aiErrorHandler";
import { InventoryService } from "@/features/inventory/services/inventory.service";
import { generatePDFReport } from "@/lib/pdfUtils";
import { inventarioService } from "@/services/microservices/inventario/InventarioService";
import { ForecastingService, ForecastResult } from "@/lib/ForecastingService";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAudit } from "@/hooks/useAudit";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { localDb } from "@/lib/localDb";
import { Product as ProductType } from "@/lib";

const VEHICLE_BRANDS = [
  "CHEVROLET", "FORD", "TOYOTA", "FIAT", "VOLKSWAGEN", "RENAULT", "MAZDA",
  "NISSAN", "IVECO", "HYUNDAI", "PEUGEOT", "CHERY", "MITSUBISHI", "DAEWOO",
  "JEEP", "HONDA", "MERCEDES BENZ", "DODGE", "ENCAVA", "KIA", "JAC", "IKCO",
  "JOHN DEERE", "HINO", "VOLVO", "CHRYSLER", "AGRALE", "HAIMA", "DONGFENG",
  "INTERNATIONAL NAVISTAR", "ISUZU", "MACK", "CITROEN", "FORDSON", "FOTON",
  "SUZUKI", "ZETOR", "CHANGAN", "SEAT", "BERA", "FORD TRACTOR", "YUTONG",
  "MASSEY FERGUSON", "JMC", "KOMATSU", "PERKINS", "FREIGTHLINER", "MAE",
  "MAS", "MFU", "MTR", "MCG", "TAP", "TNBR", "MAN", "MAST", "MTR",
];

export const useInventoryLogic = () => {
  const {
    products,
    fetchProducts,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
  } = useInventory();
  const { user } = useAuth();
  const { tableHeaders, activeTenantId } = useSystemConfig();
  const { auditLogs } = useAudit();

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditProduct, setAuditProduct] = useState<ProductType | null>(null);

  const isMaster = user?.isSuperAdmin;
  const canManageInventory =
    isMaster ||
    user?.role === "admin" ||
    user?.department === "Almacén" ||
    user?.department === "Administración / IT";
  const canExport =
    isMaster ||
    user?.permissions.includes("inventory:export") ||
    user?.role === "admin";

  const [forecasts, setForecasts] = useState<Record<string, ForecastResult>>({});
  const [isForecastLoading, setIsForecastLoading] = useState(false);

  const loadForecasts = useCallback(async () => {
    // Temporalmente deshabilitado para mejorar rendimiento
    // if (!activeTenantId || products.length === 0) return;
    // setIsForecastLoading(true);
    // try {
    //   const results = await ForecastingService.getAllRecommendations(
    //     products,
    //     activeTenantId,
    //   );
    //   const forecastMap = results.reduce(
    //     (acc, curr) => {
    //       acc[curr.productId] = curr;
    //       return acc;
    //     },
    //     {} as Record<string, ForecastResult>,
    //   );
    //   setForecasts(forecastMap);
    // } catch (error) {
    //   console.error("Error loading forecasts:", error);
    // } finally {
    //   setIsForecastLoading(false);
    // }
  }, [products, activeTenantId]);

  useEffect(() => {
    // loadForecasts(); // Deshabilitado temporalmente
  }, [loadForecasts]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState("stock");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Paginación manual simple
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 200;

  // Barcode lookup state
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  
  const handleBarcodeSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsBarcodeLoading(true);
    setBarcodeResult(null);
    const result = await lookupBarcode(searchQuery.trim());
    setBarcodeResult(result);
    setIsBarcodeLoading(false);
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [whSearchQuery, setWhSearchQuery] = useState("");
  const [whCategoryFilter, setWhCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rowNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const whStats = useMemo(() => {
    const stats = {
      brands: {
        cauplas: { count: 0, units: 0 },
        torflex: { count: 0, units: 0 },
        indomax: { count: 0, units: 0 },
        oem: { count: 0, units: 0 },
      },
      vehicleBrands: {} as Record<string, { count: number; units: number }>,
      categories: {} as Record<string, { count: number; units: number }>,
      fuel: {
        diesel: { count: 0, units: 0 },
        gasolina: { count: 0, units: 0 },
      },
      fuelTypes: {} as Record<string, { count: number; units: number }>, // Nueva distribución por tipo de combustible
      newItems: {} as Record<string, { count: number; units: number }>, // Nueva distribución por nuevos items
      new: { count: 0, units: 0 },
      combos: { count: 0, units: 0 },
    };

    products.forEach((p) => {
      const units = p.stock || 0;

      if (p.cauplas) {
        stats.brands.cauplas.count++;
        stats.brands.cauplas.units += units;
      }
      if (p.torflex && String(p.torflex).toUpperCase().startsWith("TX")) {
        stats.brands.torflex.count++;
        stats.brands.torflex.units += units;
      }
      if (p.indomax && String(p.indomax).toUpperCase().startsWith("MGM")) {
        stats.brands.indomax.count++;
        stats.brands.indomax.units += units;
      }
      if (p.oem) {
        stats.brands.oem.count++;
        stats.brands.oem.units += units;
      }

      if (p.category) {
        if (!stats.categories[p.category]) {
          stats.categories[p.category] = { count: 0, units: 0 };
        }
        stats.categories[p.category].count++;
        stats.categories[p.category].units += units;
      }

      const fuelStr = String(p.aplicacionesDiesel || (p as any).fuel || "").toUpperCase();
      if (fuelStr.includes("DIESEL")) {
        stats.fuel.diesel.count++;
        stats.fuel.diesel.units += units;
      } else if (fuelStr.includes("GASOLINA")) {
        stats.fuel.gasolina.count++;
        stats.fuel.gasolina.units += units;
      }

      // Distribución por tipo de combustible (columna H del Excel)
      const tipoCombustible = String(p.aplicacionesDiesel || "").trim();
      if (tipoCombustible && tipoCombustible !== "-") {
        if (!stats.fuelTypes[tipoCombustible]) {
          stats.fuelTypes[tipoCombustible] = { count: 0, units: 0 };
        }
        stats.fuelTypes[tipoCombustible].count++;
        stats.fuelTypes[tipoCombustible].units += units;
      }

      // Distribución por nuevos items (columna I del Excel)
      const nuevosItems = typeof p.isNuevo === 'string' ? p.isNuevo.trim() : '';
      if (nuevosItems && nuevosItems !== "-") {
        if (!stats.newItems[nuevosItems]) {
          stats.newItems[nuevosItems] = { count: 0, units: 0 };
        }
        stats.newItems[nuevosItems].count++;
        stats.newItems[nuevosItems].units += units;
      }

      if (p.isNuevo) {
        stats.new.count++;
        stats.new.units += units;
      }
      if (p.isCombo) {
        stats.combos.count++;
        stats.combos.units += units;
      }

      const desc = String(p.name || p.descripcionManguera || "").toUpperCase();
      for (const vBrand of VEHICLE_BRANDS) {
        if (desc.startsWith(vBrand)) {
          if (!stats.vehicleBrands[vBrand]) {
            stats.vehicleBrands[vBrand] = { count: 0, units: 0 };
          }
          stats.vehicleBrands[vBrand].count++;
          stats.vehicleBrands[vBrand].units += units;
          break;
        }
      }
    });

    return stats;
  }, [products]);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | undefined>(undefined);
  const [shouldClearBeforeImport, setShouldClearBeforeImport] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isPhotoImporting, setIsPhotoImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [transferData, setTransferData] = useState({
    productId: "",
    originWh: "wh-main",
    destWh: "wh-dist",
    quantity: 0,
  });

  const handleTransfer = async () => {
    if (!transferData.productId || transferData.quantity <= 0) {
      toast.error("Datos de transferencia inválidos.");
      return;
    }

    const product = products.find((p) => p.id === transferData.productId);
    if (!product) return;

    const originStock = InventoryService.getStockInWarehouse(product, transferData.originWh);
    if (originStock < transferData.quantity) {
      toast.error("Stock insuficiente en el almacén de origen.");
      return;
    }

    const updatedWhStocks = [...(product.warehouseStocks || [])];
    const originIdx = updatedWhStocks.findIndex((s) => s.warehouseId === transferData.originWh);
    if (originIdx >= 0) {
      updatedWhStocks[originIdx].stock -= transferData.quantity;
    } else {
      updatedWhStocks.push({
        warehouseId: transferData.originWh,
        stock: originStock - transferData.quantity,
      });
    }

    const destIdx = updatedWhStocks.findIndex((s) => s.warehouseId === transferData.destWh);
    if (destIdx >= 0) {
      updatedWhStocks[destIdx].stock += transferData.quantity;
    } else {
      updatedWhStocks.push({
        warehouseId: transferData.destWh,
        stock: transferData.quantity,
      });
    }

    await updateProduct(product.id, {
      warehouseStocks: updatedWhStocks,
    });

    setIsTransferOpen(false);
    toast.success(`Transferida ${transferData.quantity} unidad(es) de ${product.cauplas || product.name}`);
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) => {
    const searchTerms = debouncedSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    
    // Búsqueda inteligente en TODAS las columnas
    const searchableText = `
      ${p.rowNumber || ""} 
      ${p.cauplas || ""} 
      ${p.torflex || ""} 
      ${p.indomax || ""} 
      ${p.oem || ""} 
      ${p.name || ""} 
      ${p.descripcionManguera || ""} 
      ${p.aplicacion || ""} 
      ${p.category || ""} 
      ${p.aplicacionesDiesel || ""} 
      ${typeof p.isNuevo === 'string' ? p.isNuevo : (p.isNuevo ? 'NUEVO' : '')} 
      ${p.historial || ""} 
      ${p.ventasHistory?.[2023] || ""} 
      ${p.ventasHistory?.[2024] || ""} 
      ${p.ventasHistory?.[2025] || ""} 
      ${p.rankingHistory?.[2023] || ""} 
      ${p.rankingHistory?.[2024] || ""} 
      ${p.rankingHistory?.[2025] || ""} 
      ${p.precioFCA || p.price || ""} 
      ${p.stock || ""}
    `.toLowerCase();

    const matchesSearch = searchTerms.every((term) => searchableText.includes(term));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    
    // Calcular el estado basado en el stock
    let productStatus = "disponible";
    if (p.stock === 0) {
      productStatus = "agotado";
    } else if (p.stock <= (p.minStock || 0)) {
      productStatus = "poco_stock";
    }
    
    const matchesStatus = statusFilter === "all" || productStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let valA: any = a[sortBy as keyof ProductType] || "";
      let valB: any = b[sortBy as keyof ProductType] || "";

      if (sortBy === "name" || sortBy === "description") {
        valA = String(a.name || "").toLowerCase();
        valB = String(b.name || "").toLowerCase();
      } else if (sortBy === "cauplas") {
        valA = String(a.cauplas || "").toLowerCase();
        valB = String(b.cauplas || "").toLowerCase();
      } else if (sortBy === "torflex") {
        valA = String(a.torflex || "").toLowerCase();
        valB = String(b.torflex || "").toLowerCase();
      } else if (sortBy === "indomax") {
        valA = String(a.indomax || "").toLowerCase();
        valB = String(b.indomax || "").toLowerCase();
      } else if (sortBy === "oem") {
        valA = String(a.oem || "").toLowerCase();
        valB = String(b.oem || "").toLowerCase();
      } else if (sortBy === "price" || sortBy === "precioFCA") {
        valA = Number(a.precioFCA || a.price || 0);
        valB = Number(b.precioFCA || b.price || 0);
      } else if (sortBy === "stock") {
        valA = Number(a.stock || 0);
        valB = Number(b.stock || 0);
      } else if (sortBy === "category") {
        valA = String(a.category || "").toLowerCase();
        valB = String(b.category || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortBy, sortDirection]);

  // Paginación
  const pagination = usePagination({
    totalItems: sortedProducts.length,
    initialPageSize: 50,
  });

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  
  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, categoryFilter, statusFilter]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const categories = Array.from(new Set((products || []).map((p) => p.category))).filter(Boolean);

  const totalInventoryValue = (products || []).reduce((acc, curr) => {
    const price = curr.precioFCA !== undefined && curr.precioFCA !== null ? curr.precioFCA : curr.price || 0;
    return acc + price * (curr.stock || 0);
  }, 0);

  const brandChartData = useMemo(() => {
    return [
      { name: "Cauplas", value: whStats.brands.cauplas.count },
      { name: "Torflex", value: whStats.brands.torflex.count },
      { name: "Indomax", value: whStats.brands.indomax.count },
      { name: "OEM / Otros", value: whStats.brands.oem.count },
    ].filter((d) => d.value > 0);
  }, [whStats]);

  const fuelChartData = useMemo(() => {
    return [
      { name: "Diesel", value: whStats.fuel.diesel.units },
      { name: "Gasolina", value: whStats.fuel.gasolina.units },
      {
        name: "Otros",
        value: (products || []).reduce((acc, p) => {
          const fuelStr = String(p.aplicacionesDiesel || (p as any).fuel || "").toUpperCase();
          if (!fuelStr.includes("DIESEL") && !fuelStr.includes("GASOLINA")) {
            return acc + (p.stock || 0);
          }
          return acc;
        }, 0),
      },
    ].filter((d) => d.value > 0);
  }, [whStats, products]);

  const vehicleBrandChartData = useMemo(() => {
    return Object.entries(whStats.vehicleBrands)
      .sort((a, b) => b[1].units - a[1].units)
      .slice(0, 8)
      .map(([name, data]) => ({
        name,
        value: data.units,
      }));
  }, [whStats]);

  const lowStockCount = (products || []).filter((p) => p.stock <= p.minStock).length;

  const inventoryChartData = (products || []).reduce((acc: any[], product) => {
    const existing = acc.find((item: any) => item.name === product.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: product.category, value: 1 });
    }
    return acc;
  }, []);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!activeTenantId || activeTenantId === "none") {
      toast.error("Debes seleccionar una empresa antes de importar productos.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const validRows = (jsonData as any[]).filter((row) => 
          Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== "")
        );

        const mappedProducts: ProductType[] = validRows.map((row, index) => {
          const getVal = (keywords: string[]) => {
            const key = Object.keys(row).find((k) => keywords.some((kw) => k.toLowerCase().includes(kw.toLowerCase())));
            return key ? row[key] : undefined;
          };

          // Debug: ver las columnas del Excel
          if (index === 0) {
            console.log("Columnas del Excel:", Object.keys(row));
            console.log("Primera fila:", row);
          }

          const parseNum = (val: any) => {
            if (typeof val === "string") {
              const clean = val.replace(",", ".").replace(/[^\d.]/g, "");
              return parseFloat(clean) || 0;
            }
            return Number(val) || 0;
          };

          // Mapeo específico para el formato de Cauplas
          const rowNumber = parseNum(row["N°"] || row["N"] || row["numero"] || (index + 1));
          const cauplasVal = String(row["CAUPLAS"] || row["cauplas"] || getVal(["cauplas", "cau", "codigo cau"]) || "");
          const torflexVal = String(row["TORFLEX"] || row["torflex"] || getVal(["torflex", "tor"]) || "");
          const indomaxVal = String(row["INDOMAX"] || row["indomax"] || getVal(["indomax", "indo"]) || "");
          const oemVal = String(row["OEM"] || row["oem"] || getVal(["oem", "original"]) || "");
          const descVal = String(row["DESCRIPCION DEL PRODUCTO"] || row["DESCRIPCION"] || row["descripcion"] || getVal(["descripcion", "producto", "nombre"]) || "");
          const categoriaVal = String(row["CATEGORIA"] || row["categoria"] || row["category"] || getVal(["categoria", "category"]) || "Importación");
          
          // Ventas y ranking combinados en una sola columna
          // El Excel tiene valores totales, no separados por año
          const ventasTotal = parseNum(row["VENTAS 23 24 25"] || row["ventas 23 24 25"] || getVal(["ventas 23", "ventas"]));
          const rankingTotal = parseNum(row["RANKING 23 24 25"] || row["ranking 23 24 25"] || getVal(["ranking 23", "ranking"]));
          
          const precioFCA = parseNum(row["PRECIO FCA CÓRDOBA $"] || row["PRECIO FCA"] || row["precio fca"] || getVal(["precio fca", "fca", "precio"]));
          const cantidad = parseNum(row["CANTIDAD"] || row["cantidad"] || row["stock"] || getVal(["cantidad", "stock", "existencia"]));

          // Leer directamente las columnas H e I del Excel sin detección automática
          // Si las celdas están vacías, dejar los campos vacíos
          const tipoCombustible = String(row["TIPO DE COMBUSTIBLE"] || row["tipo de combustible"] || "").trim();
          const nuevosItems = String(row["NUEVOS ITEMS"] || row["nuevos items"] || "").trim();

          return {
            id: `import-${Date.now()}-${index}`,
            name: descVal,
            images: [cauplasVal ? `/mangueras/${cauplasVal}.jpg` : ""].filter(Boolean),
            cauplas: cauplasVal,
            torflex: torflexVal,
            indomax: indomaxVal,
            oem: oemVal,
            aplicacion: descVal, // Usar descripción como aplicación
            descripcionManguera: descVal,
            aplicacionesDiesel: tipoCombustible, // Leer directamente del Excel
            price: precioFCA,
            cost: precioFCA * 0.7, // Estimado: 70% del precio de venta
            stock: cantidad,
            minStock: 5,
            unit: "Unidad",
            category: categoriaVal,
            warehouseId: "wh-01",
            status: "disponible" as any,
            isNuevo: nuevosItems, // Leer directamente del Excel
            precioFCA: precioFCA,
            rowNumber: rowNumber,
            // IMPORTANTE: El Excel solo tiene totales, no datos por año individual
            // Guardamos el total en historial y dejamos los años en 0
            ventasHistory: {
              2023: 0, // No disponible en Excel
              2024: 0, // No disponible en Excel
              2025: ventasTotal, // Total acumulado en el año más reciente
            },
            historial: ventasTotal, // Total histórico de ventas
            rankingHistory: {
              2023: 0, // No disponible en Excel
              2024: 0, // No disponible en Excel
              2025: rankingTotal, // Ranking actual
            },
          } as ProductType;
        });

        // Debug: ver primer producto mapeado
        if (mappedProducts.length > 0) {
          console.log("Primer producto:", {
            rowNumber: mappedProducts[0].rowNumber,
            cauplas: mappedProducts[0].cauplas,
            ventas2023: mappedProducts[0].ventasHistory?.[2023],
            ventas2024: mappedProducts[0].ventasHistory?.[2024],
            ventas2025: mappedProducts[0].ventasHistory?.[2025],
            ranking2023: mappedProducts[0].rankingHistory?.[2023],
            ranking2024: mappedProducts[0].rankingHistory?.[2024],
            ranking2025: mappedProducts[0].rankingHistory?.[2025],
          });
        }

        // Deduplicar automáticamente usando Map con clave única
        const productMap = new Map<string, ProductType>();
        mappedProducts.forEach((p) => {
          const key = p.cauplas || p.oem || p.name;
          if (key && !productMap.has(key)) {
            productMap.set(key, p);
          }
        });
        const finalProducts = Array.from(productMap.values());

        await withAIHealing(
          {
            module: "inventory",
            operation: "addProductsBulk",
            payload: { count: finalProducts.length },
            context: "Importación masiva de productos desde Excel",
            notifyUser: true,
            fallback: { success: false },
          },
          async () => {
            if (shouldClearBeforeImport && activeTenantId) await inventarioService.clearInventory(activeTenantId);
            const result = await addProductsBulk(finalProducts);
            if (result.success && activeTenantId) {
              if (!shouldClearBeforeImport) await inventarioService.deduplicateInventory(activeTenantId);
              await fetchProducts();
              setShouldClearBeforeImport(false);
              toast.success(`Importación exitosa: ${finalProducts.length} productos importados`);
            }
            return result;
          }
        );
      } catch (error: any) {
        toast.error("No se pudo procesar el Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClear = async () => {
    if (!activeTenantId) return;
    try {
      await inventarioService.clearInventory(activeTenantId);
      await fetchProducts();
      toast.success("Reinicio de inventario exitoso");
    } catch (error) {
      toast.error("Error al vaciar el inventario.");
    }
  };

  const handleDeduplicate = async () => {
    if (!activeTenantId) return;
    setIsCleaning(true);
    try {
      if (activeTenantId) await inventarioService.deduplicateInventory(activeTenantId);
      await fetchProducts();
      toast.success("Limpieza de duplicados exitosa");
    } catch (error) {
      toast.error("Error al limpiar duplicados.");
    } finally {
      setIsCleaning(false);
    }
  };

  const processPhotos = async (files: FileList) => {
    if (!activeTenantId) {
      toast.error("No hay tenant activo");
      return;
    }
    
    setIsPhotoImporting(true);
    toast.info(`📸 Procesando ${files.length} foto(s)...`);
    
    try {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));

      if (fileArray.length === 0) {
        toast.error("No se encontraron imágenes válidas");
        setIsPhotoImporting(false);
        return;
      }

      const tenantId = activeTenantId;
      
      // Obtener productos directamente de IndexedDB para tener datos frescos
      const allProducts = await localDb.products.toArray();
      const currentProducts = allProducts.filter(p => p.tenantId === tenantId);
      
      console.log(`📦 Productos en IndexedDB: ${currentProducts.length}`);
      
      let updatedCount = 0;
      let notFoundCount = 0;
      let errorCount = 0;
      const productosConFotos = new Map<string, number>();

      // Procesar cada imagen
      for (const file of fileArray) {
        try {
          const fileName = file.name.split(".")[0].trim();
          console.log(`\n🔍 Procesando: ${file.name}`);
          
          // Normalizar código
          const normalizeCode = (code?: string) => code?.toString().trim().toUpperCase() || "";
          
          // Buscar coincidencia
          const matchesCode = (code?: string) => {
            if (!code) return false;
            const normalized = normalizeCode(code);
            const fileNormalized = fileName.toUpperCase();
            
            if (fileNormalized === normalized) return true;
            if (fileNormalized.startsWith(normalized)) {
              const remaining = fileNormalized.slice(normalized.length);
              return /^[_\s-]/.test(remaining) || remaining === "";
            }
            return false;
          };

          // Buscar producto
          const product = currentProducts.find((p) => 
            matchesCode(p.cauplas) || 
            matchesCode(p.torflex) || 
            matchesCode(p.indomax) || 
            matchesCode(p.oem)
          );

          if (!product) {
            notFoundCount++;
            console.log(`❌ Producto no encontrado: ${fileName}`);
            continue;
          }

          console.log(`✅ Producto: ${product.name} (${product.cauplas || product.oem})`);
          
          // Validaciones
          if (!file.type.startsWith('image/')) {
            errorCount++;
            console.log(`❌ Tipo inválido: ${file.type}`);
            continue;
          }
          
          if (file.size > 5 * 1024 * 1024) {
            errorCount++;
            console.log(`❌ Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            continue;
          }
          
          // Convertir a base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              if (result?.startsWith('data:image/')) {
                resolve(result);
              } else {
                reject(new Error("Formato inválido"));
              }
            };
            reader.onerror = () => reject(new Error("Error al leer archivo"));
            reader.readAsDataURL(file);
          });

          console.log(`✅ Convertido a base64: ${(base64.length / 1024).toFixed(2)}KB`);

          // Obtener producto actualizado de IndexedDB
          const freshProduct = await localDb.products.get(product.id);
          if (!freshProduct) {
            errorCount++;
            console.log(`❌ Producto no encontrado en DB`);
            continue;
          }

          const currentImages = Array.isArray(freshProduct.images) ? freshProduct.images : [];
          console.log(`📷 Fotos actuales: ${currentImages.length}/3`);
          
          // Verificar límite
          if (currentImages.length >= 3) {
            errorCount++;
            console.log(`⚠️ Máximo de 3 fotos alcanzado`);
            continue;
          }
          
          // Verificar duplicados (comparación simple por tamaño)
          const isDuplicate = currentImages.some(img => 
            Math.abs(img.length - base64.length) < 100
          );
          
          if (isDuplicate) {
            errorCount++;
            console.log(`⚠️ Foto duplicada`);
            continue;
          }
          
          // Agregar foto
          const updatedImages = [...currentImages, base64].slice(0, 3);
          const updatedProduct = { ...freshProduct, images: updatedImages };
          
          // Guardar en IndexedDB con retry
          let saved = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              await localDb.products.put(updatedProduct);
              saved = true;
              break;
            } catch (dbError) {
              console.log(`⚠️ Intento ${attempt}/3 falló, reintentando...`);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          if (saved) {
            updatedCount++;
            const productKey = product.cauplas || product.oem || product.name;
            productosConFotos.set(productKey, (productosConFotos.get(productKey) || 0) + 1);
            console.log(`✅ Foto guardada: ${updatedImages.length}/3 total`);
          } else {
            errorCount++;
            console.log(`❌ Error guardando en DB después de 3 intentos`);
          }
          
        } catch (fileError) {
          errorCount++;
          console.error(`❌ Error:`, fileError);
        }
      }

      // Refrescar UI - Forzar recarga completa
      console.log(`🔄 Refrescando UI...`);
      set({ products: [] });
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchProducts();

      // Notificaciones
      if (updatedCount > 0) {
        const cantidadProductos = productosConFotos.size;
        let mensaje = `✅ ${updatedCount} foto(s) agregada(s) a ${cantidadProductos} producto(s)`;
        
        if (cantidadProductos <= 3) {
          const detalles = Array.from(productosConFotos.entries())
            .map(([prod, cant]) => `${prod}: ${cant} foto(s)`)
            .join(', ');
          mensaje += `\n${detalles}`;
        }
        
        toast.success(mensaje, { duration: 5000 });
        
        console.log(`📊 Resumen:`);
        productosConFotos.forEach((cant, prod) => {
          console.log(`  📸 ${prod}: ${cant} foto(s)`);
        });
      }
      
      if (notFoundCount > 0) {
        toast.warning(`⚠️ ${notFoundCount} foto(s) sin producto`, { duration: 4000 });
      }
      
      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} foto(s) con errores`, { duration: 6000 });
      }

      console.log(`📊 Resumen Final:`);
      console.log(`  ✅ ${updatedCount} foto(s) agregadas`);
      console.log(`  ⚠️ ${notFoundCount} sin producto`);
      console.log(`  ❌ ${errorCount} con errores`);

    } catch (error) {
      console.error("❌ Error general:", error);
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al procesar imágenes: ${errorMsg}`);
    } finally {
      setIsPhotoImporting(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  const handleExport = (format: "xlsx" | "csv" | "json" | "pdf") => {
    const dataToExport = products.map((p) => ({
      CAUPLAS: p.cauplas || "",
      TORFLEX: p.torflex || "",
      INDOMAX: p.indomax || "",
      OEM: p.oem || "",
      DESCRIPCION: p.descripcionManguera || p.name || "",
      APLICACION: p.aplicacion || "",
      CATEGORIA: p.category || "",
      "TIPO DE COMBUSTIBLE": p.aplicacionesDiesel || "",
      "NUEVOS ITEMS": typeof p.isNuevo === 'string' ? p.isNuevo : (p.isNuevo ? 'NUEVO' : ''),
      "VENTAS 2023": p.ventasHistory?.[2023] || 0,
      "VENTAS 2024": p.ventasHistory?.[2024] || 0,
      "VENTAS 2025": p.ventasHistory?.[2025] || 0,
      HISTORIAL: p.historial || 0,
      "RANKING 2023": p.rankingHistory?.[2023] || "",
      "RANKING 2024": p.rankingHistory?.[2024] || "",
      "RANKING 2025": p.rankingHistory?.[2025] || "",
      "PRECIO FCA": p.precioFCA || p.price || 0,
      STOCK: p.stock || 0,
    }));

    if (format === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, "Inventario_Export.xlsx");
    } else if (format === "pdf") {
      generatePDFReport({
        title: "Reporte de Inventario",
        subtitle: "Catálogo General",
        filename: `inventario_${new Date().toISOString().split("T")[0]}.pdf`,
        columns: [
          { header: "CAUPLAS", dataKey: "cauplas" },
          { header: "Descripción", dataKey: "description" },
          { header: "Stock", dataKey: "stock" },
        ],
        data: products.map((p) => ({
          cauplas: p.cauplas || "N/A",
          description: p.descripcionManguera || p.name,
          stock: p.stock.toString(),
        })),
      });
    }
    // Add other formats as needed...
    setIsExportOpen(false);
  };

  return {
    // State
    products,
    filteredProducts: paginatedProducts,
    allFilteredProducts: sortedProducts,
    categories,
    user,
    canManageInventory,
    canExport,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortDirection,
    whStats,
    forecasts,
    isForecastLoading,
    totalInventoryValue,
    lowStockCount,
    brandChartData,
    fuelChartData,
    vehicleBrandChartData,
    inventoryChartData,
    
    // Paginación simple
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    
    // UI Toggles
    isFormOpen,
    setIsFormOpen,
    isAuditOpen,
    setIsAuditOpen,
    auditProduct,
    setAuditProduct,
    isExportOpen,
    setIsExportOpen,
    isTransferOpen,
    setIsTransferOpen,
    isCleaning,
    isPhotoImporting,
    
    // Refs for clicks
    fileInputRef,
    photoInputRef,
    folderInputRef,
    
    // Handlers
    handleSort,
    handleImport,
    handleExport,
    handleClear,
    handleDeduplicate,
    processPhotos,
    handleTransfer,
    handleBarcodeSearch,
    barcodeResult,
    setBarcodeResult,
    isBarcodeLoading,
    transferData,
    setTransferData,
    selectedProduct,
    setSelectedProduct,
    shouldClearBeforeImport,
    setShouldClearBeforeImport,
    whSearchQuery,
    setWhSearchQuery,
    whCategoryFilter,
    setWhCategoryFilter,
    
    // Actions from hook
    addProduct,
    updateProduct,
    deleteProduct,
    auditLogs,
    activeTenantId,
    tableHeaders,
  };
};
