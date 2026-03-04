import { Shield, Download, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { CardDescription } from "@/shared/components/ui/card";
import { EmployeeForm } from "@/shared/components/common/Forms";
import { HRLogic } from "@/features/hr/hooks/useHRLogic";

interface HRHeaderProps {
  logic: HRLogic;
}

export function HRHeader({ logic }: HRHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestión Humana (LOTTT)
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Nómina, prestaciones sociales y expedientes conforme a la legislación
          venezolana.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="hidden md:flex shadow-sm"
          onClick={logic.handleExportReport}
        >
          <Download className="mr-2 h-4 w-4" />
          Reportes
        </Button>
        {logic.canManageHR && (
          <Dialog
            open={logic.isAddDialogOpen}
            onOpenChange={logic.setIsAddDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <UserPlus className="mr-2 h-4 w-4" />
                Añadir Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registro de Nuevo Personal</DialogTitle>
                <CardDescription>
                  Ingrese los datos del expediente laboral del colaborador.
                </CardDescription>
              </DialogHeader>
              <EmployeeForm onSubmit={logic.handleAddEmployee} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
