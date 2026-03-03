import React from "react";
import {
  Building2,
  Server,
  Monitor,
  Network,
  Radio,
  Wifi,
  Clock,
  RefreshCw,
  Banknote,
  Globe,
  Percent,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SettingsCard from "../Atoms/SettingsCard";
import ConfigToggle from "../Molecules/ConfigToggle";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { TenantSetupForm } from "@/shared/components/common/Forms";

// Valores por defecto para taxes
const DEFAULT_TAXES = {
  iva_general: 16,
  iva_reducido: 8,
  iva_lujo: 31,
  igtf_divisas: 3,
  rif_mask: 'J-00000000-0',
  utValue: 90.00,
};

interface SystemConfigPanelProps {
  activeTenantId: string | null;
  allTenants: any[];
  setActiveTenant: (id: string | null) => void;
  updateTenantById: (id: string, data: any) => void;
  deleteTenant: (id: string) => void;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  syncBcvRate: () => void;
  isLoading: boolean;
  taxes: any;
  instances: any[];
  syncInstances: () => void;
  isMaster: boolean;
}

const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({
  activeTenantId,
  allTenants,
  setActiveTenant,
  updateTenantById,
  deleteTenant,
  isMaintenanceMode,
  setMaintenanceMode,
  exchangeRate,
  setExchangeRate,
  syncBcvRate,
  isLoading,
  taxes,
  instances,
  syncInstances,
  isMaster,
}) => {
  const { updateConfig, approvalRules, taxes: systemTaxes } = useSystemConfig();
  const [isEditTenantOpen, setIsEditTenantOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<any>(null);
  const [isDeleteTenantOpen, setIsDeleteTenantOpen] = React.useState(false);

  // Usar taxes de props si existe, sino usar del sistema, sino usar DEFAULT_TAXES
  const taxesConfig = taxes || systemTaxes || DEFAULT_TAXES;
  
  // Asegurar que instances y approvalRules sean arrays
  const safeInstances = instances || [];
  const safeApprovalRules = approvalRules || [];
  const safeTenants = allTenants || [];

  const openEditTenantModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsEditTenantOpen(true);
  };

  const handleUpdateTenant = async (data: any) => {
    if (selectedTenant) {
      try {
        await updateTenantById(selectedTenant.id, data);
        setIsEditTenantOpen(false);
        setSelectedTenant(null);
        toast.success("Empresa actualizada correctamente");
      } catch (error) {
        toast.error("Error al actualizar la empresa");
        console.error(error);
      }
    }
  };

  const handleDeleteTenant = async () => {
    if (selectedTenant) {
      try {
        await deleteTenant(selectedTenant.id);
        setIsDeleteTenantOpen(false);
        setSelectedTenant(null);
        toast.success("Empresa eliminada correctamente");
      } catch (error) {
        toast.error("Error al eliminar la empresa");
        console.error(error);
      }
    }
  };

  return (
    <>
    <div className="space-y-6">
      {/* Modo Mantenimiento */}
      <SettingsCard
        title="Modo Mantenimiento"
        description="Controla el acceso al sistema durante actualizaciones o mantenimiento."
        icon={<ShieldAlert className="w-5 h-5" />}
      >
        <div className="flex items-center justify-between p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
          <div className="space-y-0.5">
            <Label className="text-amber-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Modo Mantenimiento Global
            </Label>
            <p className="text-xs text-amber-600/80">
              Bloquea el acceso a todos los módulos excepto para administradores
              maestros.
            </p>
          </div>
          <Switch
            checked={isMaintenanceMode}
            onCheckedChange={setMaintenanceMode}
            className="data-[state=checked]:bg-amber-600"
          />
        </div>
      </SettingsCard>

      {/* Feature Flags */}
      <SettingsCard
        title="Control de Módulos (Feature Flags)"
        description="Habilita o deshabilita módulos funcionales a nivel global. Usa el Core ABAC (Attribute-Based Access Control)."
        icon={<ShieldCheck className="w-5 h-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ConfigToggle
            label="Módulo Financiero (Contabilidad)"
            description="Activa el motor de Cuentas y Transacciones."
            checked={true}
            onCheckedChange={(val) => {
              if (window.electronAPI?.saveConfig) {
                window.electronAPI.saveConfig(
                  "module_finance_enabled",
                  val ? "1" : "0",
                );
              }
              toast.success(
                `Módulo de Finanzas ${val ? "habilitado" : "deshabilitado"} globalmente.`,
              );
            }}
          />
          <ConfigToggle
            label="Integración de SMS (Notificaciones)"
            description="Permite el dispatch multicanal de alertas."
            checked={true}
            onCheckedChange={(val) => {
              if (window.electronAPI?.saveConfig) {
                window.electronAPI.saveConfig(
                  "module_sms_enabled",
                  val ? "1" : "0",
                );
              }
              toast.success(
                `Canal SMS ${val ? "habilitado" : "deshabilitado"} globalmente.`,
              );
            }}
          />
          <ConfigToggle
            label="Módulo de Producción (MRP)"
            description="Acceso a fórmulas y órdenes de ensamblaje."
            checked={false}
            onCheckedChange={(val) => {
              if (window.electronAPI?.saveConfig) {
                window.electronAPI.saveConfig(
                  "module_production_enabled",
                  val ? "1" : "0",
                );
              }
              toast.success(
                `Módulo de Producción ${val ? "habilitado" : "deshabilitado"} globalmente.`,
              );
            }}
          />
        </div>
      </SettingsCard>

      {/* Arquitectura de Red */}
      <SettingsCard
        title="Arquitectura de Red (Instancia)"
        description="Información sobre las instancias conectadas al sistema."
        icon={<Monitor className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <Label className="text-sm font-bold flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            Monitor de Instancias Conectadas: {safeInstances.length}
          </Label>
          {safeInstances.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground bg-muted/20">
              No hay instancias conectadas actualmente.
            </div>
          ) : (
            <div className="grid gap-3">
              {safeInstances.map((instance: any) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {instance.name || "Instancia"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {instance.ip || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {instance.last_sync
                      ? new Date(instance.last_sync).toLocaleTimeString()
                      : "Nunca"}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={syncInstances}
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar Instancias
          </Button>
        </div>
      </SettingsCard>

      {/* Motor de Workflows */}
      <SettingsCard
        title="Motor de Workflows (No-Code)"
        description="Define reglas de aprobación automáticas."
        icon={<GitBranch className="w-5 h-5" />}
        accent="amber"
      >
        <div className="space-y-3">
          {safeApprovalRules.map((rule: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold">{rule.rule_name}</span>
                <span className="opacity-60 italic">
                  Si {rule.condition.field} {rule.condition.operator}{" "}
                  {rule.condition.value} USD → Aprobación {rule.action.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full border-dashed gap-2 text-xs py-5"
          >
            <Plus className="h-4 w-4" /> Nueva Regla de Negocio
          </Button>
        </div>
      </SettingsCard>

      {/* Personalización de Tablas */}
      <SettingsCard
        title="Personalización Dinámica de Tablas"
        description="Modifica qué columnas son visibles en tiempo real."
        icon={<Settings2 className="w-5 h-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium">Editar Encabezados</span>
            <Button variant="outline" size="sm">
              Abrir Editor
            </Button>
          </div>
          <div className="p-4 rounded-xl border bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium">UDF (Custom Fields)</span>
            <Button variant="outline" size="sm">
              Añadir Campo
            </Button>
          </div>
          <div className="p-4 rounded-xl border bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium">Visibilidad de Pestañas</span>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>
        </div>
      </SettingsCard>
    </div>

    {/* Dialog para editar empresa */}
    <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Actualiza la información de la empresa seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <TenantSetupForm
              initialData={selectedTenant}
              onSubmit={handleUpdateTenant}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para eliminar empresa */}
      <AlertDialog open={isDeleteTenantOpen} onOpenChange={setIsDeleteTenantOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la empresa{" "}
              <span className="font-bold">{selectedTenant?.name}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="rounded-full bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemConfigPanel;
