/**
 * CustomerFormValery - Formulario de clientes usando ValeryForm
 * Ejemplo de implementación del componente ValeryForm
 */

import React from 'react';
import { ValeryForm, ValeryFormSection } from '@/components/forms/ValeryForm';
import { toast } from 'sonner';

interface Customer {
  id?: string;
  nombre: string;
  rif: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  tipo: 'natural' | 'juridica';
  contacto?: string;
}

interface CustomerFormValeryProps {
  customer?: Customer;
  onSave: (customer: Customer) => Promise<void>;
  onCancel: () => void;
}

export const CustomerFormValery: React.FC<CustomerFormValeryProps> = ({
  customer,
  onSave,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [tipoCliente, setTipoCliente] = React.useState<'natural' | 'juridica'>(
    customer?.tipo || 'natural'
  );

  const handleSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await onSave(data as Customer);
      toast.success(customer ? 'Cliente actualizado' : 'Cliente creado exitosamente');
    } catch (error) {
      toast.error('Error al guardar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const sections: ValeryFormSection[] = [
    {
      title: 'Información General',
      fields: [
        {
          name: 'tipo',
          label: 'Tipo de Cliente',
          type: 'select',
          value: customer?.tipo || 'natural',
          required: true,
          options: [
            { value: 'natural', label: 'Persona Natural' },
            { value: 'juridica', label: 'Persona Jurídica' },
          ],
          onChange: (value) => setTipoCliente(value as 'natural' | 'juridica'),
        },
        {
          name: 'nombre',
          label: tipoCliente === 'juridica' ? 'Razón Social' : 'Nombre Completo',
          type: 'text',
          value: customer?.nombre,
          placeholder: tipoCliente === 'juridica' ? 'Empresa C.A.' : 'Juan Pérez',
          required: true,
        },
        {
          name: 'rif',
          label: tipoCliente === 'juridica' ? 'RIF' : 'Cédula',
          type: 'text',
          value: customer?.rif,
          placeholder: tipoCliente === 'juridica' ? 'J-12345678-9' : 'V-12345678',
          required: true,
        },
      ],
    },
    {
      title: 'Información de Contacto',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          value: customer?.email,
          placeholder: 'correo@ejemplo.com',
          required: true,
        },
        {
          name: 'telefono',
          label: 'Teléfono',
          type: 'text',
          value: customer?.telefono,
          placeholder: '+58 412 1234567',
          required: true,
        },
        ...(tipoCliente === 'juridica'
          ? [
              {
                name: 'contacto',
                label: 'Persona de Contacto',
                type: 'text' as const,
                value: customer?.contacto,
                placeholder: 'Nombre del contacto',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Dirección',
      fields: [
        {
          name: 'direccion',
          label: 'Dirección',
          type: 'textarea',
          value: customer?.direccion,
          placeholder: 'Ingrese la dirección completa',
          rows: 3,
          required: true,
        },
        {
          name: 'ciudad',
          label: 'Ciudad',
          type: 'select',
          value: customer?.ciudad,
          required: true,
          options: [
            { value: 'caracas', label: 'Caracas' },
            { value: 'valencia', label: 'Valencia' },
            { value: 'maracay', label: 'Maracay' },
            { value: 'barquisimeto', label: 'Barquisimeto' },
            { value: 'maracaibo', label: 'Maracaibo' },
            { value: 'barcelona', label: 'Barcelona' },
            { value: 'puerto-la-cruz', label: 'Puerto La Cruz' },
            { value: 'merida', label: 'Mérida' },
          ],
        },
      ],
    },
  ];

  return (
    <ValeryForm
      title={customer ? 'Editar Cliente' : 'Nuevo Cliente'}
      sections={sections}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel={customer ? 'Actualizar' : 'Guardar'}
      cancelLabel="Cancelar"
      isLoading={isLoading}
    />
  );
};

export default CustomerFormValery;
