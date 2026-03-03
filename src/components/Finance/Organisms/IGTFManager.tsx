import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/index";
import { Zap, Receipt } from "lucide-react";

interface IGTFManagerProps {
  logic: any;
}

export const IGTFManager = ({ logic }: IGTFManagerProps) => {
  return (
    <Card className="rounded-[2.5rem] shadow-2xl overflow-hidden border-none ring-1 ring-border/5 bg-card/50 backdrop-blur-xl">
      <div className="p-6 bg-muted/10 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-2xl">
            <Zap className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase text-amber-600 leading-none mb-1">
              Control IGTF (3%)
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Registros de transacciones sujetas a gravamen
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="h-7 px-3 rounded-lg border-amber-500/20 bg-amber-500/5 text-amber-600 font-black text-[10px] uppercase"
        >
          {logic.igtfRecords.length} Operaciones
        </Badge>
      </div>

      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                Fecha
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12">
                Método de Pago
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right">
                Base Imponible
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 h-12 text-right text-amber-600">
                IGTF (3%)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logic.igtfRecords.map((rec: any) => (
              <TableRow
                key={rec.id}
                className="group border-border/40 hover:bg-amber-500/5 transition-colors h-14"
              >
                <TableCell className="px-8 py-4 text-[10px] font-bold text-muted-foreground tabular-nums">
                  {formatDate(rec.created_at)}
                </TableCell>
                <TableCell className="px-8 py-4">
                  <Badge
                    variant="outline"
                    className="rounded-lg h-6 px-3 text-[10px] font-black uppercase border-border/60 bg-background text-foreground/70 group-hover:border-amber-500/40 group-hover:text-amber-600 transition-colors"
                  >
                    {rec.metodo_pago}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 py-4 text-right font-black italic text-xs tabular-nums text-foreground/80">
                  {formatCurrency(rec.monto_base, "USD")}
                </TableCell>
                <TableCell className="px-8 py-4 text-right">
                  <span className="text-sm font-black italic tabular-nums text-amber-600">
                    {formatCurrency(rec.monto_igtf, "USD")}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {logic.igtfRecords.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-20 text-muted-foreground/30 font-black uppercase text-[10px] tracking-[0.2em] italic"
                >
                  No hay registros de IGTF en el período
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {logic.igtfRecords.length > 0 && (
        <div className="p-6 bg-amber-500/5 border-t border-border/40 flex justify-between items-center group">
          <span className="text-[10px] font-black uppercase text-amber-600/60 tracking-widest flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Total IGTF Recaudado:
          </span>
          <span className="text-2xl font-black italic text-amber-600 tabular-nums group-hover:scale-110 transition-transform">
            {formatCurrency(logic.igtfSummary?.totalIGTF || 0, "USD")}
          </span>
        </div>
      )}
    </Card>
  );
};
