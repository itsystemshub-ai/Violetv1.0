import { Receipt, FileText, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (type: "pedido" | "venta") => void;
}

export const ReportDialog = ({
  isOpen,
  onOpenChange,
  onExport,
}: ReportDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-4xl border-border/40 shadow-2xl overflow-hidden bg-card/95 backdrop-blur-xl">
        <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
          <DialogTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
            Generar Reporte
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 grid gap-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center mb-2">
            Seleccione el tipo de documento:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="h-16 rounded-2xl border-2 border-border/40 hover:border-orange-500/30 hover:bg-orange-500/5 flex items-center justify-between px-6 group transition-all"
              onClick={() => onExport("pedido")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Receipt className="h-5 w-5" />
                </div>
                <span className="font-black uppercase italic text-xs tracking-wider">
                  Reporte de Pedidos
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-orange-500/50 transition-colors" />
            </Button>

            <Button
              variant="outline"
              className="h-16 rounded-2xl border-2 border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 flex items-center justify-between px-6 group transition-all"
              onClick={() => onExport("venta")}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="font-black uppercase italic text-xs tracking-wider">
                  Reporte de Facturas
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-emerald-500/50 transition-colors" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
