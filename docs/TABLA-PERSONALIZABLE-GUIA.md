# Guía de Uso: Sistema de Tablas Personalizables

## 📋 Descripción

Sistema completo para personalizar encabezados, visibilidad y alineación de columnas en tablas sin necesidad de modificar código. Los cambios se guardan automáticamente y persisten entre sesiones.

## 🎯 Características

- ✅ Editar encabezados de columnas visualmente
- ✅ Mostrar/ocultar columnas con un switch
- ✅ Cambiar alineación (izquierda, centro, derecha)
- ✅ Reordenar columnas (drag & drop - próximamente)
- ✅ Restaurar configuración por defecto
- ✅ Cambios automáticos sin recargar
- ✅ Configuración persistente (localStorage)

## 🚀 Cómo Usar el Editor

### Paso 1: Abrir el Editor
1. Ve a **Configuración > Sistema**
2. Busca la sección **"Personalización Dinámica de Tablas"**
3. Haz clic en **"Abrir Editor"**

### Paso 2: Seleccionar Tabla
En el editor, selecciona la tabla que quieres personalizar:
- Inventario (Productos)
- Ventas (Facturas)
- Clientes
- Proveedores
- Empleados

### Paso 3: Personalizar Columnas

#### Cambiar Encabezado
1. Haz clic en el ícono de lápiz junto al nombre de la columna
2. Escribe el nuevo encabezado
3. Presiona Enter o haz clic en el check verde

#### Mostrar/Ocultar Columna
- Usa el switch a la derecha de cada columna
- El ícono de ojo indica si está visible u oculta

#### Cambiar Alineación
- Haz clic en los botones de alineación (izquierda, centro, derecha)
- Útil para números (derecha) o texto (izquierda)

#### Restaurar Valores por Defecto
- Haz clic en el botón **"Restaurar"** en la parte superior
- Esto restablece todos los encabezados y configuraciones originales

## 💻 Implementación en Código

### Opción 1: Usar ConfigurableTable (Recomendado)

```tsx
import { ConfigurableTable } from '@/shared/components/tables/ConfigurableTable';

// En tu componente
<ConfigurableTable
  tableName="products"
  data={products}
  renderCell={(product, columnId) => {
    switch (columnId) {
      case 'code':
        return product.code;
      case 'name':
        return product.name;
      case 'price':
        return `$${product.price.toFixed(2)}`;
      case 'stock':
        return product.stock;
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button size="sm">Editar</Button>
            <Button size="sm" variant="destructive">Eliminar</Button>
          </div>
        );
      default:
        return null;
    }
  }}
/>
```

### Opción 2: Usar el Hook Directamente

```tsx
import { useTableColumns } from '@/hooks/useTableColumns';

function ProductsTable() {
  const { columns, getColumnAlign } = useTableColumns('products');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={column.align === 'right' ? 'text-right' : ''}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                className={column.align === 'right' ? 'text-right' : ''}
              >
                {/* Renderizar según column.id */}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## 📝 Agregar Nueva Tabla

Para agregar una nueva tabla al sistema:

### 1. Agregar Configuración por Defecto

Edita `src/stores/tableConfigStore.ts`:

```typescript
export const DEFAULT_TABLE_CONFIGS: TableConfig = {
  // ... tablas existentes
  
  mi_nueva_tabla: [
    { id: 'id', label: 'ID', visible: true, order: 0, align: 'left' },
    { id: 'nombre', label: 'Nombre', visible: true, order: 1, align: 'left' },
    { id: 'fecha', label: 'Fecha', visible: true, order: 2, align: 'center' },
    { id: 'monto', label: 'Monto', visible: true, order: 3, align: 'right' },
    { id: 'acciones', label: 'Acciones', visible: true, order: 4, align: 'center' },
  ],
};
```

### 2. Agregar al Selector del Editor

Edita `src/modules/settings/components/organisms/TableColumnEditor.tsx`:

```typescript
const AVAILABLE_TABLES = [
  // ... tablas existentes
  { id: 'mi_nueva_tabla', name: 'Mi Nueva Tabla' },
];
```

### 3. Usar en tu Componente

```tsx
import { ConfigurableTable } from '@/shared/components/tables/ConfigurableTable';

