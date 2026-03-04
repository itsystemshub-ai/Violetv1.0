import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import { useSales } from "@/features/sales/hooks/useSales";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAddressSearch } from "@/shared/hooks/useAddressSearch";
import { Product, formatCurrency, formatDate as formatDateUtil } from "@/lib";
import { localDb } from "@/core/database/localDb";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { notifyOrderWhatsApp } from "@/infrastructure/whatsapp/whatsapp.service";
import { sendInvoiceEmail } from "@/infrastructure/email/email.service";
import { NetworkService } from "@/services/LocalNetworkService";
import { generatePDFReport } from "@/infrastructure/pdf/pdf-utils";
import { sendBroadcastNotification } from "@/shared/hooks/useBroadcastNotifications";
import { cuentasPorCobrarService } from "@/services/microservices/tesoreria/CuentasPorCobrarService";
import { libroVentasService } from "@/services/microservices/contabilidad/LibroVentasService";

export const useSalesLogic = () => {
  const { user } = useAuth();
  const { products, fetchProducts } = useInventory();
  const { invoices, isProcessing, processSale, fetchInvoices, deleteInvoice } = useSales();
  const { activeTenantId, taxes, exchangeRate, tenant } = useSystemConfig();

  const isMaster = user?.isSuperAdmin;
  const canManageSales =
    isMaster ||
    user?.department === "Ventas" ||
    user?.department === "Administración / IT" ||
    user?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQueryPOS, setSearchQueryPOS] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [posCart, setPosCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Paginación para POS
  const [currentPagePOS, setCurrentPagePOS] = useState(1);
  const itemsPerPagePOS = 200;
  
  // Paginación para Facturas
  const [currentPageInvoices, setCurrentPageInvoices] = useState(1);
  const itemsPerPageInvoices = 200;

  // Cliente / Documento Info
  const [customerName, setCustomerName] = useState("");
  const [customerRif, setCustomerRif] = useState("");
  const [customerEmpresa, setCustomerEmpresa] = useState("");
  const [customerContacto, setCustomerContacto] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDireccion, setCustomerDireccion] = useState("");
  const [customerDireccionQuery, setCustomerDireccionQuery] = useState("");
  const addressResults = useAddressSearch(customerDireccionQuery);
  const [controlNumber, setControlNumber] = useState("");
  const [docType, setDocType] = useState<"venta" | "presupuesto" | "pedido" | "nota_entrega">("pedido");
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [withIva, setWithIva] = useState(true);
  const [withIgtf, setWithIgtf] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "VES">("USD"); // Moneda seleccionada
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "VES">("USD"); // Moneda de visualización en tablas
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash"); // Tipo de pago
  const [creditDays, setCreditDays] = useState(30); // Días de crédito
  const [summaryEntityType, setSummaryEntityType] = useState<"cliente" | "vendedor">("cliente");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null); // ID del pedido en edición

  // Entity Management State
  const [isEditEntityOpen, setIsEditEntityOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<"cliente" | "vendedor">("cliente");
  const [newEntity, setNewEntity] = useState({
    rif: "",
    empresa: "",
    nombre: "",
    cedula: "",
    contacto: "",
    email: "",
    direccion: "",
    estadoVzla: "Carabobo",
    estado: "Activo",
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [sellers, setSellers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchSellers = useCallback(async () => {
    if (activeTenantId) {
      const data = await localDb.sellers.where("tenant_id").equals(activeTenantId).toArray();
      setSellers(data);
    }
  }, [activeTenantId]);

  const fetchCustomers = useCallback(async () => {
    if (activeTenantId) {
      const data = await localDb.profiles.where("tenant_id").equals(activeTenantId).toArray();
      setCustomers(data);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchProducts();
    fetchInvoices();
    fetchSellers();
    fetchCustomers();
  }, [fetchProducts, fetchInvoices, fetchSellers, fetchCustomers]);

  const dashboardData = useMemo(() => {
    const totalSalesVolume = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const pendingInvoices = invoices.filter(
      (inv) => inv.status?.toLowerCase() === "pendiente" || inv.status?.toLowerCase() === "por_cobrar"
    );
    const paidInvoices = invoices.filter((inv) => inv.status?.toLowerCase() === "pagada");

    const totalSalesCount = invoices.length || 0;
    const pendingCount = pendingInvoices.length || 0;
    const lowStockCount = invoices.length ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;

    // Generate revenue chart data (last 6 months)
    const revenueChart = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
      
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === date.getMonth() && 
               invDate.getFullYear() === date.getFullYear();
      });
      
      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: monthInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
      };
    });

    return {
      sales: {
        totalSalesVolume,
        totalSalesCount,
        pendingCount,
      },
      inventory: {
        lowStockCount,
      },
      revenueChart,
    };
  }, [invoices]);

  const handleEditEntityStart = (entity: any, type: "cliente" | "vendedor") => {
    setEntityType(type);
    setEditingEntityId(entity.id);
    setNewEntity({
      rif: entity.rif || "",
      empresa: entity.empresa || "",
      nombre: type === "cliente" ? entity.username : entity.name,
      cedula: entity.cedula || "",
      contacto: entity.contacto || "",
      email: entity.email || "",
      direccion: entity.direccion || "",
      estadoVzla: entity.estadoVzla || "Carabobo",
      estado: entity.estado || "Activo",
    });
    setIsEditEntityOpen(true);
  };

  const handleDeleteEntity = async (id: string, type: "cliente" | "vendedor") => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      if (type === "cliente") {
        await localDb.profiles.delete(id);
        fetchCustomers();
      } else {
        await localDb.sellers.delete(id);
        fetchSellers();
      }
      toast.success("Registro eliminado correctamente");
    }
  };

  const handleAddEntity = async () => {
    const baseId = editingEntityId || crypto.randomUUID();

    if (entityType === "cliente") {
      const customer = {
        id: baseId,
        tenant_id: activeTenantId,
        username: newEntity.nombre || "SIN NOMBRE",
        empresa: newEntity.empresa,
        rif: newEntity.rif,
        cedula: newEntity.cedula,
        contacto: newEntity.contacto,
        email: newEntity.email,
        direccion: newEntity.direccion,
        estadoVzla: newEntity.estadoVzla,
        estado: newEntity.estado,
        loyalty_points: 0,
        created_at: new Date().toISOString(),
      };
      await localDb.profiles.put(customer);
      fetchCustomers();
    } else {
      const seller = {
        id: baseId,
        tenant_id: activeTenantId,
        name: newEntity.nombre || "SIN NOMBRE",
        cedula: newEntity.cedula,
        contacto: newEntity.contacto,
        email: newEntity.email,
        direccion: newEntity.direccion,
        estadoVzla: newEntity.estadoVzla,
        estado: newEntity.estado,
        created_at: new Date().toISOString(),
      };
      await localDb.sellers.put(seller);
      fetchSellers();
    }

    setIsEditEntityOpen(false);
    setEditingEntityId(null);
    setNewEntity({
      rif: "",
      empresa: "",
      nombre: "",
      cedula: "",
      contacto: "",
      email: "",
      direccion: "",
      estadoVzla: "Carabobo",
      estado: "Activo",
    });
    toast.success(
      `${entityType === "cliente" ? "Cliente" : "Vendedor"} ${editingEntityId ? "actualizado" : "añadido"} correctamente.`
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportOrder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as any[];

        let addedCount = 0;
        let notFoundCount = 0;
        const newCartItems: { product: Product; quantity: number }[] = [];

        jsonData.forEach((row) => {
          const cauplasCode = (row.CAUPLAS || row.Cauplas || row.cauplas || "").toString().trim();
          const rawQty = (row.CANTIDAD || row.Cantidad || row.cantidad || "").toString().trim();

          if (!cauplasCode || !rawQty || rawQty === "0" || rawQty === "-" || rawQty.startsWith("-")) return;

          const quantity = parseInt(rawQty);
          if (isNaN(quantity) || quantity <= 0) return;

          const product = products.find((p) => p.cauplas?.toLowerCase() === cauplasCode.toLowerCase());

          if (product) {
            newCartItems.push({ product, quantity });
            addedCount++;
          } else {
            notFoundCount++;
          }
        });

        if (newCartItems.length > 0) {
          setPosCart((prev) => {
            const updated = [...prev];
            newCartItems.forEach((newItem) => {
              const existing = updated.find((item) => item.product.id === newItem.product.id);
              if (existing) {
                existing.quantity += newItem.quantity;
              } else {
                updated.push(newItem);
              }
            });
            return updated;
          });
          toast.success(`Se importaron ${addedCount} productos al carrito.`);
        }

        if (notFoundCount > 0) {
          toast.warning(`${notFoundCount} códigos CAUPLAS no fueron encontrados.`);
        }
      } catch (err) {
        toast.error("Error al procesar el archivo Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = "";
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Paginación de facturas
  const totalPagesInvoices = Math.ceil(filteredInvoices.length / itemsPerPageInvoices);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPageInvoices - 1) * itemsPerPageInvoices;
    const endIndex = startIndex + itemsPerPageInvoices;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPageInvoices, itemsPerPageInvoices]);
  
  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPageInvoices(1);
  }, [searchTerm]);

  const filteredPOSProducts = products.filter(
    (p) =>
      p.cauplas?.toLowerCase().includes(searchQueryPOS.toLowerCase()) ||
      p.torflex?.toLowerCase().includes(searchQueryPOS.toLowerCase()) ||
      p.indomax?.toLowerCase().includes(searchQueryPOS.toLowerCase()) ||
      p.descripcionManguera?.toLowerCase().includes(searchQueryPOS.toLowerCase()) ||
      p.aplicacion?.toLowerCase().includes(searchQueryPOS.toLowerCase())
  );
  
  // Paginación de productos POS
  const totalPagesPOS = Math.ceil(filteredPOSProducts.length / itemsPerPagePOS);
  const paginatedPOSProducts = useMemo(() => {
    const startIndex = (currentPagePOS - 1) * itemsPerPagePOS;
    const endIndex = startIndex + itemsPerPagePOS;
    return filteredPOSProducts.slice(startIndex, endIndex);
  }, [filteredPOSProducts, currentPagePOS, itemsPerPagePOS]);
  
  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPagePOS(1);
  }, [searchQueryPOS]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    toast.success(`${quantity}x ${product.cauplas || product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setPosCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setPosCart([]);
    setEditingOrderId(null); // Limpiar el ID de edición al vaciar el carrito
    toast.info("Carrito vaciado");
  };

  const clearAll = () => {
    setPosCart([]);
    setCustomerName("");
    setCustomerRif("");
    setCustomerEmpresa("");
    setCustomerContacto("");
    setCustomerEmail("");
    setCustomerDireccion("");
    setCustomerDireccionQuery("");
    setControlNumber("");
    setSelectedSellerId("");
    setDocType("pedido");
    setEditingOrderId(null);
    toast.info("Carrito y datos del cliente limpiados");
  };

  const cartSubtotal = posCart.reduce(
    (sum, item) => sum + (item.product.precioFCA || item.product.price) * item.quantity,
    0
  );

  const cartIva = withIva ? (cartSubtotal * (taxes?.iva_general || 16)) / 100 : 0;
  const cartIgtf = withIgtf ? (cartSubtotal * (taxes?.igtf_divisas || 3)) / 100 : 0;
  const cartTotal = cartSubtotal + cartIva + cartIgtf;

  const handleProcessSale = async () => {
    if (!customerName) {
      toast.error("Por favor ingresa el nombre del cliente");
      return;
    }

    // Si estamos editando un pedido existente, actualizarlo en lugar de crear uno nuevo
    if (editingOrderId) {
      try {
        const items = posCart.map(item => ({
          product_id: item.product.id,
          name: item.product.cauplas || item.product.name,
          quantity: item.quantity,
          price: item.product.precioFCA || item.product.price,
          tax: 0
        }));

        // Obtener el pedido original para conservar su número
        const originalOrder = await localDb.invoices.get(editingOrderId);
        const orderNumber = originalOrder?.number || controlNumber;

        // Actualizar el pedido existente
        await localDb.invoices.update(editingOrderId, {
          number: orderNumber, // Mantener el número original
          customer_name: customerName,
          customer_rif: customerRif,
          customer_empresa: customerEmpresa,
          customer_contacto: customerContacto,
          customer_email: customerEmail,
          customer_direccion: customerDireccion,
          seller_id: selectedSellerId,
          subtotal: cartSubtotal,
          tax_total: cartIva,
          tax_igtf: cartIgtf,
          total: cartTotal,
          items,
          status: "pendiente", // Volver a pendiente al editar
          exchange_rate_used: exchangeRate,
          total_ves: cartTotal * exchangeRate,
          metadata: {
            type: "pedido",
            controlNumber: orderNumber,
            exchangeRateUsed: exchangeRate,
            totalVES: cartTotal * exchangeRate,
            empresa: customerEmpresa,
            contacto: customerContacto,
            email: customerEmail,
            direccion: customerDireccion,
            withIva,
            withIgtf,
            currency, // Guardar la moneda seleccionada
            entityType: customers.find((c) => c.username === customerName)
              ? "Cliente"
              : sellers.find((s) => s.name === customerName)
                ? "Vendedor"
                : "Cliente",
          },
          updated_at: new Date().toISOString()
        });

        // Eliminar cualquier pedido duplicado con el mismo número
        if (orderNumber) {
          const duplicates = await localDb.invoices
            .where("number")
            .equals(orderNumber)
            .and(inv => inv.id !== editingOrderId)
            .toArray();
          
          if (duplicates.length > 0) {
            for (const dup of duplicates) {
              await localDb.invoices.delete(dup.id);
            }
            toast.success(`Pedido actualizado correctamente. Se eliminaron ${duplicates.length} duplicado(s).`);
          } else {
            toast.success("Pedido actualizado correctamente");
          }
        } else {
          toast.success("Pedido actualizado correctamente");
        }
        
        // Solo limpiar el carrito, mantener los datos del cliente
        setPosCart([]);
        setEditingOrderId(null); // Limpiar el ID de edición
        fetchProducts();
        fetchInvoices();

        return;
      } catch (error) {
        toast.error("Error al actualizar el pedido");
        console.error(error);
        return;
      }
    }

    // Si no estamos editando, crear un nuevo pedido
    const result = await processSale(
      customerName,
      customerRif,
      posCart,
      cartSubtotal,
      cartIva,
      cartIgtf,
      cartTotal,
      {
        type: "pedido",
        controlNumber,
        exchangeRateUsed: exchangeRate,
        totalVES: cartTotal * exchangeRate,
        empresa: customerEmpresa,
        contacto: customerContacto,
        email: customerEmail,
        direccion: customerDireccion,
        withIva,
        withIgtf,
        currency, // Guardar la moneda seleccionada
        paymentType, // Guardar tipo de pago
        creditDays: paymentType === 'credit' ? creditDays : undefined,
        entityType: customers.find((c) => c.username === customerName)
          ? "Cliente"
          : sellers.find((s) => s.name === customerName)
            ? "Vendedor"
            : "Cliente",
      },
      selectedSellerId
    );

    if (result.success) {
      // Enviar notificación broadcast a todos los usuarios
      sendBroadcastNotification({
        type: 'new_order',
        title: 'Nuevo Pedido Generado',
        message: `Se ha generado el pedido ${controlNumber || result.invoiceId} para ${customerEmpresa || customerName}`,
        tenantId: activeTenantId || undefined,
        data: {
          orderId: result.invoiceId,
          orderNumber: controlNumber || result.invoiceId,
          customerName: customerEmpresa || customerName,
          total: cartTotal,
          currency: currency,
        }
      });

      // Solo limpiar el carrito, mantener los datos del cliente
      setPosCart([]);
      setEditingOrderId(null); // Limpiar el ID de edición
      fetchProducts();
      fetchInvoices();

      // Notifications
      if (customerContacto) {
        notifyOrderWhatsApp(
          customerContacto,
          controlNumber || result.invoiceId || "PED-" + Date.now(),
          cartTotal,
          "USD"
        ).catch(() => {});
      }

      if (customerEmail) {
        sendInvoiceEmail({
          to: customerEmail,
          customerName,
          invoiceNumber: controlNumber || result.invoiceId || "PED-" + Date.now(),
          items: posCart.map((i) => ({
            name: i.product.descripcionManguera || i.product.name,
            quantity: i.quantity,
            unitPrice: i.product.precioFCA || i.product.price,
          })),
          subtotal: cartSubtotal,
          iva: cartIva,
          igtf: cartIgtf,
          total: cartTotal,
          tenantName: tenant?.name || "Cauplas ERP",
        }).catch(() => {});
      }
    }
  };

  const handleEditOrder = useCallback(
    async (order: any) => {
      const cartItems = order.items.map((item: any) => {
        const product = products.find((p) => p.id === item.product_id);
        return {
          product: product || {
            id: item.product_id,
            name: item.name,
            price: item.price,
            cauplas: item.name,
          },
          quantity: item.quantity,
        };
      });

      setPosCart(cartItems);
      setCustomerName(order.customerName || order.customer_name);
      setCustomerRif(order.customerRif || order.customer_rif || "");
      setCustomerEmpresa(order.customer_empresa || order.metadata?.empresa || "");
      setCustomerContacto(order.customer_contacto || order.metadata?.contacto || "");
      setCustomerEmail(order.customer_email || order.metadata?.email || "");
      setCustomerDireccion(order.customer_direccion || order.metadata?.direccion || "");
      setControlNumber(order.number);
      setDocType("pedido");
      setEditingOrderId(order.id); // Guardar el ID del pedido en edición
      
      // Si el pedido está aprobado, cambiar su estatus a pendiente
      if (order.status?.toLowerCase() === "aprobado" || order.status?.toLowerCase() === "aprobada") {
        try {
          await localDb.invoices.update(order.id, { status: "pendiente" });
          toast.info("Pedido cargado en el carrito para edición. Estatus cambiado a Pendiente.");
          fetchInvoices(); // Refrescar la lista de facturas
        } catch (error) {
          toast.error("Error al actualizar el estatus del pedido");
        }
      } else {
        toast.info("Pedido cargado en el carrito para edición.");
      }
    },
    [products, fetchInvoices]
  );

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.")) {
      try {
        await deleteInvoice(orderId);
        toast.success("Pedido eliminado correctamente");
        fetchInvoices();
      } catch (error) {
        toast.error("Error al eliminar el pedido");
        console.error(error);
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm("¿Estás seguro de que deseas anular este pedido? El pedido quedará registrado como anulado.")) {
      try {
        await localDb.invoices.update(orderId, {
          status: "anulado",
          updated_at: new Date().toISOString()
        });
        toast.success("Pedido anulado correctamente");
        fetchInvoices();
      } catch (error) {
        toast.error("Error al anular el pedido");
        console.error(error);
      }
    }
  };

  const cleanDuplicateOrders = async () => {
    try {
      const allOrders = await localDb.invoices
        .where('tenant_id')
        .equals(activeTenantId || '')
        .and(inv => inv.type === 'pedido')
        .toArray();
      
      // Agrupar por número de pedido
      const ordersByNumber = allOrders.reduce((acc, order) => {
        if (!acc[order.number]) {
          acc[order.number] = [];
        }
        acc[order.number].push(order);
        return acc;
      }, {} as Record<string, any[]>);
      
      let duplicatesRemoved = 0;
      
      // Para cada grupo de pedidos con el mismo número
      for (const [number, orders] of Object.entries(ordersByNumber)) {
        if (orders.length > 1) {
          // Ordenar por fecha de actualización (más reciente primero)
          orders.sort((a, b) => {
            const dateA = new Date(a.updated_at || a.date).getTime();
            const dateB = new Date(b.updated_at || b.date).getTime();
            return dateB - dateA;
          });
          
          // Mantener solo el más reciente, eliminar los demás
          const [keep, ...remove] = orders;
          for (const dup of remove) {
            await localDb.invoices.delete(dup.id);
            duplicatesRemoved++;
          }
        }
      }
      
      if (duplicatesRemoved > 0) {
        toast.success(`Se eliminaron ${duplicatesRemoved} pedido(s) duplicado(s)`);
        fetchInvoices();
      } else {
        toast.info("No se encontraron pedidos duplicados");
      }
    } catch (error) {
      toast.error("Error al limpiar duplicados");
      console.error(error);
    }
  };

  const handleConvertDocument = async (source: any, targetType: string) => {
    try {
      // Si estamos aprobando un pedido (convirtiendo a venta), generar número de factura secuencial
      if (targetType === "venta") {
        // VALIDAR Y DESCONTAR STOCK antes de aprobar
        if (source.items && source.items.length > 0) {
          // Validar stock disponible
          const stockErrors: string[] = [];
          for (const item of source.items) {
            const product = await localDb.products.get(item.product_id);
            if (!product) {
              stockErrors.push(`Producto ${item.name} no encontrado`);
              continue;
            }
            if (product.stock < item.quantity) {
              stockErrors.push(
                `${item.name}: Stock insuficiente (Disponible: ${product.stock}, Solicitado: ${item.quantity})`
              );
            }
          }

          // Si hay errores de stock, mostrarlos y cancelar
          if (stockErrors.length > 0) {
            toast.error(`No se puede aprobar el pedido:\n${stockErrors.join('\n')}`, { 
              duration: 10000 
            });
            return;
          }

          // Descontar stock
          for (const item of source.items) {
            const product = await localDb.products.get(item.product_id);
            if (!product) continue;

            const newStock = product.stock - item.quantity;
            
            await localDb.products.update(item.product_id, {
              stock: newStock,
              updated_at: new Date().toISOString(),
              is_dirty: 1
            });

            // Registrar movimiento de inventario
            await localDb.inventory_movements.add({
              id: crypto.randomUUID(),
              product_id: item.product_id,
              product_name: item.name,
              quantity: -item.quantity,
              type: 'sale',
              reference_id: source.id,
              reference_type: 'invoice',
              previous_stock: product.stock,
              new_stock: newStock,
              tenant_id: activeTenantId || '',
              created_at: new Date().toISOString()
            });

            // Verificar punto de reorden
            if (newStock <= product.minStock) {
              await localDb.notifications.add({
                id: crypto.randomUUID(),
                type: 'low_stock',
                title: 'Stock Bajo - Punto de Reorden',
                message: `${product.name} (${product.cauplas || product.id}): Stock actual ${newStock}, mínimo ${product.minStock}`,
                timestamp: new Date().toISOString(),
                tenantId: activeTenantId || '',
                read: false,
                data: {
                  productId: product.id,
                  productName: product.name,
                  currentStock: newStock,
                  minStock: product.minStock,
                  reorderQuantity: product.minStock * 2
                }
              });

              if (newStock < product.minStock * 0.5) {
                toast.error(
                  `⚠️ STOCK CRÍTICO: ${product.name} - Solo quedan ${newStock} unidades`,
                  { duration: 10000 }
                );
              } else {
                toast.warning(
                  `📦 Stock bajo: ${product.name} - ${newStock} unidades disponibles`,
                  { duration: 7000 }
                );
              }
            }
          }
        }

        // Obtener el siguiente número de factura
        const existingInvoices = await localDb.invoices
          .where('tenant_id')
          .equals(activeTenantId || '')
          .and(inv => inv.type === 'venta' && inv.number.startsWith('FACT-'))
          .toArray();
        
        const maxInvoiceNumber = existingInvoices.reduce((max, inv) => {
          const match = inv.number.match(/FACT-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        
        const invoiceNumber = `FACT-${String(maxInvoiceNumber + 1).padStart(5, '0')}`;
        
        // Actualizar el pedido: cambiar tipo a venta, asignar número de factura y marcar como procesado
        await localDb.invoices.update(source.id, {
          type: 'venta',
          number: invoiceNumber,
          status: 'procesado',
          payment_type: source.metadata?.paymentType || 'cash',
          payment_status: source.metadata?.paymentType === 'cash' ? 'paid' : 'pending',
          updated_at: new Date().toISOString()
        });

        // Crear cuenta por cobrar
        const dueDate = source.metadata?.paymentType === 'credit' && source.metadata?.creditDays
          ? new Date(Date.now() + source.metadata.creditDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        await cuentasPorCobrarService.createAccountReceivable(
          source.id,
          invoiceNumber,
          source.customerName || source.customer_name,
          source.customerRif || source.customer_rif || '',
          source.customer_empresa || source.metadata?.empresa,
          source.total,
          source.metadata?.currency || 'USD',
          source.metadata?.paymentType || 'cash',
          activeTenantId || '',
          source.metadata?.exchangeRateUsed || source.exchange_rate_used,
          dueDate
        );

        // Registrar en Libro de Ventas SENIAT
        const baseImponible = source.subtotal || 0;
        const ivaMonto = source.tax_total || 0;
        const igtfMonto = source.tax_igtf || 0;
        const ivaPorcentaje = source.metadata?.withIva ? (taxes?.iva_general || 16) : 0;

        await libroVentasService.registrarFactura(
          source.id,
          invoiceNumber,
          source.number, // Número de control (número del pedido original)
          new Date().toISOString(),
          source.customerRif || source.customer_rif || '',
          source.customer_empresa || source.customerName || source.customer_name,
          baseImponible,
          ivaPorcentaje,
          ivaMonto,
          igtfMonto,
          source.total,
          source.metadata?.paymentType || 'cash',
          activeTenantId || ''
        );
        
        // Enviar notificación broadcast a todos los usuarios
        sendBroadcastNotification({
          type: 'new_invoice',
          title: 'Nueva Factura Generada',
          message: `Se ha generado la factura ${invoiceNumber} desde el pedido ${source.number}`,
          tenantId: activeTenantId || undefined,
          data: {
            invoiceId: source.id,
            invoiceNumber: invoiceNumber,
            orderNumber: source.number,
            customerName: source.customer_empresa || source.customerName,
            total: source.total,
            currency: source.metadata?.currency || 'USD',
          }
        });
        
        toast.success(`Pedido aprobado y convertido a factura ${invoiceNumber}`);
        fetchInvoices();
        fetchProducts();
        return;
      }
      
      // Para otros tipos de conversión, usar el API del servidor
      const response = await fetch(`${NetworkService.getServerUrl()}/api/transactions/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: source.id,
          targetType,
          tenantId: user?.tenantId,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Convertido a ${targetType} exitosamente`);
      fetchInvoices();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Error al convertir documento");
    }
  };

  const handleExportReport = (reportType: "pedido" | "venta") => {
    const reportData = invoices.filter((inv) => inv.type === reportType);

    generatePDFReport({
      title: `Reporte de ${reportType === "pedido" ? "Pedidos" : "Facturación"}`,
      subtitle: `Historial de ${reportType === "pedido" ? "Órdenes de Compra" : "Ventas"}`,
      filename: `${reportType}_${new Date().toISOString().split("T")[0]}.pdf`,
      columns: [
        { header: "Nro Doc", dataKey: "number" },
        { header: "Entidad", dataKey: "entity" },
        { header: "RIF", dataKey: "rif" },
        { header: "Cliente", dataKey: "customer" },
        { header: "Fecha", dataKey: "date" },
        { header: "Estatus", dataKey: "status" },
        { header: "Total", dataKey: "total" },
      ],
      data: reportData.map((inv) => ({
        number: inv.number,
        entity: inv.metadata?.entityType || "Cliente",
        rif: inv.customerRif || "---",
        customer: inv.customerName,
        date: formatDateUtil(inv.date),
        status: inv.status.toUpperCase(),
        total: formatCurrency(inv.total, "USD"),
      })),
    });
    toast.success("Reporte generado exitosamente");
    setIsReportModalOpen(false);
  };

  return {
    user,
    products,
    invoices,
    isProcessing,
    canManageSales,
    searchTerm,
    setSearchTerm,
    searchQueryPOS,
    setSearchQueryPOS,
    viewMode,
    setViewMode,
    posCart,
    setPosCart,
    customerName,
    setCustomerName,
    customerRif,
    setCustomerRif,
    customerEmpresa,
    setCustomerEmpresa,
    customerContacto,
    setCustomerContacto,
    customerEmail,
    setCustomerEmail,
    customerDireccion,
    setCustomerDireccion,
    customerDireccionQuery,
    setCustomerDireccionQuery,
    addressResults,
    controlNumber,
    setControlNumber,
    docType,
    setDocType,
    selectedSellerId,
    setSelectedSellerId,
    withIva,
    setWithIva,
    withIgtf,
    setWithIgtf,
    currency,
    setCurrency,
    displayCurrency,
    setDisplayCurrency,
    paymentType,
    setPaymentType,
    creditDays,
    setCreditDays,
    summaryEntityType,
    setSummaryEntityType,
    isEditEntityOpen,
    setIsEditEntityOpen,
    editingEntityId,
    entityType,
    newEntity,
    setNewEntity,
    sellers,
    customers,
    dashboardData,
    handleEditEntityStart,
    handleDeleteEntity,
    handleAddEntity,
    handleImportOrder,
    filteredInvoices,
    paginatedInvoices,
    filteredPOSProducts,
    paginatedPOSProducts,
    addToCart,
    removeFromCart,
    clearCart,
    clearAll,
    cartSubtotal,
    cartIva,
    cartIgtf,
    cartTotal,
    handleProcessSale,
    handleEditOrder,
    handleDeleteOrder,
    handleCancelOrder,
    cleanDuplicateOrders,
    handleConvertDocument,
    fileInputRef,
    exchangeRate,
    taxes,
    tenant,
    isReportModalOpen,
    setIsReportModalOpen,
    handleExportReport,
    
    // Paginación POS
    currentPagePOS,
    setCurrentPagePOS,
    totalPagesPOS,
    itemsPerPagePOS,
    
    // Paginación Facturas
    currentPageInvoices,
    setCurrentPageInvoices,
    totalPagesInvoices,
    itemsPerPageInvoices,
  };
};
