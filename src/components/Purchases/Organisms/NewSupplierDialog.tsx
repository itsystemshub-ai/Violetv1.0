import React from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newSupplier: any;
  setNewSupplier: (val: any) => void;
  onAdd: () => void;
}

const NewSupplierDialog: React.FC<NewSupplierDialogProps> = ({
  open,
  onOpenChange,
  newSupplier,
  setNewSupplier,
  onAdd,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F1115] border-white/10 text-white rounded-3xl shadow-3xl max-w-lg">
        <DialogHeader className="pb-4 border-b border-white/5">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
              <Users size={18} />
            </div>
            Nuevo Proveedor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-8">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs font-bold tracking-widest uppercase">
              Nombre / Razón Social
            </Label>
            <Input
              value={newSupplier.name}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, name: e.target.value })
              }
              className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-violet-500"
              placeholder="Ej: Inversiones Globales C.A."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs font-bold tracking-widest uppercase">
              RIF (Ej: J-12345678-9)
            </Label>
            <Input
              value={newSupplier.rif}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, rif: e.target.value })
              }
              className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-violet-500 font-mono"
              placeholder="J-00000000-0"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                Teléfono
              </Label>
              <Input
                value={newSupplier.phone}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, phone: e.target.value })
                }
                className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-violet-500"
                placeholder="+58 412..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs font-bold tracking-widest uppercase">
                Categoría
              </Label>
              <Select
                onValueChange={(v) =>
                  setNewSupplier({ ...newSupplier, category: v })
                }
                defaultValue={newSupplier.category}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="Estratégico">Estratégico</SelectItem>
                  <SelectItem value="Operativo">Operativo</SelectItem>
                  <SelectItem value="Servicios">Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-white/5">
          <Button
            onClick={onAdd}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-2xl h-14 font-black uppercase tracking-[0.1em] shadow-lg shadow-violet-600/30 transition-all hover:translate-y-[-2px]"
          >
            Registrar Proveedor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewSupplierDialog;
