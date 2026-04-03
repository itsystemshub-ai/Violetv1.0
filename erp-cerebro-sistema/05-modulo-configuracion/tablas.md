# Módulo 05: CONFIGURACIÓN - Tablas del Sistema

## Descripción

Gestión de catálogos y tablas maestras del sistema para personalización de parámetros, listas desplegables y valores por defecto.

## 🔗 Conexiones

- **Todos los módulos** → Usan tablas del sistema
- **05-configuracion/sistema** → Parámetros de configuración

---

## 📊 Modelo de Datos

```prisma
model SystemTable {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  items       SystemTableItem[]
}

model SystemTableItem {
  id          String @id @default(cuid())
  tableId     String
  table       SystemTable @relation(fields: [tableId], references: [id])
  code        String
  name        String
  description String?
  color       String?
  icon        String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  extraData   Json?
}
```

---

## 📡 Tablas del Sistema Principales

```typescript
const SYSTEM_TABLES = {
  // Métodos de pago
  PAYMENT_METHODS: {
    code: 'PAYMENT_METHODS',
    items: [
      { code: 'EFECTIVO', name: 'Efectivo' },
      { code: 'TARJETA', name: 'Tarjeta' },
      { code: 'TRANSFERENCIA', name: 'Transferencia' },
      { code: 'ZELLE', name: 'Zelle' },
      { code: 'CHEQUE', name: 'Cheque' },
    ]
  },
  
  // Tipos de documento
  DOCUMENT_TYPES: {
    code: 'DOCUMENT_TYPES',
    items: [
      { code: 'FACTURA', name: 'Factura' },
      { code: 'NOTA_ENTREGA', name: 'Nota de Entrega' },
      { code: 'PRESUPUESTO', name: 'Presupuesto' },
      { code: 'NOTA_CREDITO', name: 'Nota de Crédito' },
    ]
  },
  
  // Unidades de medida
  UOM: {
    code: 'UOM',
    items: [
      { code: 'UNIDAD', name: 'Unidad' },
      { code: 'KG', name: 'Kilogramo' },
      { code: 'LB', name: 'Libra' },
      { code: 'LITRO', name: 'Litro' },
      { code: 'GALON', name: 'Galón' },
      { code: 'METRO', name: 'Metro' },
    ]
  },
  
  // Tipos de IVA
  TAX_RATES: {
    code: 'TAX_RATES',
    items: [
      { code: 'EXENTO', name: 'Exento', rate: 0 },
      { code: 'REDUCIDO', name: 'Reducido', rate: 0.08 },
      { code: 'GENERAL', name: 'General', rate: 0.16 },
    ]
  },
};
```

---

## 📡 Endpoints Principales

```typescript
@Controller('tablas')
export class TablasController {
  @Get()
  async getTablas() { }
  
  @Get(':name/items')
  async getTablaItems(@Param('name') name: string) { }
  
  @Post()
  async createTabla(@Body() dto: CreateTablaDto) { }
  
  @Post(':name/items')
  async createItem(@Param('name') name: string, @Body() dto: CreateItemDto) { }
  
  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) { }
  
  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Tablas Sistema**: No se pueden eliminar tablas del sistema
2. **Códigos Únicos**: Code debe ser único por tabla
3. **Activos**: Solo items activos se muestran en formularios
4. **Orden**: Items se ordenan por campo order
5. **Auditoría**: Registrar cambios en tablas

---

**Anterior**: `05-configuracion/usuarios.md` | **Siguiente**: `06-reportes/bi-avanzado.md`
