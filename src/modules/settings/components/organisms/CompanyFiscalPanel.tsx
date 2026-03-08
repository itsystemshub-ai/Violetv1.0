import React from "react";
import {
  Banknote,
  RefreshCw,
  Building2,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  Percent,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/core/shared/utils/utils";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
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
import { TenantSetupForm } from "@/shared/components/common/Forms";
import SettingsCard from "../Atoms/SettingsCard";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";

interface CompanyFiscalPanelProps {
  tenant: any;
  updateTenantById: (id: string, data: any) => Promise<void>;
  isMaster: boolean;
  // Props para crear nueva empresa
  isAddTenantOpen?: boolean;
  setIsAddTenantOpen?: (open: boolean) => void;
  newTenant?: any;
  setNewTenant?: (tenant: any) => void;
  handleAddTenant?: (tenantData?: any) => void;
  // Props para selector de empresa activa
  allTenants?: any[];
  activeTenantId?: string | null;
  setActiveTenant?: (id: string | null) => void;
  deleteTenant?: (id: string) => void;
}

const CompanyFiscalPanel: React.FC<CompanyFiscalPanelProps> = ({
  tenant,
  updateTenantById,
  isMaster,
  isAddTenantOpen,
  setIsAddTenantOpen,
  newTenant,
  setNewTenant,
  handleAddTenant,
  allTenants,
  activeTenantId,
  setActiveTenant,
  deleteTenant,
}) => {
  const { exchangeRate, setExchangeRate, taxes, syncBcvRate, updateConfig } =
    useSystemConfig();
  const [isDeleteTenantOpen, setIsDeleteTenantOpen] = React.useState(false);
  const [isEditTenantOpen, setIsEditTenantOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<any>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Valores por defecto para taxes si no hay config
  const DEFAULT_TAXES = {
    iva_general: 16,
    iva_reducido: 8,
    iva_lujo: 31,
    igtf_divisas: 3,
    rif_mask: "J-00000000-0",
    utValue: 90.0,
  };

  const taxesConfig = taxes || DEFAULT_TAXES;

  const handleSyncBcv = async () => {
    setIsSyncing(true);
    await syncBcvRate();
    setIsSyncing(false);
  };

  const safeTenants = allTenants || [];

  const handleUpdateTenant = async (data: any) => {
    if (tenant?.id) {
      try {
        await updateTenantById(tenant.id, data);
        toast.success("Empresa actualizada correctamente");
      } catch (error) {
        toast.error("Error al actualizar la empresa");
        console.error(error);
      }
    }
  };

  const handleEditTenant = async (data: any) => {
    if (selectedTenant?.id) {
      try {
        await updateTenantById(selectedTenant.id, data);
        toast.success("Empresa actualizada correctamente");
        setIsEditTenantOpen(false);
        setSelectedTenant(null);
      } catch (error) {
        toast.error("Error al actualizar la empresa");
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isMaster && setIsAddTenantOpen && (
          <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-violet-500/30 hover:bg-violet-500/10"
              >
                <Plus className="h-4 w-4" />
                Nueva Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Empresa</DialogTitle>
                <DialogDescription>
                  Completa todos los datos legales y de contacto de la nueva
                  empresa
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <TenantSetupForm
                  initialData={newTenant}
                  onSubmit={(data) => {
                    // Pasar los datos directamente a handleAddTenant
                    handleAddTenant?.(data);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Selector de Empresa Activa */}
      {isMaster && safeTenants.length > 0 && (
        <SettingsCard
          title="Configuración de Empresa Activa"
          description="Selecciona la empresa que regirá los datos fiscales y el branding del sistema."
          icon={<Building2 className="h-5 w-5" />}
        >
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-primary/5 border-primary/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">
                {activeTenantId ? (
                  <>
                    Empresa Actual:{" "}
                    <span className="text-primary">
                      {safeTenants.find((t) => t.id === activeTenantId)?.name}
                    </span>
                  </>
                ) : (
                  "Sin empresa asignada"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeTenantId
                  ? "El sistema usa los datos de esta empresa para todos los módulos."
                  : "El sistema funciona en modo neutro hasta que asignes una empresa."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Seleccionar empresa activa</Label>
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Logo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>RIF</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Estado
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeTenants.map((t) => (
                    <TableRow
                      key={t.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        activeTenantId === t.id
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => setActiveTenant?.(t.id)}
                    >
                      <TableCell>
                        {t.logoUrl ? (
                          <img
                            src={t.logoUrl}
                            alt={t.name}
                            className="w-10 h-10 rounded-lg object-contain bg-white border"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              backgroundColor: t.primaryColor || "#7c3aed",
                            }}
                          >
                            {(t.name || "??").substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.fiscalName}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {t.rif}
                      </TableCell>
                      <TableCell className="text-center">
                        {activeTenantId === t.id && (
                          <div className="flex items-center justify-center gap-1 text-primary">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Activa</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenant(t);
                              setIsEditTenantOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTenant(t);
                              setIsDeleteTenantOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {activeTenantId && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 border-destructive/30 w-full"
                onClick={() => setActiveTenant?.(null)}
              >
                Desasociar empresa del sistema
              </Button>
            </>
          )}
        </SettingsCard>
      )}

      {/* Diálogo de confirmación para eliminar empresa */}
      <AlertDialog
        open={isDeleteTenantOpen}
        onOpenChange={setIsDeleteTenantOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la empresa "
              {selectedTenant?.name}". Todos los datos asociados se perderán.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (selectedTenant && deleteTenant) {
                  deleteTenant(selectedTenant.id);
                  setIsDeleteTenantOpen(false);
                  setSelectedTenant(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para editar empresa */}
      <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
        <DialogContent className="rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Actualiza los datos legales, de contacto y visuales de la empresa
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TenantSetupForm
              initialData={selectedTenant}
              onSubmit={handleEditTenant}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyFiscalPanel;
