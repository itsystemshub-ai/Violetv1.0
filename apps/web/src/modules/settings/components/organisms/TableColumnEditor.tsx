/**
 * TableColumnEditor - Editor visual de columnas de tablas
 * Permite personalizar encabezados, visibilidad y orden sin tocar código
 */

import React, { useState } from 'react';
import {
  Table,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/core/shared/utils/utils';
import {
  useTableConfigStore,
  DEFAULT_TABLE_CONFIGS,
  type ColumnConfig,
} from '@/stores/tableConfigStore';

interface TableColumnEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_TABLES = [
  { id: 'products', name: 'Inventario (Productos)' },
  { id: 'invoices', name: 'Ventas (Facturas)' },
  { id: 'orders', name: 'Ventas (Pedidos)' },
  { id: 'customers', name: 'Clientes' },
  { id: 'suppliers', name: 'Proveedores' },
  { id: 'employees', name: 'Empleados (RRHH)' },
];

export const TableColumnEditor: React.FC<TableColumnEditorProps> = ({
  open,
  onOpenChange,
}) => {
  const [selectedTable, setSelectedTable] = useState('products');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const {
    tables,
    updateColumnLabel,
    toggleColumnVisibility,
    updateColumnAlign,
    resetTable,
  } = useTableConfigStore();

  const currentColumns = tables[selectedTable] || [];

  const handleSaveLabel = (columnId: string) => {
    if (editLabel.trim()) {
      updateColumnLabel(selectedTable, columnId, editLabel.trim());
      toast.success('Encabezado actualizado');
    }
    setEditingColumn(null);
    setEditLabel('');
  };

  const handleResetTable = () => {
    const defaultColumns = DEFAULT_TABLE_CONFIGS[selectedTable];
    if (defaultColumns) {
      resetTable(selectedTable, defaultColumns);
      toast.success('Tabla restaurada a valores por defecto');
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    toggleColumnVisibility(selectedTable, columnId);
    const column = currentColumns.find((c) => c.id === columnId);
    toast.success(
      `Columna ${column?.visible ? 'ocultada' : 'mostrada'} correctamente`
    );
  };

  const handleChangeAlign = (columnId: string, align: 'left' | 'center' | 'right') => {
    updateColumnAlign(selectedTable, columnId, align);
    toast.success('Alineación actualizada');
  };

  const visibleCount = currentColumns.filter((c) => c.visible).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Editor de Columnas de Tablas
          </DialogTitle>
          <DialogDescription>
            Personaliza los encabezados, visibilidad y alineación de las columnas
            sin necesidad de modificar código
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Selector de Tabla */}
          <div className="space-y-2">
            <Label>Selecciona la Tabla a Editar</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TABLES.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Eye className="w-3 h-3" />
                {visibleCount} visibles
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <EyeOff className="w-3 h-3" />
                {currentColumns.length - visibleCount} ocultas
              </Badge>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTable}
              className="gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar
            </Button>
          </div>

          <Separator />

          {/* Lista de Columnas */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {currentColumns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  column.visible
                    ? 'bg-card border-border'
                    : 'bg-muted/30 border-dashed opacity-60'
                )}
              >
                {/* Drag Handle */}
                <div className="cursor-move text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Column Info */}
                <div className="flex-1 space-y-1 min-w-0">
                  {editingColumn === column.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Nuevo encabezado"
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLabel(column.id);
                          if (e.key === 'Escape') {
                            setEditingColumn(null);
                            setEditLabel('');
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleSaveLabel(column.id)}
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          setEditingColumn(null);
                          setEditLabel('');
                        }}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {column.label}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => {
                          setEditingColumn(column.id);
                          setEditLabel(column.label);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {column.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Orden: {column.order + 1}
                    </span>
                  </div>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border rounded-md p-1 shrink-0">
                  <Button
                    size="icon"
                    variant={column.align === 'left' ? 'default' : 'ghost'}
                    className="h-7 w-7"
                    onClick={() => handleChangeAlign(column.id, 'left')}
                  >
                    <AlignLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant={column.align === 'center' ? 'default' : 'ghost'}
                    className="h-7 w-7"
                    onClick={() => handleChangeAlign(column.id, 'center')}
                  >
                    <AlignCenter className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant={column.align === 'right' ? 'default' : 'ghost'}
                    className="h-7 w-7"
                    onClick={() => handleChangeAlign(column.id, 'right')}
                  >
                    <AlignRight className="w-3 h-3" />
                  </Button>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={column.visible}
                    onCheckedChange={() => handleToggleVisibility(column.id)}
                  />
                  {column.visible ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Table className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-400">
                  Cambios Automáticos
                </p>
                <p className="text-blue-600/80 dark:text-blue-400/80">
                  Los cambios se guardan automáticamente y se aplicarán en todas
                  las tablas de {AVAILABLE_TABLES.find((t) => t.id === selectedTable)?.name}.
                  No necesitas recargar la página.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableColumnEditor;
