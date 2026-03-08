# 📚 Componentes Estilo Valery

Documentación completa de los componentes de formularios y tablas estilo Valery Profesional.

---

## 📝 ValeryForm

Componente de formulario con diseño clásico: labels a la izquierda, campos a la derecha.

### Características

- ✅ Layout clásico (label izquierda, campo derecha)
- ✅ Secciones organizadas
- ✅ Validación de campos requeridos
- ✅ Soporte para múltiples tipos de campos
- ✅ Botones de acción personalizables
- ✅ Estado de carga
- ✅ Responsive design

### Tipos de Campos Soportados

- `text` - Campo de texto
- `number` - Campo numérico
- `email` - Campo de email
- `password` - Campo de contraseña
- `date` - Selector de fecha
- `textarea` - Área de texto
- `select` - Lista desplegable

### Ejemplo Básico

```tsx
import { ValeryForm } from '@/components/forms/ValeryForm';

function MiFormulario() {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Datos del formulario:', data);
  };

  return (
    <ValeryForm
      title="Nuevo Cliente"
      sections={[
        {
          title: 'Información General',
          fields: [
            {
              name: 'nombre',
              label: 'Nombre',
              type: 'text',
              placeholder: 'Ingrese el nombre',
              required: true,
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'correo@ejemplo.com',
              required: true,
            },
            {
              name: 'telefono',
              label: 'Teléfono',
              type: 'text',
              placeholder: '+58 412 1234567',
            },
          ],
        },
        {
          title: 'Dirección',
          fields: [
            {
              name: 'direccion',
              label: 'Dirección',
              type: 'textarea',
              placeholder: 'Ingrese la dirección completa',
              rows: 3,
            },
            {
              name: 'ciudad',
              label: 'Ciudad',
              type: 'select',
              options: [
                { value: 'caracas', label: 'Caracas' },
                { value: 'valencia', label: 'Valencia' },
                { value: 'maracay', label: 'Maracay' },
              ],
              required: true,
            },
          ],
        },
      ]}
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancelado')}
      submitLabel="Guardar Cliente"
      cancelLabel="Cancelar"
    />
  );
}
```

### Ejemplo con Estado de Carga

```tsx
function FormularioConCarga() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      await api.guardarCliente(data);
      toast.success('Cliente guardado exitosamente');
    } catch (error) {
      toast.error('Error al guardar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ValeryForm
      title="Nuevo Cliente"
      sections={[...]}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
```

### Ejemplo con Valores Iniciales

```tsx
function FormularioEdicion({ cliente }) {
  return (
    <ValeryForm
      title="Editar Cliente"
      sections={[
        {
          fields: [
            {
              name: 'nombre',
              label: 'Nombre',
              type: 'text',
              value: cliente.nombre, // Valor inicial
              required: true,
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              value: cliente.email, // Valor inicial
              required: true,
            },
          ],
        },
      ]}
      onSubmit={handleSubmit}
    />
  );
}
```

### Ejemplo con onChange Personalizado

```tsx
function FormularioConLogica() {
  const [mostrarCampoAdicional, setMostrarCampoAdicional] = useState(false);

  return (
    <ValeryForm
      sections={[
        {
          fields: [
            {
              name: 'tipo',
              label: 'Tipo de Cliente',
              type: 'select',
              options: [
                { value: 'natural', label: 'Persona Natural' },
                { value: 'juridica', label: 'Persona Jurídica' },
              ],
              onChange: (value) => {
                setMostrarCampoAdicional(value === 'juridica');
              },
            },
            ...(mostrarCampoAdicional
              ? [
                  {
                    name: 'rif',
                    label: 'RIF',
                    type: 'text',
                    placeholder: 'J-12345678-9',
                    required: true,
                  },
                ]
              : []),
          ],
        },
      ]}
      onSubmit={handleSubmit}
    />
  );
}
```

---

## 📊 ValeryTable

Componente de tabla/grilla con diseño clásico: bordes visibles, headers destacados, acciones por fila.

### Características

- ✅ Diseño clásico con bordes
- ✅ Headers destacados
- ✅ Búsqueda integrada
- ✅ Paginación automática
- ✅ Acciones por fila (dropdown)
- ✅ Columnas personalizables
- ✅ Renderizado custom por columna
- ✅ Responsive design

### Ejemplo Básico

```tsx
import { ValeryTable } from '@/components/tables/ValeryTable';
import { Edit, Trash2, Eye } from 'lucide-react';

function TablaClientes() {
  const clientes = [
    { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', telefono: '0412-1234567' },
    { id: 2, nombre: 'María García', email: 'maria@ejemplo.com', telefono: '0414-7654321' },
  ];

  return (
    <ValeryTable
      title="Listado de Clientes"
      columns={[
        { key: 'id', label: 'ID', width: '80px', align: 'center' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'telefono', label: 'Teléfono' },
      ]}
      data={clientes}
      actions={[
        {
          label: 'Ver',
          icon: Eye,
          onClick: (row) => console.log('Ver', row),
        },
        {
          label: 'Editar',
          icon: Edit,
          onClick: (row) => console.log('Editar', row),
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          variant: 'destructive',
          onClick: (row) => console.log('Eliminar', row),
        },
      ]}
    />
  );
}
```

