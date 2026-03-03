import {
  Search,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Eye,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency } from "@/lib/index";
import { exportInvoicePDF, exportInvoiceExcel } from "@/lib/exportUtils";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/PaginationControls";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface SalesHistoryProps {
  type: "venta" | "pedido";
  title: string;
  description: string;
  invoices: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onEdit?: (order: any) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onApprove?: (id: string) => void;
  onMarkAsPaid?: (invoice: any) => void;
  tenant: any;
  taxes: any;
  displayCurrency: "USD" | "VES";
  setDisplayCurrency: (val: "USD" | "VES") => void;
  exchangeRate: number;
}

export const SalesHistory = ({
  type,
  title,
  description,
  invoices,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  onCancel,
  onApprove,
  onMarkAsPaid,
  tenant,
  taxes,
  displayCurrency,
  setDisplayCurrency,
  exchangeRate,
}: SalesHistoryProps) => {
  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.type === type &&
        ((inv.number?.toString() || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (inv.customerName?.toString() || "").toLowerCase().includes(debouncedSearchTerm.toLowerCase())),
    );
  }, [invoices, type, debouncedSearchTerm]);

  const pagination = usePagination({
    totalItems: filteredInvoices.length,
    initialPageSize: 25,
  });

  const paginatedInvoices = useMemo(() => {
    if (!pagination) return filteredInvoices.slice(0, 25);
    const start = pagination.offset || 0;
    const end = start + (pagination.pageSize || 25);
    return filteredInvoices.slice(start, end);
  }, [filteredInvoices, pagination]);

  return (
    <Card className="border-none shadow-xl bg-card border border-border/40 rounded-3xl overflow-hidden ring-1 ring-border/5">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
              {title}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
              {description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle de Moneda */}
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
            
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder="Buscar por número o cliente..."
                className="pl-10 pr-10 h-10 w-[280px] text-xs font-bold rounded-xl border-border/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-b-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-white sticky top-0 z-10 shadow-sm">
                  Fecha
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 bg-white sticky top-0 z-10 shadow-sm">
                  {type === "venta" ? "Nro Factura" : "Nro Control"}
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-white sticky top-0 z-10 shadow-sm">
                  Entidad
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 bg-white sticky top-0 z-10 shadow-sm">
                  RIF
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 bg-white sticky top-0 z-10 shadow-sm">
                  Empresa
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-white sticky top-0 z-10 shadow-sm">
                  Cant. Total
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-right bg-white sticky top-0 z-10 shadow-sm">
                  Total
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-center bg-white sticky top-0 z-10 shadow-sm">
                  Estado
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12 text-right pr-6 bg-white sticky top-0 z-10 shadow-sm">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-border/40 hover:bg-muted/10 transition-colors group"
                >
                  <TableCell className="text-center text-xs font-bold text-muted-foreground px-6 py-4">
                    {inv.date ? formatDate(inv.date) : "---"}
                  </TableCell>
                  <TableCell className="font-black italic text-sm text-primary px-6 py-4">
                    {inv.number || "---"}
                  </TableCell>
                  <TableCell className="text-center px-6 py-4">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary rounded-md px-2"
                    >
                      {inv.metadata?.entityType || "Cliente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[10px] font-bold text-muted-foreground">
                    {inv.customer_rif || inv.customerRif || "---"}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-bold text-xs uppercase text-foreground/80 leading-none">
                    {inv.customer_empresa || inv.metadata?.empresa || "---"}
                  </TableCell>
                  <TableCell className="text-center px-6 py-4 font-black text-xs">
                    {(inv.items || []).reduce(
                      (acc: number, item: any) => acc + (item.quantity || 0),
                      0,
                    )} Unds
                  </TableCell>
                  <TableCell className="text-right font-black italic text-sm text-foreground px-6 py-4 tabular-nums">
                    {displayCurrency === "USD" 
                      ? formatCurrency(inv.total || 0, "USD")
                      : formatCurrency((inv.total || 0) * exchangeRate, "VES")
                    }
                  </TableCell>
                  <TableCell className="text-center px-6 py-4">
                    <Badge
                      variant={
                        inv.status === "pagada" || inv.status === "procesado"
                          ? "default"
                          : inv.status === "anulado"
                            ? "destructive"
                            : "secondary"
                      }
                      className={`uppercase font-black text-[9px] tracking-wider px-3 py-1 rounded-full shadow-sm ${
                        inv.status === "pagada" || inv.status === "procesado"
                          ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                          : inv.status === "anulado"
                            ? "bg-red-500/20 text-red-600 border border-red-500/30"
                            : "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                      }`}
                    >
                      {inv.status === "anulado"
                        ? "Anulado"
                        : type === "pedido" &&
                            (inv.status === "procesado" || inv.status === "pagada")
                          ? "Aprobado"
                          : type === "pedido"
                            ? "Pendiente"
                          : inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6 py-4 pr-6">
                    <div className="flex justify-end gap-1.5">
                      {/* Botón Ver */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-[9px] font-black uppercase"
                        onClick={() => navigate(`/invoice-preview?id=${inv.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      
                      {/* Botón Marcar como Pagada (solo para facturas pendientes) */}
                      {type === "venta" &&
                        inv.status !== "pagada" &&
                        inv.status !== "anulado" &&
                        onMarkAsPaid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-black uppercase"
                            onClick={() => onMarkAsPaid(inv)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Cobrar
                          </Button>
                        )}
                      
                      {type === "pedido" &&
                        (inv.status?.toLowerCase() === "pendiente" || inv.status?.toLowerCase() === "pending") &&
                        onApprove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-black uppercase"
                            onClick={() => onApprove(inv.id)}
                          >
                            Aprobar
                          </Button>
                        )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl shadow-2xl border-border/40 w-48 p-1"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              exportInvoicePDF(inv, tenant, taxes?.iva_general)
                            }
                            className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
                          >
                            <FileText className="h-3.5 w-3.5" /> Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => exportInvoiceExcel(inv, tenant)}
                            className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar
                            Excel
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(inv)}
                              className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Editar
                            </DropdownMenuItem>
                          )}
                          <Separator className="my-1 opacity-50" />
                          {type === "pedido" && onCancel && inv.status !== "anulado" && (
                            <DropdownMenuItem
                              onClick={() => onCancel(inv.id)}
                              className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3 text-orange-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Anular Pedido
                            </DropdownMenuItem>
                          )}
                          {type === "venta" && onCancel && inv.status !== "anulado" && (
                            <DropdownMenuItem
                              onClick={() => onCancel(inv.id)}
                              className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3 text-orange-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Anular Factura
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(inv.id)}
                              className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3 text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />{" "}
                              {type === "venta"
                                ? "Eliminar Factura"
                                : "Eliminar Pedido"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedInvoices.length === 0 && filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-40 text-center text-muted-foreground/40 font-black uppercase italic text-xs tracking-widest"
                  >
                    No hay documentos que coincidan con la búsqueda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Controles de paginación */}
        {filteredInvoices.length > 0 && pagination && (
          <div className="p-4 border-t border-border/40">
            <PaginationControls
              currentPage={pagination.currentPage || 1}
              totalPages={pagination.totalPages || 1}
              pageSize={pagination.pageSize || 25}
              totalItems={filteredInvoices.length}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
