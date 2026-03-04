import {
  Plus,
  Search,
  Download,
  Upload,
  ImageIcon,
  Layers,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  FileText,
  Box,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGES } from "@/assets/images";
import { ProductForm } from "@/shared/components/common/Forms";

interface InventoryHeaderProps {
  logic: any; // Using the hook return type
  activeTab?: string; // Add activeTab prop
}

export const InventoryHeader = ({ logic, activeTab }: InventoryHeaderProps) => {
  // Only show action buttons in the "stock" (Inventario) tab
  const showActionButtons = activeTab === "stock" || !activeTab;
  
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 opacity-5">
        <img src={IMAGES.OFFICE_WORKSPACE_2} alt="BG" className="w-[300px]" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Inventario Maestro
        </h1>
        <p className="text-muted-foreground">
          Sistema centralizado Cauplas - Torflex - Indomax - OEM
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showActionButtons && (
          <>
            <input
              type="file"
              ref={logic.fileInputRef}
              onChange={logic.handleImport}
              className="hidden"
              accept=".xlsx, .xls, .csv"
            />
            <input
              type="file"
              ref={logic.photoInputRef}
              onChange={(e) =>
                e.target.files && logic.processPhotos(e.target.files)
              }
              className="hidden"
              accept="image/*"
              multiple
            />
            <input
              type="file"
              ref={logic.folderInputRef}
              onChange={(e) =>
                e.target.files && logic.processPhotos(e.target.files)
              }
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
            />
          </>
        )}

        {showActionButtons && logic.canManageInventory && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full shadow-sm gap-2"
              onClick={() => logic.fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 text-primary" />
              Importar Excel
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full shadow-sm gap-2"
                  disabled={logic.isPhotoImporting}
                >
                  <ImageIcon
                    className={cn(
                      "w-4 h-4 text-emerald-500",
                      logic.isPhotoImporting && "animate-pulse",
                    )}
                  />
                  {logic.isPhotoImporting ? "Procesando..." : "Importar Fotos"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Importar Fotos de Productos</DialogTitle>
                  <DialogDescription>
                    Asigna imágenes automáticamente por código de archivo.
                    Límite de 3 por item.
                  </DialogDescription>
                </DialogHeader>
                
                {logic.isPhotoImporting ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
                      <div className="absolute top-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-emerald-600">Procesando fotos...</p>
                      <p className="text-sm text-muted-foreground">Por favor espera</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                      variant="ghost"
                      className="flex flex-col h-28 gap-3 border-2 border-dashed border-muted hover:border-emerald-500/50 hover:bg-emerald-50/50"
                      onClick={() => logic.photoInputRef.current?.click()}
                    >
                      <Plus className="w-8 h-8 text-emerald-600" />
                      <div className="text-center">
                        <div className="text-sm font-bold">Individual</div>
                        <div className="text-[10px] text-muted-foreground">
                          Seleccionar archivos
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex flex-col h-28 gap-3 border-2 border-dashed border-muted hover:border-blue-500/50 hover:bg-blue-50/50"
                      onClick={() => logic.folderInputRef.current?.click()}
                    >
                      <Box className="w-8 h-8 text-blue-600" />
                      <div className="text-center">
                        <div className="text-sm font-bold">Carpeta Bulk</div>
                        <div className="text-[10px] text-muted-foreground">
                          Procesar directorio
                        </div>
                      </div>
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50",
                logic.isCleaning && "animate-spin",
              )}
              title="Limpiar Duplicados"
              onClick={logic.handleDeduplicate}
              disabled={logic.isCleaning}
            >
              <Layers className="w-4 h-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Reiniciar Inventario"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Estás completamente seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todos los productos del inventario
                    actual de forma permanente. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logic.handleClear}
                    className="bg-destructive hover:bg-destructive/90 text-white"
                  >
                    Eliminar Todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {showActionButtons && logic.canExport && (
          <Dialog
            open={logic.isExportOpen}
            onOpenChange={logic.setIsExportOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full shadow-sm gap-2"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                Exportar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Seleccionar Formato de Exportación</DialogTitle>
                <DialogDescription>
                  Elige el formato en el que deseas descargar el inventario
                  actual.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 py-4">
                <Button
                  variant="ghost"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => logic.handleExport("xlsx")}
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <span className="text-xs font-bold">EXCEL (.xlsx)</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => logic.handleExport("csv")}
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <span className="text-xs font-bold">CSV (.csv)</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col h-24 gap-2"
                  onClick={() => logic.handleExport("json")}
                >
                  <FileJson className="w-8 h-8 text-amber-600" />
                  <span className="text-xs font-bold">JSON (.json)</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {showActionButtons && logic.canManageInventory && (
          <Dialog
            open={logic.isFormOpen}
            onOpenChange={(open) => {
              logic.setIsFormOpen(open);
              if (!open) logic.setSelectedProduct(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:opacity-90"
                onClick={() => {
                  logic.setSelectedProduct(undefined);
                  logic.setIsFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {logic.selectedProduct
                    ? "Editar Producto"
                    : "Añadir Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                initialData={logic.selectedProduct}
                onSubmit={async (data) => {
                  if (logic.selectedProduct) {
                    await logic.updateProduct(logic.selectedProduct.id, data);
                  } else {
                    await logic.addProduct(data);
                  }
                  logic.setIsFormOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
};
