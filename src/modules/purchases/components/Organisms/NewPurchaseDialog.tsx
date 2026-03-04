import React from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/lib/index";

interface NewPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPurchase: any;
  setNewPurchase: (val: any) => void;
  suppliers: any[];
  products: any[];
  onAddStream: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onProcess: () => void;
  exchangeRate: number;
}

const NewPurchaseDialog: React.FC<NewPurchaseDialogProps> = ({
  open,
  onOpenChange,
  newPurchase,
  setNewPurchase,
  suppliers,
  products,
  onAddStream,
  onRemoveItem,
  onUpdateItem,
  onProcess,
  exchangeRate,
}) => {
  const purchaseSubtotal = newPurchase.items.reduce(
    (acc: number, item: any) => acc + item.cantidad * item.precio_unitario_usd,
    0,
  );
  const purchaseIva = newPurchase.items.reduce(
    (acc: number, item: any) =>
      acc +
      item.cantidad * item.precio_unitario_usd * (item.porcentaje_iva / 100),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#0F1115] border-white/10 text-white rounded-3xl shadow-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Package className="text-violet-400" />
            Registrar Nueva Compra
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-white/5">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">
              Proveedor
            </Label>
            <Select
              onValueChange={(v) =>
                setNewPurchase({ ...newPurchase, proveedor_id: v })
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.rif})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">
              Factura #
            </Label>
            <Input
              value={newPurchase.num_factura}
              onChange={(e) =>
                setNewPurchase({ ...newPurchase, num_factura: e.target.value })
              }
              className="bg-white/5 border-white/10 h-11 rounded-xl"
              placeholder="000123"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">
              Control #
            </Label>
            <Input
              value={newPurchase.num_control}
              onChange={(e) =>
                setNewPurchase({ ...newPurchase, num_control: e.target.value })
              }
              className="bg-white/5 border-white/10 h-11 rounded-xl"
              placeholder="00-4455"
            />
          </div>
        </div>

        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
              Detalle de Productos
            </h4>
            <Button
              size="sm"
              onClick={onAddStream}
              className="bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 rounded-xl border border-violet-500/30 h-9"
            >
              <Plus size={14} className="mr-2" /> Agregar Item
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {newPurchase.items.map((item: any, index: number) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={index}
                  className="flex flex-wrap md:flex-nowrap gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 items-center"
                >
                  <div className="flex-1 min-w-[200px]">
                    <Select
                      onValueChange={(v) =>
                        onUpdateItem(index, "producto_id", v)
                      }
                    >
                      <SelectTrigger className="bg-transparent border-white/10 h-10">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10 text-white">
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.cauplas})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        onUpdateItem(index, "cantidad", Number(e.target.value))
                      }
                      className="bg-transparent border-white/10 h-10"
                      placeholder="Cant"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={item.precio_unitario_usd}
                      onChange={(e) =>
                        onUpdateItem(
                          index,
                          "precio_unitario_usd",
                          Number(e.target.value),
                        )
                      }
                      className="bg-transparent border-white/10 h-10"
                      placeholder="USD Unit"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(index)}
                    className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            {newPurchase.items.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-white/10 rounded-2xl">
                <Package size={30} className="opacity-20" />
                <p className="text-xs italic">
                  Cargue los productos de la factura para actualizar el CPP.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 mt-4 border-t border-white/10">
          <div className="flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center min-w-[150px]">
              <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1">
                Subtotal USD
              </p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(purchaseSubtotal, "USD")}
              </p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 text-center min-w-[150px]">
              <p className="text-[10px] text-violet-400 uppercase font-black tracking-widest mb-1">
                Total VES
              </p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(
                  (purchaseSubtotal + purchaseIva) * (exchangeRate || 0),
                  "VES",
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="w-full md:w-auto flex gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl text-gray-400 h-12 px-6 font-bold hover:bg-white/5 transition-all text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={onProcess}
              className="bg-violet-600 hover:bg-violet-500 text-white rounded-2xl h-12 px-10 shadow-lg shadow-violet-600/30 font-bold text-xs"
            >
              Procesar e Ingresar Stock
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewPurchaseDialog;
