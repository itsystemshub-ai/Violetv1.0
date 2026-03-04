import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

interface EntityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  entityType: "cliente" | "vendedor";
  newEntity: any;
  setNewEntity: (val: any) => void;
  onSave: () => void;
}

export const EntityDialog = ({
  isOpen,
  onOpenChange,
  editingId,
  entityType,
  newEntity,
  setNewEntity,
  onSave,
}: EntityDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black italic tracking-tighter uppercase text-primary">
            {editingId ? "Editar" : "Añadir"}{" "}
            {entityType === "cliente" ? "Cliente" : "Vendedor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">
                Nombre Completo
              </Label>
              <Input
                value={newEntity.nombre}
                onChange={(e) =>
                  setNewEntity({ ...newEntity, nombre: e.target.value })
                }
                className="h-10 rounded-xl bg-muted/20 border-border/40"
                placeholder="Nombre..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">
                RIF / CI
              </Label>
              <Input
                value={newEntity.rif}
                onChange={(e) =>
                  setNewEntity({ ...newEntity, rif: e.target.value })
                }
                className="h-10 rounded-xl bg-muted/20 border-border/40"
                placeholder="V-... / J-..."
              />
            </div>
          </div>
          {entityType === "cliente" && (
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">
                Razón Social / Empresa
              </Label>
              <Input
                value={newEntity.empresa}
                onChange={(e) =>
                  setNewEntity({ ...newEntity, empresa: e.target.value })
                }
                className="h-10 rounded-xl bg-muted/20 border-border/40"
                placeholder="Empresa..."
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">
                Teléfono
              </Label>
              <Input
                value={newEntity.contacto}
                onChange={(e) =>
                  setNewEntity({ ...newEntity, contacto: e.target.value })
                }
                className="h-10 rounded-xl bg-muted/20 border-border/40"
                placeholder="0414..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase ml-1">
                Correo
              </Label>
              <Input
                value={newEntity.email}
                onChange={(e) =>
                  setNewEntity({ ...newEntity, email: e.target.value })
                }
                className="h-10 rounded-xl bg-muted/20 border-border/40"
                placeholder="email@..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase ml-1">
              Dirección Principal
            </Label>
            <Input
              value={newEntity.direccion}
              onChange={(e) =>
                setNewEntity({ ...newEntity, direccion: e.target.value })
              }
              className="h-10 rounded-xl bg-muted/20 border-border/40"
              placeholder="Calle, Ciudad, Estado..."
            />
          </div>
          <Button
            className="w-full h-12 bg-primary font-black uppercase italic tracking-widest rounded-2xl shadow-lg mt-2"
            onClick={onSave}
          >
            {editingId ? "Actualizar" : "Guardar"} Registro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