<ConfigurableTable
  tableName="mi_nueva_tabla"
  data={misDatos}
  renderCell={(item, columnId) => {
    // Tu lógica de renderizado
  }}
/>
```

## 🎨 Ejemplos de Uso

### Tabla de Productos con Badges

```tsx
<ConfigurableTable
  tableName="products"
  data={products}
  renderCell={(product, columnId) => {
    switch (columnId) {
      case 'status':
        return (
          <Badge variant={product.active ? 'default' : 'secondary'}>
            {product.active ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      case 'stock':
        return (
          <span className={product.stock < 10 ? 'text-red-500' : ''}>
            {product.stock}
          </span>
        );
      default:
        return product[columnId];
    }
  }}
/>
```

### Tabla de Facturas con Formato de Moneda

```tsx
<ConfigurableTable
  tableName="invoices"
  data={invoices}
  renderCell={(invoice, columnId) => {
    switch (columnId) {
      case 'total':
        return new Intl.NumberFormat('es-VE', {
          style: 'currency',
          currency: 'USD'
        }).format(invoice.total);
      case 'date':
        return new Date(invoice.date).toLocaleDateString('es-VE');
      default:
        return invoice[columnId];
    }
  }}
/>
```

## 🔧 API del Store

### Métodos Disponibles

```typescript
// Actualizar etiqueta de columna
updateColumnLabel(tableName: string, columnId: string, newLabel: string)

// Alternar visibilidad
toggleColumnVisibility(tableName: string, columnId: string)

// Reordenar columnas
reorderColumns(tableName: string, columns: ColumnConfig[])

// Actualizar ancho
updateColumnWidth(tableName: string, columnId: string, width: number)

// Actualizar alineación
updateColumnAlign(tableName: string, columnId: string, align: 'left' | 'center' | 'right')

// Restaurar tabla
resetTable(tableName: string, defaultColumns: ColumnConfig[])

// Obtener configuración
getTableConfig(tableName: string): ColumnConfig[] | undefined
```

## 📊 Estructura de ColumnConfig

```typescript
interface ColumnConfig {
  id: string;           // Identificador único (ej: 'code', 'name')
  label: string;        // Etiqueta visible (ej: 'Código', 'Nombre')
  visible: boolean;     // Si la columna está visible
  order: number;        // Orden de la columna (0, 1, 2...)
  width?: number;       // Ancho en píxeles (opcional)
  align?: 'left' | 'center' | 'right';  // Alineación
}
```

## 💡 Tips y Mejores Prácticas

1. **IDs de Columnas**: Usa IDs descriptivos y en inglés (ej: 'customer_name', 'total_amount')

2. **Labels**: Usa labels en español y descriptivos para el usuario final

3. **Alineación**:
   - Texto: `left`
   - Números/Montos: `right`
   - Estados/Badges: `center`
   - Acciones: `center`

4. **Columnas Esenciales**: Marca como visibles por defecto las columnas más importantes

5. **Orden Lógico**: Ordena las columnas de más a menos importante

6. **Acciones**: Siempre deja la columna de acciones al final

## 🐛 Solución de Problemas

### Las columnas no aparecen
- Verifica que el `tableName` coincida exactamente con el ID en `DEFAULT_TABLE_CONFIGS`
- Asegúrate de que al menos una columna esté visible

### Los cambios no se guardan
- Verifica que el navegador permita localStorage
- Revisa la consola por errores de Zustand

### La tabla se ve rara
- Verifica que todos los `columnId` en `renderCell` coincidan con los IDs configurados
- Asegúrate de manejar todos los casos en el switch de `renderCell`

## 🎯 Próximas Mejoras

- [ ] Drag & drop para reordenar columnas
- [ ] Ajuste de ancho de columnas con resize
- [ ] Exportar/importar configuraciones
- [ ] Plantillas de configuración predefinidas
- [ ] Campos personalizados (UDF)
- [ ] Filtros por columna

## 📞 Soporte

Si tienes problemas o sugerencias, contacta al equipo de desarrollo.
