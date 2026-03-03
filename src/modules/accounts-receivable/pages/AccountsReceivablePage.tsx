import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  Search,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib";
import { cuentasPorCobrarService } from "@/services/microservices/tesoreria/CuentasPorCobrarService";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/AccountsReceivable/PaymentDialog";

const AccountsReceivable = () => {
  const { activeTenantId, exchangeRate } = useSystemConfig();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "partial" | "paid" | "overdue">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [activeTenantId]);

  const loadAccounts = async () => {
    if (!activeTenantId) return;
    
    setIsLoading(true);
    try {
      const data = await cuentasPorCobrarService.getAllAccounts(activeTenantId);
      setAccounts(data);
    } catch (error) {
      toast.error("Error al cargar cuentas por cobrar");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.total_amount, 0);
    const paid = accounts.reduce((sum, acc) => sum + acc.paid_amount, 0);
    const pending = total - paid;
    const overdue = accounts.filter(acc => 
      acc.status !== 'paid' && 
      acc.due_date && 
      new Date(acc.due_date) < new Date()
    ).reduce((sum, acc) => sum + acc.balance, 0);
    
    const pendingCount = accounts.filter(acc => acc.status === 'pending').length;
    const partialCount = accounts.filter(acc => acc.status === 'partial').length;
    const paidCount = accounts.filter(acc => acc.status === 'paid').length;
    const overdueCount = accounts.filter(acc => 
      acc.status !== 'paid' && 
      acc.due_date && 
      new Date(acc.due_date) < new Date()
    ).length;

    return {
      total,
      paid,
      pending,
      overdue,
      pendingCount,
      partialCount,
      paidCount,
      overdueCount
    };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(acc =>
        acc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.customer_rif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filterStatus !== "all") {
      if (filterStatus === "overdue") {
        filtered = filtered.filter(acc =>
          acc.status !== 'paid' &&
          acc.due_date &&
          new Date(acc.due_date) < new Date()
        );
      } else {
        filtered = filtered.filter(acc => acc.status === filterStatus);
      }
    }

    // Ordenar por fecha de vencimiento (más próximas primero)
    return filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [accounts, searchTerm, filterStatus]);

  const getStatusBadge = (account: any) => {
    const isOverdue = account.status !== 'paid' && 
      account.due_date && 
      new Date(account.due_date) < new Date();

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Vencida
        </Badge>
      );
    }

    switch (account.status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-emerald-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Pagada
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white gap-1">
            <Clock className="h-3 w-3" />
            Parcial
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleRegisterPayment = (account: any) => {
    setSelectedAccount(account);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentRegistered = () => {
    loadAccounts();
  };

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

      <div className="space-y-8 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Cuentas por Cobrar
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              Control de deudas y pagos de clientes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl h-12 px-6 font-black uppercase italic tracking-widest text-xs gap-2"
              onClick={() => toast.info("Exportación en desarrollo")}
            >
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Total por Cobrar
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic">{formatCurrency(stats.pending, "USD")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingCount + stats.partialCount} cuentas activas
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Cobrado
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic text-emerald-500">{formatCurrency(stats.paid, "USD")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidCount} cuentas pagadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Vencidas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic text-red-500">{formatCurrency(stats.overdue, "USD")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdueCount} cuentas vencidas
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Total Facturado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black italic">{formatCurrency(stats.total, "USD")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {accounts.length} facturas totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, RIF o factura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-2xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className="rounded-xl"
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  className="rounded-xl"
                >
                  Pendientes
                </Button>
                <Button
                  variant={filterStatus === "partial" ? "default" : "outline"}
                  onClick={() => setFilterStatus("partial")}
                  className="rounded-xl"
                >
                  Parciales
                </Button>
                <Button
                  variant={filterStatus === "overdue" ? "default" : "outline"}
                  onClick={() => setFilterStatus("overdue")}
                  className="rounded-xl"
                >
                  Vencidas
                </Button>
                <Button
                  variant={filterStatus === "paid" ? "default" : "outline"}
                  onClick={() => setFilterStatus("paid")}
                  className="rounded-xl"
                >
                  Pagadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card className="border-none shadow-xl bg-card rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase">
              Listado de Cuentas
            </CardTitle>
            <CardDescription>
              {filteredAccounts.length} cuenta(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-muted-foreground">
                      No se encontraron cuentas
                    </p>
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const isOverdue = account.status !== 'paid' && 
                      account.due_date && 
                      new Date(account.due_date) < new Date();
                    const daysUntilDue = account.due_date ? getDaysUntilDue(account.due_date) : null;

                    return (
                      <Card
                        key={account.id}
                        className={`border-2 transition-all hover:shadow-lg ${
                          isOverdue ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' : 'border-border/40'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black italic">
                                  {account.customer_name || account.customer_empresa}
                                </h3>
                                {getStatusBadge(account)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">RIF:</span>{" "}
                                  <span className="font-bold">{account.customer_rif || "---"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Factura:</span>{" "}
                                  <span className="font-bold">{account.invoice_number}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Fecha:</span>{" "}
                                  <span className="font-bold">{formatDate(account.created_at)}</span>
                                </div>
                                {account.due_date && (
                                  <div>
                                    <span className="text-muted-foreground">Vencimiento:</span>{" "}
                                    <span className={`font-bold ${isOverdue ? 'text-red-500' : ''}`}>
                                      {formatDate(account.due_date)}
                                      {daysUntilDue !== null && !isOverdue && (
                                        <span className="text-xs ml-1">({daysUntilDue}d)</span>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black italic mb-1">
                                {formatCurrency(account.balance, account.currency)}
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                                <div>
                                  Total: {formatCurrency(account.total_amount, account.currency)}
                                </div>
                                {account.paid_amount > 0 && (
                                  <div className="text-emerald-500">
                                    Pagado: {formatCurrency(account.paid_amount, account.currency)}
                                  </div>
                                )}
                              </div>
                              {account.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                                  onClick={() => handleRegisterPayment(account)}
                                >
                                  <Plus className="h-4 w-4" />
                                  Registrar Pago
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          account={selectedAccount}
          onPaymentRegistered={handlePaymentRegistered}
        />
      </div>
    </div>
  );
};

export default AccountsReceivable;
