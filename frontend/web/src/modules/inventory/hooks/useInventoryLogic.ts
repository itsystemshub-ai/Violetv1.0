import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { barcodeService } from "@/modules/inventory/services/barcode.service";
import { InventoryService } from "@/modules/inventory/services/inventory.service";
import { inventarioService } from "@/services/microservices/inventario/InventarioService";
// import { ForecastingService, ForecastResult } from "@/lib/ForecastingService";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useInventory } from "./useInventory";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useAudit } from "@/modules/settings/hooks/useAudit";
import { useDebounce } from "@/core/shared/hooks/useDebounce";
import { Product as ProductType } from "@/lib";
import { useInventoryForecast } from "./useInventoryAI";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";

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
    isLoading: invLoading,
    fetchProducts,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
  } = useInventory();
  
  // Logic Engine: AI Forecasts
  const { forecasts, suggestedPurchases } = useInventoryForecast(products);
  const { user } = useAuth();
  const { tableHeaders, activeTenantId } = useSystemConfig();
  const { auditLogs } = useAudit();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, isActive: false, type: "" as "excel" | "photos" | "" });

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

  const location = useLocation();
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes("/inventory/stats")) return "warehouses";
    if (path.includes("/inventory/analytics")) return "charts";
    if (path.includes("/inventory/catalog")) return "catalog";
    if (path.includes("/inventory/products")) return "stock";
    if (path === "/inventory" || path === "/inventory/") return "dashboard";
    return "stock";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update tab when location changes (e.g. sidebar clicks)
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Paginación manual optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Barcode lookup state
  const [barcodeResult, setBarcodeResult] = useState<any>(null);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  
  const handleBarcodeSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsBarcodeLoading(true);
    setBarcodeResult(null);
    // Buscar producto por código de barras
    const result = products.find(p => 
      p.id === searchQuery.trim() || 
      barcodeService.generateBarcode(p.id) === searchQuery.trim()
    );
    setBarcodeResult(result || { error: 'Producto no encontrado' });
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
      fuelTypes: {} as Record<string, { count: number; units: number }>, 
      newItems: {} as Record<string, { count: number; units: number }>, 
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

      const tipoCombustible = String(p.aplicacionesDiesel || "").trim();
      if (tipoCombustible && tipoCombustible !== "-") {
        if (!stats.fuelTypes[tipoCombustible]) {
          stats.fuelTypes[tipoCombustible] = { count: 0, units: 0 };
        }
        stats.fuelTypes[tipoCombustible].count++;
        stats.fuelTypes[tipoCombustible].units += units;
      }

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

      const desc = String(p.aplicacion || p.name || p.descripcionManguera || "").toUpperCase();
      for (const vBrand of VEHICLE_BRANDS) {
        if (desc.includes(vBrand)) {
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
  const [isPhotoImporting, setIsPhotoImporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
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

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    const searchTerms = debouncedSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    
    return products.filter((p) => {
      // Optimización: Solo buscar en campos clave para evitar generar strings masivos
      const matchesSearch = searchTerms.length === 0 || searchTerms.every((term) => 
        (p.cauplas?.toLowerCase().includes(term)) ||
        (p.name?.toLowerCase().includes(term)) ||
        (p.descripcionManguera?.toLowerCase().includes(term)) ||
        (p.oem?.toLowerCase().includes(term)) ||
        (p.indomax?.toLowerCase().includes(term)) ||
        (p.torflex?.toLowerCase().includes(term))
      );

      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      
      let productStatus = "disponible";
      if (p.status === "inactive") {
        productStatus = "inactive";
      } else if (p.stock === 0) {
        productStatus = "agotado";
      } else if (p.stock <= (p.minStock || 0)) {
        productStatus = "poco_stock";
      }
      
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "active" ? p.status !== "inactive" && p.stock > 0 :
        statusFilter === "agotado" ? p.status !== "inactive" && p.stock === 0 :
        statusFilter === "photos" ? true : // Include all for sorting in photos tab
        productStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, debouncedSearchQuery, categoryFilter, statusFilter]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      // Prioridad: Si estamos en fotos, ordenar por cantidad de fotos (ascendente)
      if (statusFilter === "photos") {
        const photosA = a.images?.length || 0;
        const photosB = b.images?.length || 0;
        if (photosA !== photosB) return photosA - photosB;
      }

      let valA: any = a[sortBy as keyof ProductType] || "";
      let valB: any = b[sortBy as keyof ProductType] || "";

      if (sortBy === "name" || sortBy === "description") {
        valA = String(a.name || "").toLowerCase();
        valB = String(b.name || "").toLowerCase();
      } else if (sortBy === "cauplas") {
        valA = String(a.cauplas || "").toLowerCase();
        valB = String(b.cauplas || "").toLowerCase();
      } else if (sortBy === "price" || sortBy === "precioFCA") {
        valA = Number(a.precioFCA || a.price || 0);
        valB = Number(b.precioFCA || b.price || 0);
      } else if (sortBy === "stock") {
        valA = Number(a.stock || 0);
        valB = Number(b.stock || 0);
      } else if (sortBy === "rowNumber") {
        valA = Number(a.rowNumber || 999999);
        valB = Number(b.rowNumber || 999999);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortBy, sortDirection]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  
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

  const totalInventoryValue = useMemo(() => {
    return (products || []).reduce((acc, curr) => {
      const price = curr.precioFCA !== undefined && curr.precioFCA !== null ? curr.precioFCA : curr.price || 0;
      return acc + price * (curr.stock || 0);
    }, 0);
  }, [products]);

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
    ].filter((d) => d.value > 0);
  }, [whStats]);

  const vehicleBrandChartData = useMemo(() => {
    return Object.entries(whStats.vehicleBrands)
      .sort((a, b) => b[1].units - a[1].units)
      .slice(0, 8)
      .map(([name, data]) => ({
        name,
        value: data.units,
      }));
  }, [whStats]);

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
    console.log("📂 Archivo seleccionado para importar:", file?.name);
    if (!file) return;

    console.log("🏢 Empresa activa ID:", activeTenantId);
    if (!activeTenantId || activeTenantId === "none") {
      toast.error("Debes seleccionar una empresa antes de importar productos.");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0, isActive: true, type: "excel" });
    toast.info("Procesando archivo Excel...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        setImportProgress(prev => ({ ...prev, total: jsonData.length }));
        
        // Track CAUPLAS codes to prevent duplicates within the file
        const existingCauplas = new Set<string>();

        const finalProducts: any[] = [];
        (jsonData as any[]).forEach((row) => {
          // Normalize row keys
          const normalizedRow: any = {};
          Object.keys(row).forEach(k => {
            normalizedRow[k.trim().toUpperCase()] = row[k];
          });
          
          setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));

          // Extract CAUPLAS code (única validación de duplicados)
          const cauplas = String(normalizedRow["CAUPLAS"] || "").trim().toUpperCase();
          
          // Skip if no CAUPLAS code
          if (!cauplas) {
            console.warn("⚠️ Producto sin código CAUPLAS, omitido");
            return;
          }

          // Skip if CAUPLAS already exists in this file
          if (existingCauplas.has(cauplas)) {
            console.warn(`⚠️ CAUPLAS duplicado en archivo: ${cauplas}, omitido`);
            return;
          }
          
          existingCauplas.add(cauplas);

          const torflex = String(normalizedRow["TORFLEX"] || "").trim().toUpperCase();
          const indomax = String(normalizedRow["INDOMAX"] || "").trim().toUpperCase();
          const oem = String(normalizedRow["OEM"] || "").trim().toUpperCase();

          // Stock and Status
          const stockVal = parseFloat(String(normalizedRow["CANTIDAD"] || "0").replace(/[^0-9.-]+/g, "")) || 0;
          const status = stockVal > 0 ? "active" : "inactive";

          // Price
          const priceVal = parseFloat(String(normalizedRow["PRECIO FCA CÓRDOBA $"] || normalizedRow["PRECIO FCA"] || normalizedRow["PRECIO"] || "0").replace(/[^0-9.-]+/g, "")) || 0;

          // Extraer número de fila (N°, NO, NUMERO, etc)
          const rowNumberKey = Object.keys(normalizedRow).find(k => k === "N°" || k === "Nº" || k === "NO" || k === "NUM" || k === "NUMERO");
          let rowNumVal = undefined;
          if (rowNumberKey && normalizedRow[rowNumberKey]) {
            rowNumVal = parseInt(String(normalizedRow[rowNumberKey]).replace(/\D/g, "")) || undefined;
          }

          finalProducts.push({
            cauplas: cauplas,
            descripcionManguera: normalizedRow["DESCRIPCION DEL PRODUCTO"] || normalizedRow["DESCRIPCIÓN DEL PRODUCTO"] || normalizedRow["DESCRIPCION"] || "Sin descripción",
            torflex: torflex,
            indomax: indomax,
            oem: oem,
            category: normalizedRow["CATEGORIA"] || normalizedRow["CATEGORÍA"] || "General",
            aplicacion: normalizedRow["APLICACION"] || normalizedRow["APLICACIÓN"] || normalizedRow["VEHICULO"] || normalizedRow["VEHÍCULO"] || "",
            aplicacionesDiesel: String(normalizedRow["TIPO DE COMBUSTIBLE"] || normalizedRow["COMBUSTIBLE"] || "").trim(),
            isNuevo: String(normalizedRow["NUEVOS ITEMS"] || normalizedRow["NUEVO"] || "").trim(),
            historial: parseInt(String(normalizedRow["VENTAS 23 24 25"] || "0")) || 0,
            rankingHistory: { 2025: parseInt(String(normalizedRow["RANKING 23 24 25"] || "0")) || 0 },
            precioFCA: priceVal,
            cost: Math.round((priceVal / 1.30) * 100) / 100,
            margen: 30,
            stock: stockVal,
            minStock: 5,
            status: status,
            warehouseId: "default",
            tenantId: activeTenantId,
            rowNumber: rowNumVal,
            images: [],
          });
        });

        const result = await addProductsBulk(finalProducts);
        if (result.success) {
          toast.success(`Importación exitosa: ${finalProducts.length} productos.`);
          addNotification({
            module: "Inventario",
            type: "success",
            title: "Importación de Inventario Completada",
            message: `Se han importado ${finalProducts.length} productos desde Excel exitosamente.`,
          });
          fetchProducts();
        }
      } catch (error) {
        console.error("Error importando Excel:", error);
        toast.error("Error al procesar el Excel.");
      } finally {
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0, isActive: false, type: "" });
        if (event.target) event.target.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Error al leer el archivo.");
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
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

  const processPhotos = async (files: FileList) => {
    if (!files.length) return;
    setIsPhotoImporting(true);
    setImportProgress({ current: 0, total: files.length, isActive: true, type: "photos" });

    try {
      // Build lookup: CAUPLAS code -> product (only CAUPLAS)
      const cauplasMap = new Map<string, ProductType>();
      products.forEach(p => {
        if (p.cauplas) {
          cauplasMap.set(String(p.cauplas).trim().toUpperCase(), p);
        }
      });

      console.log(`[Photos] ${cauplasMap.size} products with CAUPLAS codes, ${files.length} files to process`);

      // Group files by product
      const productFiles = new Map<string, { product: ProductType; dataUrls: string[] }>();

      // OPTIMIZACIÓN: Procesar archivos en paralelo con Promise.all
      const fileArray = Array.from(files);
      const BATCH_SIZE = 20; // Procesar 20 imágenes a la vez (aumentado de 10 para mayor velocidad)
      
      for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        const batch = fileArray.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (file) => {
          const baseName = file.name.replace(/\.[^.]+$/, '').trim().toUpperCase();

          let matchedProduct: ProductType | undefined;

          // Exact match first
          matchedProduct = cauplasMap.get(baseName);

          // If no exact match, check if filename STARTS with any CAUPLAS code
          if (!matchedProduct) {
            for (const [code, product] of cauplasMap) {
              if (baseName.startsWith(code)) {
                matchedProduct = product;
                break;
              }
            }
          }

          if (!matchedProduct) {
            console.warn(`[Photos] No CAUPLAS match for: "${file.name}" (parsed: "${baseName}")`);
            setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
            return;
          }

          console.log(`[Photos] Matched file "${file.name}" -> CAUPLAS "${matchedProduct.cauplas}"`);

          // Read file as data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const productId = matchedProduct.id;
          if (!productFiles.has(productId)) {
            productFiles.set(productId, {
              product: matchedProduct,
              dataUrls: [], // Start fresh — don't keep old images
            });
          }

          const entry = productFiles.get(productId)!;
          if (entry.dataUrls.length < 3) {
            entry.dataUrls.push(dataUrl);
          }
          
          setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }));
      }

      // Update each matched product — directly in localDb for instant visibility
      let updatedCount = 0;
      const { localDb } = await import("@/core/database/localDb");
      const { useInventoryStore } = await import("./useInventoryStore");

      // OPTIMIZACIÓN: Actualizar productos en paralelo
      const updatePromises = Array.from(productFiles.entries()).map(async ([, { product, dataUrls }]) => {
        const finalImages = dataUrls.slice(0, 3);

        // 1. Update localDb directly (IndexedDB) for immediate persistence
        try {
          await localDb.products.update(product.id, {
            images: finalImages,
          } as any);
          console.log(`[Photos] localDb updated for ${product.cauplas}: ${finalImages.length} images`);
        } catch (dbErr) {
          console.error(`[Photos] localDb update failed for ${product.cauplas}:`, dbErr);
          return false;
        }

        // 2. Update zustand store in memory
        useInventoryStore.setState(state => ({
          products: state.products.map(p =>
            p.id === product.id ? { ...p, images: finalImages } : p
          ),
        }));

        return true;
      });

      const results = await Promise.all(updatePromises);
      updatedCount = results.filter(Boolean).length;

      if (updatedCount > 0) {
        toast.success(`✅ ${files.length} foto${files.length !== 1 ? 's' : ''} subida${files.length !== 1 ? 's' : ''} a ${updatedCount} producto${updatedCount !== 1 ? 's' : ''}`);
        addNotification({
          module: "Inventario",
          type: "success",
          title: "✅ Fotos Subidas Exitosamente",
          message: `Se subieron ${files.length} foto${files.length !== 1 ? 's' : ''} en ${updatedCount} producto${updatedCount !== 1 ? 's' : ''}.`,
        });
      } else {
        toast.warning('No se encontraron coincidencias. El nombre del archivo debe coincidir con el código CAUPLAS del producto.');
      }
    } catch (err) {
      console.error('[Photos] Error processing photos:', err);
      toast.error('Error al procesar las fotos.');
    } finally {
      setIsPhotoImporting(false);
      setImportProgress({ current: 0, total: 0, isActive: false, type: "" });
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    // Export logic
  };

  return {
    products,
    isLoading: invLoading,
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
    totalInventoryValue,
    lowStockCount: products.filter(p => p.stock <= p.minStock).length,
    brandChartData,
    fuelChartData,
    vehicleBrandChartData,
    inventoryChartData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
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
    isImporting,
    fileInputRef,
    photoInputRef,
    folderInputRef,
    handleSort,
    handleImport,
    handleExport,
    handleClear,
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
    addProduct,
    updateProduct,
    deleteProduct,
    forecasts,
    suggestedPurchases,
    auditLogs,
    activeTenantId,
    tableHeaders,
    importProgress,
  };
};
