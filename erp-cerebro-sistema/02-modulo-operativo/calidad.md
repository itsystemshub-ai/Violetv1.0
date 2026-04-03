# Módulo 02: OPERATIVO - Control de Calidad

## Descripción

Sistema de gestión de control de calidad para inspección de productos, trazabilidad de lotes, no conformidades y acciones correctivas.

## 🔗 Conexiones

- **02-operativo/inventario** → Lotes y trazabilidad
- **02-operativo/produccion** → Inspección de producción
- **02-operativo/compras** → Inspección de compras
- **03-comercial/ventas** → Devoluciones por calidad

---

## 📊 Modelo de Datos

```prisma
model QualityInspection {
  id          String   @id @default(cuid())
  lotId       String
  lot         Lot      @relation(fields: [lotId], references: [id])
  type        String   // RECEPCION, PROCESO, PRODUCTO_TERMINADO
  inspectedBy String
  date        DateTime @default(now())
  result      String   // APROBADO, RECHAZADO, CONDICIONADO
  parameters  Json
  notes       String?
  nonConformities NonConformity[]
}

model NonConformity {
  id               String @id @default(cuid())
  inspectionId     String
  inspection       QualityInspection @relation(fields: [inspectionId], references: [id])
  description      String
  severity         String // CRITICA, MAYOR, MENOR
  correctiveAction String?
  status           String @default("OPEN")
  dueDate          DateTime?
  closedAt         DateTime?
}

model Lot {
  id               String   @id @default(cuid())
  code             String   @unique
  productId        String
  product          Product @relation(fields: [productId], references: [id])
  quantity         Float
  expirationDate   DateTime?
  manufacturingDate DateTime?
  qualityStatus    String   @default("PENDING")
  inspections      QualityInspection[]
}
```

---

## 📡 Endpoints Principales

```typescript
@Controller('calidad')
export class CalidadController {
  @Get('inspecciones')
  async getInspecciones(@Query('lotId') lotId?: string) { }
  
  @Post('inspecciones')
  async createInspeccion(@Body() dto: CreateInspeccionDto) { }
  
  @Get('lotes')
  async getLotes(@Query('status') status?: string) { }
  
  @Post('lotes/:id/aprobar')
  async aprobarLote(@Param('id') id: string) { }
  
  @Post('no-conformidades')
  async createNoConformidad(@Body() dto: CreateNoConformidadDto) { }
  
  @Get('reportes/calidad')
  async getReporteCalidad(@Query('period') period?: string) { }
}
```

---

## ⚠️ Reglas de Negocio

1. **Lotes**: Todo producto debe tener lote para trazabilidad
2. **Inspección**: Obligatoria en recepción y producto terminado
3. **No Conformidades**: Requieren acción correctiva documentada
4. **Trazabilidad**: Poder rastrear desde materia prima hasta cliente

---

**Anterior**: `02-operativo/mantenimiento.md` | **Siguiente**: `03-comercial/marketing.md`
