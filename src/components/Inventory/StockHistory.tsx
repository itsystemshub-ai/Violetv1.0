import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, Plus } from "lucide-react";

interface StockHistoryProps {
  logic: any;
}

export const StockHistory = ({ logic }: StockHistoryProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 px-8 py-6">
          <CardTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary">
            Historial de Ventas Consolidado
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase text-muted-foreground/60 tracking-wider">
            Análisis comparativo trienal (2023 - 2024 - 2025)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-8 h-14 uppercase text-[10px] font-black">
                    Item
                  </TableHead>
                  <TableHead className="text-center h-14 bg-blue-500/5 uppercase text-[10px] font-black">
                    2023
                  </TableHead>
                  <TableHead className="text-center h-14 bg-amber-500/5 uppercase text-[10px] font-black">
                    2024
                  </TableHead>
                  <TableHead className="text-center h-14 bg-emerald-500/5 uppercase text-[10px] font-black">
                    2025
                  </TableHead>
                  <TableHead className="text-center h-14 bg-primary/10 uppercase text-[10px] font-black">
                    Promedio
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.filteredProducts.map((product: any) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black italic text-primary uppercase">
                          {product.cauplas}
                        </span>
                        <span className="text-[11px] font-bold uppercase line-clamp-1">
                          {product.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black italic text-xs bg-blue-500/5 text-blue-600">
                      {product.ventasHistory?.[2023] || 0}
                    </TableCell>
                    <TableCell className="text-center font-black italic text-xs bg-amber-500/5 text-amber-600">
                      {product.ventasHistory?.[2024] || 0}
                    </TableCell>
                    <TableCell className="text-center font-black italic text-xs bg-emerald-500/5 text-emerald-600">
                      {product.ventasHistory?.[2025] || 0}
                    </TableCell>
                    <TableCell className="text-center font-black italic text-sm bg-primary/10 text-primary">
                      {product.historial || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-primary" /> Movimientos
              entre Almacenes
            </CardTitle>
          </div>

          <Dialog
            open={logic.isTransferOpen}
            onOpenChange={logic.setIsTransferOpen}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => logic.setIsTransferOpen(true)}
              >
                <Plus className="w-4 h-4" /> Nueva Transferencia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Mover Mercancía</DialogTitle>
                <DialogDescription>
                  Selecciona el producto y los almacenes involucrados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select
                    value={logic.transferData.productId}
                    onValueChange={(v) =>
                      logic.setTransferData((p: any) => ({
                        ...p,
                        productId: v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {logic.products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.cauplas || p.name} ({p.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origen</Label>
                    <Select
                      value={logic.transferData.originWh}
                      onValueChange={(v) =>
                        logic.setTransferData((p: any) => ({
                          ...p,
                          originWh: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh-main">Principal</SelectItem>
                        <SelectItem value="wh-dist">Distribución</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select
                      value={logic.transferData.destWh}
                      onValueChange={(v) =>
                        logic.setTransferData((p: any) => ({ ...p, destWh: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh-main">Principal</SelectItem>
                        <SelectItem value="wh-dist">Distribución</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={logic.transferData.quantity}
                    onChange={(e) =>
                      logic.setTransferData((p: any) => ({
                        ...p,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <Button className="w-full" onClick={logic.handleTransfer}>
                  Confirmar Movimiento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
};
