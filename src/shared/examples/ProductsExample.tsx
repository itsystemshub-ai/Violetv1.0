/**
 * Example component showing how to use API components
 * This demonstrates best practices for API integration
 */

import React, { useState } from 'react';
import { api } from '@/api';
import { useApi } from "@/core/api/hooks/useApi";
import { ApiDataTable, Column, StatusBadge, CurrencyCell } from "@/shared/components/common/ApiDataTable";
import { ApiForm, FormField } from "@/shared/components/common/ApiForm";
import { Product } from '@/lib';
import { Button } from "@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsExample() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch products
  const {
    data: products,
    loading,
    error,
    execute: fetchProducts,
  } = useApi<Product[]>();

  // Create/Update product
  const {
    loading: isSaving,
    error: saveError,
    execute: saveProduct,
  } = useApi<Product>();

  // Delete product
  const {
    loading: isDeleting,
    execute: deleteProduct,
  } = useApi<void>();

  // Load products on mount
  React.useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id') || 'default';
    fetchProducts(() => api.products.getAll(tenantId));
  }, [fetchProducts]);

  // Table columns definition
  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Producto',
      render: (product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      render: (product) => <CurrencyCell amount={product.price} />,
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{product.stock}</span>
          <StatusBadge
            status={product.status}
            variant={
              product.status === 'disponible'
                ? 'default'
                : product.status === 'poco_stock'
                ? 'outline'
                : 'destructive'
            }
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (product) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Form fields definition
  const formFields: FormField[] = [
    {
      name: 'name',
      label: 'Nombre del Producto',
      type: 'text',
      required: true,
      placeholder: 'Ej: Laptop Dell XPS 15',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción detallada del producto',
    },
    {
      name: 'category',
      label: 'Categoría',
      type: 'select',
      required: true,
      options: [
        { value: 'electronics', label: 'Electrónica' },
        { value: 'clothing', label: 'Ropa' },
        { value: 'food', label: 'Alimentos' },
        { value: 'other', label: 'Otros' },
      ],
    },
    {
      name: 'price',
      label: 'Precio',
      type: 'number',
      required: true,
      validation: (value) => {
        if (Number(value) <= 0) {
          return 'El precio debe ser mayor a 0';
        }
        return null;
      },
    },
    {
      name: 'cost',
      label: 'Costo',
      type: 'number',
      required: true,
    },
    {
      name: 'stock',
      label: 'Stock Inicial',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'minStock',
      label: 'Stock Mínimo',
      type: 'number',
      required: true,
      defaultValue: 5,
    },
    {
      name: 'unit',
      label: 'Unidad',
      type: 'select',
      required: true,
      options: [
        { value: 'unidad', label: 'Unidad' },
        { value: 'kg', label: 'Kilogramo' },
        { value: 'litro', label: 'Litro' },
        { value: 'metro', label: 'Metro' },
      ],
    },
  ];

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 'default';
      await saveProduct(() =>
        api.products.create({
          ...data,
          tenant_id: tenantId,
          status: 'disponible',
          warehouseId: 'default',
          images: [],
        } as Omit<Product, 'id'>)
      );

      toast.success('Producto creado exitosamente');
      setIsCreateOpen(false);
      
      // Refresh products list
      fetchProducts(() => api.products.getAll(tenantId));
    } catch (err) {
      toast.error('Error al crear producto');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!selectedProduct) return;

    try {
      await saveProduct(() =>
        api.products.update(selectedProduct.id, data as Partial<Product>)
      );

      toast.success('Producto actualizado exitosamente');
      setSelectedProduct(null);
      
      // Refresh products list
      const tenantId = localStorage.getItem('tenant_id') || 'default';
      fetchProducts(() => api.products.getAll(tenantId));
    } catch (err) {
      toast.error('Error al actualizar producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
      return;
    }

    try {
      await deleteProduct(() => api.products.delete(id));
      toast.success('Producto eliminado exitosamente');
      
      // Refresh products list
      const tenantId = localStorage.getItem('tenant_id') || 'default';
      fetchProducts(() => api.products.getAll(tenantId));
    } catch (err) {
      toast.error('Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Productos</h2>
          <p className="text-muted-foreground">
            Gestiona tu inventario de productos
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Producto</DialogTitle>
            </DialogHeader>
            <ApiForm
              fields={formFields}
              onSubmit={handleCreate}
              loading={isSaving}
              error={saveError}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ApiDataTable
        data={products}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={() => {
          const tenantId = localStorage.getItem('tenant_id') || 'default';
          fetchProducts(() => api.products.getAll(tenantId));
        }}
        emptyMessage="No hay productos registrados"
      />

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ApiForm
              fields={formFields}
              onSubmit={handleUpdate}
              loading={isSaving}
              error={saveError}
              initialData={selectedProduct}
              onCancel={() => setSelectedProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
