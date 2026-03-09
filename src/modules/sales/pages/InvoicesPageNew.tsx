/**
 * InvoicesPageNew - Gestión de Facturas (solo desde pedidos aprobados)
 */

import { useState } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  FileText,
  Search,
  Eye,
  Edit,
  CheckCircle,
  Users,
  UserCog,
  DollarSign,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useSalesDocuments } from "../hooks/useSalesDocuments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

export default function InvoicesPageNew() {
  const {
    invoices,
    stats,
    approveDocument,
    changeCurrency,
    changePaymentMethod,
  } = useSalesDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  // Edit state
  const [editCurrency, setEditCurrency] = useState<"USD" | "VES">("USD");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (invoice: any) => {
    setSelectedInvoiceId(invoice.id);
    setEditCurrency(invoice.currency);
    setEditPaymentMethod(invoice.paymentMethod || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedInvoiceId) return;

    try {
      changeCurrency(selectedInvoiceId, editCurrency);
      if (editPaymentMethod) {
        changePaymentMethod(selectedInvoiceId, editPaymentMethod);
      }
      setEditDialogOpen(false);
      alert("Factura actualizada exitosamente");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApprove = () => {
    if (!selectedInvoiceId) return;

    try {
      approveDocument(selectedInvoiceId);
      setApproveDialogOpen(false);
      alert("Factura aprobada. Ya no se puede modificar.");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendiente", className: "bg-yellow-500" },
      approved: { label: "Aprobada", className: "bg-green-500" },
      cancelled: { label: "Cancelada", className: "bg-red-500" },
    };
    const config = variants[status as keyof typeof variants];
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const kpiStats = [
    {
      label: "Total Facturas",
      value: stats.invoices.total.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Pendientes",
      value: stats.invoices.pending.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      label: "Aprobadas",
      value: stats.invoices.approved.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Monto Total",
      value: `$${stats.invoices.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Facturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Las facturas se generan automáticamente desde pedidos aprobados
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="flex-1"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="all">
                Todas ({stats.invoices.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.invoices.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprobadas ({stats.invoices.approved})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Facturas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron facturas</p>
                <p className="text-sm text-muted-foreground mt-2">Las facturas se crean automáticamente al aprobar pedidos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Código</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Cliente</th>
                      <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Fecha</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Moneda</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Subtotal</th>
                      <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Total</th>
                      <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Estado</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs whitespace-nowrap">{invoice.code}</td>
                        <td className="py-3 px-3"><Badge variant="outline" className="text-xs">{invoice.recipientType === "client" ? "Cliente" : "Vendedor"}</Badge></td>
                        <td className="py-3 px-3 max-w-[160px] break-words">{invoice.recipientName}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-center"><Badge variant="outline">{invoice.currency}</Badge></td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">{invoice.currency === "USD" ? "$" : "Bs."}{invoice.subtotal.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">{invoice.currency === "USD" ? "$" : "Bs."}{invoice.total.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">{getStatusBadge(invoice.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedInvoiceId(invoice.id); setViewDialogOpen(true); }} title="Ver"><Eye className="w-3.5 h-3.5" /></Button>
                            {invoice.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(invoice)} title="Editar"><Edit className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedInvoiceId(invoice.id); setApproveDialogOpen(true); }} title="Aprobar"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
            <DialogDescription>
              Modifica la moneda o método de pago antes de aprobar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Moneda</label>
              <Select
                value={editCurrency}
                onValueChange={(value: "USD" | "VES") => setEditCurrency(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólares (USD) - Sin IVA</SelectItem>
                  <SelectItem value="VES">
                    Bolívares (VES) - Con IVA 16%
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {editCurrency === "USD"
                  ? "No se aplicará IVA"
                  : "Se aplicará IVA del 16%"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Método de Pago</label>
              <Select
                value={editPaymentMethod}
                onValueChange={setEditPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_usd">Efectivo USD</SelectItem>
                  <SelectItem value="cash_ves">Efectivo Bs.</SelectItem>
                  <SelectItem value="transfer_usd">
                    Transferencia USD
                  </SelectItem>
                  <SelectItem value="transfer_ves">
                    Transferencia Bs.
                  </SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Una vez aprobada, la factura no se podrá modificar
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar Factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez aprobada, la factura NO se podrá modificar. Asegúrese de
              que todos los datos sean correctos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar Factura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ValeryLayout>
  );
}
