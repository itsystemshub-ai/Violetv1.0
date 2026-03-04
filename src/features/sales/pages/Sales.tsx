import React, { Suspense, lazy, useState } from "react";
import {
  ShoppingCart,
  Receipt,
  FileText,
  TrendingUp,
  Users,
  ShoppingBasket,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { SalesChart } from "@/shared/components/common/Charts";
import { useSalesLogic } from "@/features/sales/hooks/useSalesLogic";
import { formatCurrency, formatDate } from "@/lib";
import { useExchangeDifference } from "@/modules/finance/hooks/useExchangeDifference";
import { ModuleAIAssistant } from "@/core/ai/components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { ArrowUpRight } from "lucide-react";

// Lazy-loaded sub-components
const SalesPOS = lazy(() =>
  import("@/modules/sales/components/SalesPOS").then((m) => ({ default: m.SalesPOS })),
);
const SalesCart = lazy(() =>
  import("@/modules/sales/components/SalesCart").then((m) => ({
    default: m.SalesCart,
  })),
);
const SalesHistory = lazy(() =>
  import("@/modules/sales/components/SalesHistory").then((m) => ({
    default: m.SalesHistory,
  })),
);
const SalesManagement = lazy(() =>
  import("@/modules/sales/components/SalesManagement").then((m) => ({
    default: m.SalesManagement,
  })),
);
const SalesKPIs = lazy(() =>
  import("@/modules/sales/components/SalesKPIs").then((m) => ({
    default: m.SalesKPIs,
  })),
);
const EntityDialog = lazy(() =>
  import("@/modules/sales/components/EntityDialog").then((m) => ({
    default: m.EntityDialog,
  })),
);
const ReportDialog = lazy(() =>
  import("@/modules/sales/components/ReportDialog").then((m) => ({
    default: m.ReportDialog,
  })),
);
const SalesHistoryConsolidated = lazy(() =>
  import("@/modules/sales/components/SalesHistoryConsolidated").then((m) => ({
    default: m.SalesHistoryConsolidated,
  })),
);
const PaymentDialog = lazy(() =>
  import("@/modules/sales/components/PaymentDialog").then((m) => ({
    default: m.PaymentDialog,
  })),
);

const LoadingTab = () => (
  <div className="flex items-center justify-center p-12 h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const Sales = () => {
  const logic = useSalesLogic();
  const { processPayment } = useExchangeDifference();
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const handleMarkAsPaid = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentDialogOpen(true);
  };
  
  const handleConfirmPayment = async (paymentData: any) => {
    if (!selectedInvoiceForPayment) return;
    
    await processPayment(selectedInvoiceForPayment, paymentData);
    
    // Recargar facturas
    await logic.fetchInvoices();
  };

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-magenta-500/10 dark:bg-magenta-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />
      
      <div className="space-y-8 relative z-0 p-4 sm:p-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-[0_0_20px_rgba(236,72,153,0.2)] dark:drop-shadow-[0_0_20px_rgba(236,72,153,0.3)]">
              Ventas y Facturación
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Gestiona tus ingresos y punto de venta en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón de reportes movido al tab de Reportes */}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
              <TabsTrigger value="dashboard" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="pos" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                POS
              </TabsTrigger>
              <TabsTrigger value="cart" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Carrito
              </TabsTrigger>
              <TabsTrigger value="quotes" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Facturas
              </TabsTrigger>
              <TabsTrigger value="management" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Gestión
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-magenta-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                Reportes
              </TabsTrigger>
            </TabsList>
          </div>

        <Suspense fallback={<LoadingTab />}>
          <TabsContent value="dashboard" className="space-y-6">
            <SalesKPIs data={logic.dashboardData} formatCurrency={formatCurrency} />
            
            {/* AI Assistant */}
            <ModuleAIAssistant
              moduleName="Ventas"
              moduleContext="Módulo de ventas y facturación con POS, gestión de clientes, pedidos y análisis de ingresos"
              contextData={{
                totalSales: logic.dashboardData.totalSales,
                totalInvoices: logic.invoices.length,
                pendingInvoices: logic.invoices.filter(i => i.status !== 'pagada').length,
                topCustomers: logic.dashboardData.topCustomers,
              }}
              compact
            />
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="md:col-span-4 rounded-3xl shadow-xl overflow-hidden border backdrop-blur-xl bg-card/80 border-border">
                <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
                        Ventas en Tiempo Real
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                        Flujo de caja y rendimiento mensual
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[350px]">
                    <SalesChart data={logic.dashboardData.revenueChart} />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 rounded-3xl shadow-xl overflow-hidden border backdrop-blur-xl bg-card/80 border-border flex flex-col">
                <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
                  <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                    Últimas 10 transacciones efectuadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[380px]">
                    <div className="p-4 space-y-4">
                      {logic.invoices.slice(0, 10).map((inv, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:bg-muted/30 hover:border-primary/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-md group-hover:scale-110 ${inv.status === "pagada" ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/20" : "bg-orange-500/20 text-orange-600 border border-orange-500/20"}`}
                            >
                              {inv.status === "pagada" ? (
                                <ArrowUpRight className="h-5 w-5" />
                              ) : (
                                <TrendingUp className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-[11px] uppercase text-foreground/80 leading-none mb-1 group-hover:text-primary transition-colors">
                                {inv.customerName}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-1.5 line-clamp-1">
                                <Receipt className="h-3 w-3" /> Factura{" "}
                                {inv.number} • {formatDate(inv.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black italic text-sm text-foreground group-hover:text-primary transition-colors">
                              {formatCurrency(inv.total)}
                            </p>
                            <p
                              className={`text-[8px] font-black uppercase text-right leading-none mt-1 ${inv.status === "pagada" ? "text-emerald-500" : "text-orange-500"}`}
                            >
                              {inv.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pos">
            <SalesPOS
              searchQuery={logic.searchQueryPOS}
              setSearchQuery={logic.setSearchQueryPOS}
              products={logic.paginatedPOSProducts}
              allProducts={logic.filteredPOSProducts}
              onAdd={logic.addToCart}
              onImportExcel={logic.handleImportOrder}
              currentPage={logic.currentPagePOS}
              setCurrentPage={logic.setCurrentPagePOS}
              totalPages={logic.totalPagesPOS}
              itemsPerPage={logic.itemsPerPagePOS}
            />
          </TabsContent>

          <TabsContent value="cart">
            <SalesCart
              summaryEntityType={logic.summaryEntityType}
              setSummaryEntityType={logic.setSummaryEntityType}
              customerName={logic.customerName}
              setCustomerName={logic.setCustomerName}
              customers={logic.customers}
              sellers={logic.sellers}
              selectedSellerId={logic.selectedSellerId}
              setSelectedSellerId={logic.setSelectedSellerId}
              customerRif={logic.customerRif}
              setCustomerRif={logic.setCustomerRif}
              customerEmpresa={logic.customerEmpresa}
              setCustomerEmpresa={logic.setCustomerEmpresa}
              customerContacto={logic.customerContacto}
              setCustomerContacto={logic.setCustomerContacto}
              customerEmail={logic.customerEmail}
              setCustomerEmail={logic.setCustomerEmail}
              controlNumber={logic.controlNumber}
              setControlNumber={logic.setControlNumber}
              customerDireccion={logic.customerDireccion}
              setCustomerDireccion={logic.setCustomerDireccion}
              customerDireccionQuery={logic.customerDireccionQuery}
              setCustomerDireccionQuery={logic.setCustomerDireccionQuery}
              addressResults={logic.addressResults}
              withIva={logic.withIva}
              setWithIva={logic.setWithIva}
              currency={logic.currency}
              setCurrency={logic.setCurrency}
              displayCurrency={logic.displayCurrency}
              setDisplayCurrency={logic.setDisplayCurrency}
              paymentType={logic.paymentType}
              setPaymentType={logic.setPaymentType}
              creditDays={logic.creditDays}
              setCreditDays={logic.setCreditDays}
              exchangeRate={logic.exchangeRate}
              posCart={logic.posCart}
              setPosCart={logic.setPosCart}
              removeFromCart={logic.removeFromCart}
              clearCart={logic.clearCart}
              cartSubtotal={logic.cartSubtotal}
              cartIva={logic.cartIva}
              cartTotal={logic.cartTotal}
              isProcessing={logic.isProcessing}
              handleProcessSale={logic.handleProcessSale}
            />
          </TabsContent>

          <TabsContent value="invoices">
            <SalesHistory
              type="venta"
              title="Historial de Facturación"
              description="Documentos procesados y por cobrar"
              invoices={logic.invoices}
              searchTerm={logic.searchTerm}
              setSearchTerm={logic.setSearchTerm}
              tenant={logic.tenant}
              taxes={logic.taxes}
              displayCurrency={logic.displayCurrency}
              setDisplayCurrency={logic.setDisplayCurrency}
              exchangeRate={logic.exchangeRate}
              onDelete={logic.handleDeleteOrder}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </TabsContent>

          <TabsContent value="quotes">
            <SalesHistory
              type="pedido"
              title="Pedidos y Órdenes de Compra"
              description="Documentos preventa y órdenes pendientes"
              invoices={logic.invoices}
              searchTerm={logic.searchTerm}
              setSearchTerm={logic.setSearchTerm}
              tenant={logic.tenant}
              taxes={logic.taxes}
              displayCurrency={logic.displayCurrency}
              setDisplayCurrency={logic.setDisplayCurrency}
              exchangeRate={logic.exchangeRate}
              onEdit={logic.handleEditOrder}
              onDelete={logic.handleDeleteOrder}
              onCancel={logic.handleCancelOrder}
              onApprove={(id: any) =>
                logic.handleConvertDocument({ id }, "venta")
              }
            />
          </TabsContent>

          <TabsContent value="management">
            <SalesManagement
              customers={logic.customers}
              sellers={logic.sellers}
              onAddEntity={(type: any) => {
                logic.setEntityType(type);
                logic.setIsEditEntityOpen(true);
              }}
              onEditEntity={logic.handleEditEntityStart}
              onDeleteEntity={logic.handleDeleteEntity}
            />
          </TabsContent>

          <TabsContent value="reports">
            <SalesHistoryConsolidated />
          </TabsContent>
        </Suspense>
      </Tabs>

      <Suspense fallback={null}>
        <EntityDialog
          isOpen={logic.isEditEntityOpen}
          onOpenChange={logic.setIsEditEntityOpen}
          editingId={logic.editingEntityId}
          entityType={logic.entityType}
          newEntity={logic.newEntity}
          setNewEntity={logic.setNewEntity}
          onSave={logic.handleAddEntity}
        />

        <ReportDialog
          isOpen={logic.isReportModalOpen}
          onOpenChange={logic.setIsReportModalOpen}
          onExport={logic.handleExportReport}
        />
        
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          invoice={selectedInvoiceForPayment}
          currentExchangeRate={logic.exchangeRate}
          onConfirm={handleConfirmPayment}
        />
      </Suspense>
    </div>
    </div>
  );
};

export default Sales;
