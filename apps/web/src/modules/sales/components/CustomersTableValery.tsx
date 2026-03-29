/**
 * CustomersTableValery - Tabla de clientes usando ValeryTable
 * Ejemplo de implementación del componente ValeryTable
 */

import React from 'react';
import { ValeryTable, ValeryTableColumn, ValeryTableAction } from '@/components/tables/ValeryTable';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Edit, Trash2, Eye, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  nombre: string;
  rif: string;
  email: string;
  telefono: string;
  ciudad: string;
  tipo: 'natural' | 'juridica';
  created_at: string;
}

interface CustomersTableValeryProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onNew: () => void;
  onExport?: () => void;
}

export const CustomersTableValery: React.FC<CustomersTableValeryProps> = ({
  customers,
  onView,
  onEdit,
  onDelete,
  onNew,
  onExport,
}) => {
  const columns: ValeryTableColumn[] = [
    {
      key: 'rif',
      label: 'RIF/Cédula',
      width: '140px',
    },
    {
      key: 'nombre',
      label: 'Nombre/Razón Social',
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: '120px',
      align: 'center',
      render: (value: string) => (
        <Badge variant={value === 'juridica' ? 'default' : 'secondary'}>
          {value === 'juridica' ? 'Jurídica' : 'Natural'}
        </Badge>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: '200px',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      width: '140px',
    },
    {
      key: 'ciudad',
      label: 'Ciudad',
      width: '140px',
      render: (value: string) => {
        const ciudades: Record<string, string> = {
          caracas: 'Caracas',
          valencia: 'Valencia',
          maracay: 'Maracay',
          barquisimeto: 'Barquisimeto',
          maracaibo: 'Maracaibo',
          barcelona: 'Barcelona',
          'puerto-la-cruz': 'Puerto La Cruz',
          merida: 'Mérida',
        };
        return ciudades[value] || value;
      },
    },
  ];

  const actions: ValeryTableAction[] = [
    {
      label: 'Ver Detalles',
      icon: Eye,
      onClick: onView,
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      onClick: (customer) => {
        if (confirm(`¿Está seguro de eliminar al cliente ${customer.nombre}?`)) {
          onDelete(customer);
          toast.success('Cliente eliminado exitosamente');
        }
      },
    },
  ];

  const headerActions = (
    <div className="flex gap-2">
      {onExport && (
        <Button size="sm" variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      )}
      <Button size="sm" onClick={onNew}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Cliente
      </Button>
    </div>
  );

  return (
    <ValeryTable
      title="Listado de Clientes"
      columns={columns}
      data={customers}
      actions={actions}
      searchable={true}
      searchPlaceholder="Buscar por nombre, RIF, email..."
      pagination={true}
      pageSize={10}
      emptyMessage="No hay clientes registrados"
      headerActions={headerActions}
    />
  );
};

export default CustomersTableValery;