### Ejemplo con Renderizado Custom

```tsx
import { Badge } from '@/shared/components/ui/badge';

function TablaFacturas() {
  return (
    <ValeryTable
      title="Facturas"
      columns={[
        { key: 'numero', label: 'Número', width: '120px' },
        { key: 'cliente', label: 'Cliente' },
        {
          key: 'total',
          label: 'Total',
          align: 'right',
          render: (value) => `$${value.toFixed(2)}`,
        },
        {
          key: 'status',
          label: 'Estado',
          align: 'center',
          render: (value) => (
            <Badge variant={value === 'pagada' ? 'default' : 'destructive'}>
              {value}
            </Badge>
          ),
        },
      ]}
      data={facturas}
    />
  );
}
```

### Ejemplo con Paginación Controlada

```tsx
function TablaConPaginacion() {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const pageSize = 10;

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage]);

  return (
    <ValeryTable
      columns={[...]}
      data={data}
      pagination={true}
      pageSize={pageSize}
      currentPage={currentPage}
      totalPages={Math.ceil(totalRecords / pageSize)}
      onPageChange={setCurrentPage}
    />
  );
}
```

### Ejemplo con Búsqueda Controlada

```tsx
function TablaConBusqueda() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = data.filter((item) =>
      item.nombre.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  return (
    <ValeryTable
      columns={[...]}
      data={filteredData}
      searchable={true}
      searchPlaceholder="Buscar por nombre..."
      onSearch={handleSearch}
    />
  );
}
```

### Ejemplo con Acciones Condicionales

```tsx
function TablaConAccionesCondicionales() {
  return (
    <ValeryTable
      columns={[...]}
      data={facturas}
      actions={[
        {
          label: 'Ver',
          icon: Eye,
          onClick: (row) => verFactura(row),
        },
        {
          label: 'Editar',
          icon: Edit,
          onClick: (row) => editarFactura(row),
          show: (row) => row.status !== 'pagada', // Solo si no está pagada
        },
        {
          label: 'Anular',
          icon: Trash2,
          variant: 'destructive',
          onClick: (row) => anularFactura(row),
          show: (row) => row.status === 'pendiente', // Solo si está pendiente
        },
      ]}
    />
  );
}
```

### Ejemplo con Header Actions

```tsx
import { Plus, Download } from 'lucide-react';

function TablaConHeaderActions() {
  return (
    <ValeryTable
      title="Productos"
      columns={[...]}
      data={productos}
      headerActions={
        <div className="flex gap-2">
          <Button size="sm" onClick={exportarExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={nuevoProducto}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        </div>
      }
    />
  );
}
```

---

## 🎨 Estilos Valery

### Características Visuales

#### Formularios
- Labels alineados a la derecha en desktop
- Campos ocupan 3/4 del ancho
- Secciones con títulos destacados
- Bordes y separadores claros
- Botones de acción al final

#### Tablas
- Bordes visibles en todas las celdas
- Header con fondo destacado
- Hover effect en filas
- Acciones en dropdown
- Paginación con controles completos

### Colores y Tipografía

```css
/* Headers */
font-weight: bold;
text-transform: uppercase;
color: primary;

/* Bordes */
border: 1px solid border;

/* Backgrounds */
header: bg-muted/50;
hover: bg-muted/30;
```

---

## 📦 Integración con Sistema Existente

### Reemplazar Formulario Existente

**Antes:**
```tsx
<form onSubmit={handleSubmit}>
  <div>
    <label>Nombre</label>
    <input type="text" name="nombre" />
  </div>
  <button type="submit">Guardar</button>
</form>
```

**Después:**
```tsx
<ValeryForm
  sections={[
    {
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      ],
    },
  ]}
  onSubmit={handleSubmit}
/>
```

### Reemplazar Tabla Existente

**Antes:**
```tsx
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map((item) => (
      <tr key={item.id}>
        <td>{item.nombre}</td>
        <td>{item.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**Después:**
```tsx
<ValeryTable
  columns={[
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
  ]}
  data={data}
/>
```

---

## ✅ Checklist de Implementación

### Para Formularios
- [ ] Identificar formularios existentes
- [ ] Mapear campos a ValeryFormField
- [ ] Agrupar en secciones lógicas
- [ ] Implementar validación
- [ ] Agregar manejo de errores
- [ ] Probar en mobile

### Para Tablas
- [ ] Identificar tablas existentes
- [ ] Mapear columnas a ValeryTableColumn
- [ ] Definir acciones necesarias
- [ ] Implementar búsqueda si es necesario
- [ ] Configurar paginación
- [ ] Probar en mobile

---

## 🚀 Próximos Pasos

1. Aplicar ValeryForm a módulos principales
2. Aplicar ValeryTable a listados principales
3. Crear variantes especializadas si es necesario
4. Documentar casos de uso específicos
5. Optimizar rendimiento

---

**Fecha:** 2026-03-06  
**Versión:** 1.0  
**Estado:** ✅ Componentes Listos para Usar
