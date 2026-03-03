import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History } from "lucide-react";

interface InventoryDialogsProps {
  logic: any;
}

export const InventoryDialogs = ({ logic }: InventoryDialogsProps) => {
  return (
    <>
      {/* Modal de Auditoría */}
      <Dialog open={logic.isAuditOpen} onOpenChange={logic.setIsAuditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Historial de
              Auditoría
            </DialogTitle>
            <DialogDescription>
              Trazabilidad completa para: {logic.auditProduct?.name} (
              {logic.auditProduct?.cauplas})
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cambios</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.auditLogs
                  .filter((l: any) => l.record_id === logic.auditProduct?.id)
                  .map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.changes}
                      </TableCell>
                      <TableCell className="text-[10px] uppercase">
                        {log.tenant_id || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
