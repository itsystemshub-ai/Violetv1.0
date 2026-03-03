import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Users,
  Search,
  ChevronDown,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product, formatCurrency } from "@/lib/index";

interface SalesCartProps {
  summaryEntityType: "cliente" | "vendedor";
  setSummaryEntityType: (val: "cliente" | "vendedor") => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customers: any[];
  sellers: any[];
  selectedSellerId: string;
  setSelectedSellerId: (val: string) => void;
  customerRif: string;
  setCustomerRif: (val: string) => void;
  customerEmpresa: string;
  setCustomerEmpresa: (val: string) => void;
  customerContacto: string;
  setCustomerContacto: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  controlNumber: string;
  setControlNumber: (val: string) => void;
  customerDireccion: string;
  setCustomerDireccion: (val: string) => void;
  customerDireccionQuery: string;
  setCustomerDireccionQuery: (val: string) => void;
  addressResults: any[];
  withIva: boolean;
  setWithIva: (val: boolean) => void;
  currency: "USD" | "VES";
  setCurrency: (val: "USD" | "VES") => void;
  displayCurrency: "USD" | "VES";
  setDisplayCurrency: (val: "USD" | "VES") => void;
  paymentType: "cash" | "credit";
  setPaymentType: (val: "cash" | "credit") => void;
  creditDays: number;
  setCreditDays: (val: number) => void;
  exchangeRate: number;
  posCart: { product: Product; quantity: number }[];
  setPosCart: React.Dispatch<
    React.SetStateAction<{ product: Product; quantity: number }[]>
  >;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartIva: number;
  cartTotal: number;
  isProcessing: boolean;
  handleProcessSale: () => void;
}

