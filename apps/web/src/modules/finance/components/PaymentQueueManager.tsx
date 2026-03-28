import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Check, X, Eye, Receipt, Clock, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/index";

interface PaymentQueueManagerProps {
  reportedPayments: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentQueueManager: React.FC<PaymentQueueManagerProps> = ({
  reportedPayments,
  onApprove,
  onReject,
}) => {
  return (
    <Card className="rounded-[2.5rem] shadow-2xl overflow-hidden border-none ring-1 ring-border/5 bg-background/50 backdrop-blur-sm">
      <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-2xl">
              <Receipt className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-black italic uppercase text-indigo-500 leading-none mb-1">
                Cola de Pagos Reportados
              </CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Verifica los reportes enviados por clientes vía el Portal Público
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-indigo-500 text-white font-black text-[10px] uppercase px-4 py-1.5 rounded-full border-none">
            {reportedPayments.length} Pendientes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {reportedPayments.length === 0 ? (
          <div className="p-12 text-center space-y-4 opacity-40">
            <Clock size={48} className="mx-auto text-muted-foreground" />
            <p className="font-black uppercase text-xs tracking-widest">No hay pagos nuevos por procesar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">Factura</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">Fecha Reporte</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">Método</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">Referencia</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">Monto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportedPayments.map((p) => (
                  <TableRow key={p.id} className="border-border/40 hover:bg-muted/10 transition-colors h-16 group">
                    <TableCell className="px-8 font-black italic text-indigo-500">{p.invoiceNumber}</TableCell>
                    <TableCell className="px-8 text-[10px] font-bold text-muted-foreground">{formatDate(p.date)}</TableCell>
                    <TableCell className="px-8">
                       <Badge variant="outline" className="text-[9px] font-black uppercase border-indigo-500/20 text-indigo-600 bg-indigo-500/5">
                        {p.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 font-mono text-xs font-bold">{p.reference}</TableCell>
                    <TableCell className="px-8 text-right font-black italic tabular-nums">
                      {formatCurrency(p.amount, p.currency)}
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                          onClick={() => onApprove(p.id)}
                          title="Aprobar Pago"
                        >
                          <Check size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white"
                          onClick={() => onReject(p.id)}
                          title="Rechazar Pago"
                        >
                          <X size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg bg-slate-500/10 text-slate-600"
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