export const SalesCart = ({
  summaryEntityType,
  setSummaryEntityType,
  customerName,
  setCustomerName,
  customers,
  sellers,
  selectedSellerId,
  setSelectedSellerId,
  customerRif,
  setCustomerRif,
  customerEmpresa,
  setCustomerEmpresa,
  customerContacto,
  setCustomerContacto,
  customerEmail,
  setCustomerEmail,
  controlNumber,
  setControlNumber,
  customerDireccion,
  setCustomerDireccion,
  customerDireccionQuery,
  setCustomerDireccionQuery,
  addressResults,
  withIva,
  setWithIva,
  currency,
  setCurrency,
  displayCurrency,
  setDisplayCurrency,
  paymentType,
  setPaymentType,
  creditDays,
  setCreditDays,
  exchangeRate,
  posCart,
  setPosCart,
  removeFromCart,
  clearCart,
  cartSubtotal,
  cartIva,
  cartTotal,
  isProcessing,
  handleProcessSale,
}: SalesCartProps) => {
  return (
    <div className="space-y-4 pt-0">
      <Card className="border shadow-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:via-[#1f2937] dark:to-slate-900 text-foreground dark:text-white rounded-4xl overflow-hidden relative ring-1 ring-border/20 dark:ring-white/10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <CardContent className="p-6 space-y-6 relative z-10">
          <div className="space-y-6">
            {/* Row 1: Entity Config */}
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-border/30 dark:border-white/10">
              <div className="space-y-2 w-full md:w-64">
                <Label className="text-[10px] font-black uppercase text-muted-foreground dark:text-white/50 flex items-center gap-2 ml-1 tracking-widest">
                  <Users className="h-3 w-3" /> Tipo de Entidad
                </Label>
                <div className="flex items-center gap-1 bg-muted/60 dark:bg-black/40 p-1.5 rounded-2xl border border-border/60 dark:border-white/10 shadow-inner backdrop-blur-md">
                  <Button
                    variant="ghost"
                    onClick={() => setSummaryEntityType("cliente")}
                    className={`h-9 flex-1 text-[9px] font-black uppercase rounded-xl transition-all ${summaryEntityType === "cliente" ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground dark:text-white/60 hover:bg-muted/40 dark:hover:bg-white/10"}`}
                  >
                    Cliente
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSummaryEntityType("vendedor")}
                    className={`h-9 flex-1 text-[9px] font-black uppercase rounded-xl transition-all ${summaryEntityType === "vendedor" ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground dark:text-white/60 hover:bg-muted/40 dark:hover:bg-white/10"}`}
                  >
                    Vendedor
                  </Button>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground dark:text-white/50 flex items-center gap-2 ml-1 tracking-widest">
                  <Search className="h-3 w-3" />{" "}
                  {summaryEntityType === "cliente"
                    ? "Buscar Cliente Registrado"
                    : "Buscar Vendedor Autorizado"}
                </Label>
                <div className="relative">
                  {summaryEntityType === "cliente" ? (
                    <select
                      className="w-full h-12 bg-background/80 dark:bg-black/40 border border-border/60 dark:border-white/10 text-foreground dark:text-white rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer hover:bg-muted/40 dark:hover:bg-black/60 transition-all backdrop-blur-md shadow-inner"
                      value={customerName}
                      onChange={(e) => {
                        const c = customers.find(
                          (x) => x.username === e.target.value,
                        );
                        if (c) {
                          setCustomerName(c.username);
                          setCustomerRif(c.rif || "");
                          setCustomerEmpresa(c.empresa || "");
                          setCustomerContacto(c.contacto || "");
                          setCustomerEmail(c.email || "");
                        } else {
                          setCustomerName(e.target.value);
                        }
                      }}
                    >
                      <option value="" className="bg-background text-muted-foreground italic">
                        Elegir cliente...
                      </option>
                      {customers.map((c) => (
                        <option
                          key={c.id}
                          value={c.username}
                          className="bg-background text-foreground font-bold uppercase"
                        >
                          {c.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className="w-full h-12 bg-background/80 dark:bg-black/40 border border-border/60 dark:border-white/10 text-foreground dark:text-white rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer hover:bg-muted/40 dark:hover:bg-black/60 transition-all backdrop-blur-md shadow-inner"
                      value={selectedSellerId}
                      onChange={(e) => setSelectedSellerId(e.target.value)}
                    >
                      <option value="" className="bg-background text-muted-foreground italic">
                        Elegir vendedor...
                      </option>
                      {sellers.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          className="bg-background text-foreground font-bold uppercase"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 dark:text-white/40">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  RIF / CI
                </Label>
                <Input
                  value={customerRif}
                  onChange={(e) => setCustomerRif(e.target.value)}
                  className="h-11 bg-muted/40 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/20 text-xs font-bold rounded-2xl shadow-inner px-4"
                  placeholder="J-00000000-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  Empresa
                </Label>
                <Input
                  value={customerEmpresa}
                  onChange={(e) => setCustomerEmpresa(e.target.value)}
                  className="h-11 bg-muted/40 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/20 text-xs font-bold rounded-2xl shadow-inner px-4"
                  placeholder="Razón Social..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  Teléfono
                </Label>
                <Input
                  value={customerContacto}
                  onChange={(e) => setCustomerContacto(e.target.value)}
                  className="h-11 bg-muted/40 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/20 text-xs font-bold rounded-2xl shadow-inner px-4"
                  placeholder="Ej: 0414-0000000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  Correo
                </Label>
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="h-11 bg-muted/40 dark:bg-white/5 border border-border/60 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/20 text-xs font-bold rounded-2xl shadow-inner px-4"
                  placeholder="facturacion@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  Control #
                </Label>
                <Input
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  className="h-11 bg-muted/60 dark:bg-black/30 border border-border/60 dark:border-white/10 text-foreground dark:text-white text-xs font-black rounded-2xl text-center tracking-widest"
                  placeholder="AUTO"
                />
              </div>
            </div>

            {/* Row 3: Address & Action */}
            <div className="flex flex-wrap items-end gap-4 bg-muted/30 dark:bg-white/5 p-4 rounded-3xl border border-border/40 dark:border-white/5">
              <div className="flex-1 min-w-[300px] space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 ml-1 tracking-widest">
                  Dirección de Entrega Fiscal
                </Label>
                <div className="relative">
                  <Input
                    value={customerDireccion || customerDireccionQuery}
                    onChange={(e) => {
                      setCustomerDireccion("");
                      setCustomerDireccionQuery(e.target.value);
                    }}
                    className="h-12 bg-background/80 dark:bg-black/30 border border-border/60 dark:border-white/10 text-foreground dark:text-white text-xs font-bold rounded-2xl shadow-inner px-5"
                    placeholder="Buscar dirección (ej: Valencia, Carabobo)..."
                  />
                  {addressResults.length > 0 && !customerDireccion && (
                    <div className="absolute top-14 left-0 right-0 z-50 bg-card dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      {addressResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCustomerDireccion(r.display_name);
                            setCustomerDireccionQuery(r.display_name);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[10px] text-foreground/80 dark:text-white/80 hover:bg-muted/40 dark:hover:bg-white/10 border-b border-border/30 dark:border-white/5 last:border-0 transition-colors"
                        >
                          📍 {r.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Selector de Moneda */}
                <div className="flex bg-muted/60 dark:bg-black/40 rounded-2xl p-1.5 border border-border/60 dark:border-white/10 shadow-inner">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrency("USD")}
                    className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${currency === "USD" ? "bg-emerald-500 text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                  >
                    $
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrency("VES")}
                    className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${currency === "VES" ? "bg-emerald-500 text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                  >
                    Bs
                  </Button>
                </div>

                {/* Selector de IVA */}
                <div className="flex bg-muted/60 dark:bg-black/40 rounded-2xl p-1.5 border border-border/60 dark:border-white/10 shadow-inner">
                  <Button
                    variant="ghost"
                    onClick={() => setWithIva(true)}
                    className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${withIva ? "bg-primary text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                  >
                    CON IVA
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setWithIva(false)}
                    className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${!withIva ? "bg-rose-500 text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                  >
                    SIN IVA
                  </Button>
                </div>

                {/* Selector de Tipo de Pago */}
                <div className="flex flex-col gap-2">
                  <div className="flex bg-muted/60 dark:bg-black/40 rounded-2xl p-1.5 border border-border/60 dark:border-white/10 shadow-inner">
                    <Button
                      variant="ghost"
                      onClick={() => setPaymentType("cash")}
                      className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${paymentType === "cash" ? "bg-emerald-500 text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                    >
                      💵 CONTADO
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setPaymentType("credit")}
                      className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider ${paymentType === "credit" ? "bg-amber-500 text-white" : "text-muted-foreground/60 dark:text-white/40"}`}
                    >
                      📅 CRÉDITO
                    </Button>
                  </div>
                  {paymentType === "credit" && (
                    <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-amber-500/30 dark:border-amber-500/20">
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                        Días:
                      </span>
                      <Input
                        type="number"
                        value={creditDays}
                        onChange={(e) => setCreditDays(parseInt(e.target.value) || 30)}
                        className="w-16 h-7 bg-background/80 dark:bg-black/40 border-amber-500/40 dark:border-amber-500/30 text-foreground dark:text-white text-xs font-bold text-center"
                        min="1"
                        max="365"
                      />
                    </div>
                  )}
                </div>

                <Button
                  className="h-12 px-10 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-xl rounded-2xl font-black uppercase italic tracking-widest gap-3 text-sm active:scale-95 transition-all border border-emerald-400/50"
                  onClick={handleProcessSale}
                  disabled={posCart.length === 0 || isProcessing}
                >
                  <Calculator className="h-5 w-5" />
                  Procesar Operación
                </Button>
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6 pt-4 border-t border-border/30 dark:border-white/10">
            <div className="flex items-center gap-3 text-muted-foreground dark:text-white/50 bg-amber-500/10 dark:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-amber-500/30 dark:border-white/5">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-[10px] font-bold tracking-widest">
                Precios en $ sujetos a TRM actual.
              </span>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 block tracking-widest mb-1">
                  Subtotal
                </span>
                <span className="text-sm font-black italic tracking-tighter text-foreground dark:text-white">
                  {displayCurrency === "USD"
                    ? formatCurrency(cartSubtotal, "USD")
                    : formatCurrency(cartSubtotal * exchangeRate, "VES")
                  }
                </span>
              </div>
              {withIva && (
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-muted-foreground/70 dark:text-white/40 block tracking-widest mb-1">
                    IVA
                  </span>
                  <span className="text-sm font-black italic tracking-tighter text-foreground dark:text-white">
                    {displayCurrency === "USD"
                      ? formatCurrency(cartIva, "USD")
                      : formatCurrency(cartIva * exchangeRate, "VES")
                    }
                  </span>
                </div>
              )}
              <div className="bg-primary/20 dark:bg-primary/20 px-6 py-3 rounded-2xl border border-primary/40 dark:border-primary/30 text-right backdrop-blur-md shadow-inner">
                <span className="text-[10px] font-black uppercase text-primary dark:text-primary-400 block tracking-widest mb-1">
                  Gran Total
                </span>
                <span className="text-3xl font-black italic text-foreground dark:text-white leading-none tracking-tighter drop-shadow-lg">
                  {displayCurrency === "USD"
                    ? formatCurrency(cartTotal, "USD")
                    : formatCurrency(cartTotal * exchangeRate, "VES")
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items Table */}
      <Card className="border-none shadow-xl bg-card border border-border/40 rounded-3xl overflow-hidden">
        {/* Header con toggle de moneda */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/5">
          <div>
            <h3 className="text-sm font-black uppercase italic text-foreground tracking-wider">
              Productos en Carrito
            </h3>
            <p className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">
              Revisa y ajusta las cantidades
            </p>
          </div>
          
          {/* Toggle de Moneda para visualización */}
          <div className="flex bg-muted/30 rounded-2xl p-1.5 border border-border/40 shadow-inner">
            <Button
              variant="ghost"
              onClick={() => setDisplayCurrency("USD")}
              className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider transition-all ${displayCurrency === "USD" ? "bg-emerald-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              $
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDisplayCurrency("VES")}
              className={`h-9 px-5 text-[10px] font-black uppercase rounded-xl tracking-wider transition-all ${displayCurrency === "VES" ? "bg-emerald-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              Bs
            </Button>
          </div>
        </div>
        
        <div className="max-h-[900px] overflow-y-auto custom-scrollbar rounded-3xl bg-white">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Cauplas
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Torflex
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Indomax
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-2 h-9 text-center w-20 bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  OEM
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-4 h-9 text-left bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Descripción
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Categoría
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-right bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Precio Unit.
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Cantidad
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-right bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Total
                </th>
                <th className="text-[10px] font-black uppercase tracking-widest px-3 h-9 text-center bg-white sticky top-0 z-20 shadow-sm border-b border-border/40 text-muted-foreground font-medium">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {posCart.length === 0 ? (
                <tr>
                  <td colSpan={10} className="h-60">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="h-12 w-12 mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-black uppercase italic text-muted-foreground/40">
                        El carrito está vacío
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                posCart.map((item) => {
                  const itemTotal = (item.product.precioFCA || item.product.price || 0) * item.quantity;
                  return (
                    <tr
                      key={item.product.id}
                      className="border-b border-border/40 hover:bg-muted/10 transition-colors group"
                    >
                      <td className="font-black italic text-xs text-primary px-3 py-1.5 text-center align-middle">
                        {item.product.cauplas || "---"}
                      </td>
                      <td className="font-bold text-xs text-foreground/70 px-3 py-1.5 text-center align-middle">
                        {item.product.torflex || "---"}
                      </td>
                      <td className="font-bold text-xs text-foreground/70 px-3 py-1.5 text-center align-middle">
                        {item.product.indomax || "---"}
                      </td>
                      <td className="font-bold text-xs text-foreground/70 px-2 py-1.5 text-center w-20 align-middle">
                        {item.product.oem || "---"}
                      </td>
                      <td className="px-4 py-1.5 align-middle">
                        <p className="font-bold text-xs uppercase text-foreground/90 leading-tight">
                          {item.product.descripcionManguera || item.product.name}
                        </p>
                      </td>
                      <td className="text-center px-3 py-1.5 align-middle">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary rounded-md px-2"
                        >
                          {item.product.category || "GENERAL"}
                        </Badge>
                      </td>
                      <td className="text-right font-black italic text-xs text-foreground px-3 py-1.5 tabular-nums align-middle">
                        {displayCurrency === "USD"
                          ? formatCurrency(item.product.precioFCA || item.product.price || 0, "USD")
                          : formatCurrency((item.product.precioFCA || item.product.price || 0) * exchangeRate, "VES")
                        }
                      </td>
                      <td className="text-center px-3 py-1.5 align-middle">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center bg-background/50 p-0.5 rounded-xl border border-border/40 shadow-inner">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-lg hover:bg-muted"
                              onClick={() =>
                                setPosCart((prev) =>
                                  prev.map((p) =>
                                    p.product.id === item.product.id
                                      ? {
                                          ...p,
                                          quantity: Math.max(1, p.quantity - 1),
                                        }
                                      : p,
                                  ),
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-xs font-black italic">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-lg hover:bg-muted"
                              onClick={() =>
                                setPosCart((prev) =>
                                  prev.map((p) =>
                                    p.product.id === item.product.id
                                      ? { ...p, quantity: p.quantity + 1 }
                                      : p,
                                  ),
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-black italic text-sm text-primary px-3 py-1.5 tabular-nums align-middle">
                        {displayCurrency === "USD"
                          ? formatCurrency(itemTotal, "USD")
                          : formatCurrency(itemTotal * exchangeRate, "VES")
                        }
                      </td>
                      <td className="text-center px-3 py-1.5 align-middle">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border/40 bg-muted/5">
          <Button
            variant="outline"
            className="rounded-xl border-dashed h-9 px-6 font-black uppercase italic text-[10px] gap-2 hover:bg-red-50 hover:text-red-600 transition-all"
            onClick={clearCart}
          >
            <Trash2 className="h-4 w-4" /> Vaciar Carrito
          </Button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Total Items:
              </span>
              <span className="text-lg font-black italic text-primary">
                {posCart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Monto Total:
              </span>
              <span className="text-lg font-black italic text-primary">
                {displayCurrency === "USD"
                  ? formatCurrency(cartTotal, "USD")
                  : formatCurrency(cartTotal * exchangeRate, "VES")
                }
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
