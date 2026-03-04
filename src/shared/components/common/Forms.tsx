import { useState, useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  Save,
  Building2,
  Package,
  Receipt,
  Users,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tenant, Product, Employee } from "@/lib";
import { WithholdingService } from "@/lib/WithholdingService";
import { InventoryService } from "@/features/inventory/services/inventory.service";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import { cn } from "@/core/shared/utils/utils";

// --- SCHEMAS ---

const tenantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido"),
  rif: z.string().min(5, "RIF/NIT inválido"),
  fiscalName: z.string().min(2, "Razón social requerida"),
  commercialName: z.string().optional(),
  address: z.string().min(5, "Dirección requerida"),
  sector: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  currency: z.string().min(1, "Moneda requerida"),
});

const productSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  cauplas: z.string().min(2, "Código Cauplas requerido"),
  torflex: z.string().optional(),
  indomax: z.string().optional(),
  oem: z.string().optional(),
  aplicacion: z.string().optional(),
  descripcionManguera: z.string().optional(),
  aplicacionesDiesel: z.string().optional(),
  price: z.coerce.number().min(0.01, "Precio debe ser mayor a 0"),
  precioFCA: z.coerce.number().min(0).optional(),
  isCombo: z.boolean().default(false),
  components: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().min(1),
      }),
    )
    .optional(),
  warehouseStocks: z
    .array(
      z.object({
        warehouseId: z.string(),
        stock: z.coerce.number().min(0),
      }),
    )
    .optional(),
  cost: z.coerce.number().min(0, "Costo no puede ser negativo"),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  unit: z.string().min(1, "Unidad requerida"),
  category: z.string().min(1, "Categoría requerida"),
  isNuevo: z.string().optional(),
  images: z.array(z.string()).max(3).default([]),
  rowNumber: z.number().optional(),
  ventasHistory: z.any().optional(),
  historial: z.number().optional(),
  rankingHistory: z.any().optional(),
});

const invoiceSchema = z.object({
  number: z.string().min(1, "Número de factura requerido"),
  customerName: z.string().min(2, "Nombre del cliente requerido"),
  date: z.string(),
  dueDate: z.string(),
  status: z.enum(["pagada", "pendiente", "vencida", "anulada"]),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Descripción requerida"),
        quantity: z.coerce.number().min(1),
        price: z.coerce.number().min(0.01),
        tax: z.coerce.number().min(0),
      }),
    )
    .min(1, "Debe agregar al menos un ítem"),
  controlNumber: z.string().optional(),
  ivaWithholdingPercentage: z.coerce.number().min(0).max(100).default(0),
  islrConceptCode: z.string().optional(),
});

const employeeSchema = z.object({
  firstName: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  dni: z.string().min(5, "Cédula requerida"),
  rif: z.string().optional(),
  militaryRegistration: z.string().optional(),
  cargasFamiliares: z.coerce.number().min(0).default(0),
  centroCostos: z.string().min(1, "Centro de costos requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(7, "Teléfono requerido"),
  position: z.string().min(2, "Cargo requerido"),
  department: z.string().min(2, "Departamento requerido"),
  salary: z.coerce.number().min(0),
  joinDate: z.string(),
  status: z.enum(["activo", "suspendido", "retirado"]),
});

const requisitionSchema = z.object({
  department: z.string().min(2, "Departamento requerido"),
  urgency: z.enum(["baja", "media", "alta"]),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Descripción requerida"),
        quantity: z.coerce.number().min(1),
      }),
    )
    .min(1, "Debe agregar al menos un ítem"),
});

// --- COMPONENTS ---

export function TenantSetupForm({
  initialData,
  onSubmit,
}: {
  initialData?: Partial<Tenant>;
  onSubmit: (data: any) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#7c3aed');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      currency: "USD",
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxSize = 200;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/png', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB');
      return;
    }

    try {
      const compressedLogo = await compressImage(file);
      setLogoUrl(compressedLogo);
    } catch (error) {
      console.error('Error al procesar el logo:', error);
      alert('Error al procesar la imagen');
    }

    e.target.value = '';
  };

  const handleFormSubmit = (data: any) => {
    // Incluir logo y color primario en los datos
    onSubmit({
      ...data,
      primaryColor,
      logoUrl,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Configuración de Identidad
        </CardTitle>
        <CardDescription>
          Personalice la información fiscal y visual de su empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Identidad Visual */}
          <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Identidad Visual</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logotipo de la Empresa</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border rounded-lg">
                    <AvatarImage src={logoUrl} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                      {(watch("name") || "??").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleLogoClick}>
                      Cambiar Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG. Máx 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Primario */}
              <div className="space-y-2">
                <Label htmlFor="primary-color">Color Primario</Label>
                <div className="flex gap-3">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Color para botones y elementos activos
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos de la Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Comercial</Label>
              <Input {...register("name")} placeholder="Violet ERP" />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Slug de Acceso (Subdominio)</Label>
              <Input {...register("slug")} placeholder="violet-erp" />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>RIF / NIT / Identificación Fiscal</Label>
              <Input {...register("rif")} placeholder="J-12345678-9" />
              {errors.rif && (
                <p className="text-xs text-destructive">
                  {errors.rif.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Razón Social Completa</Label>
              <Input
                {...register("fiscalName")}
                placeholder="Violet ERP Solutions, C.A."
              />
              {errors.fiscalName && (
                <p className="text-xs text-destructive">
                  {errors.fiscalName.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Nombre Comercial / Marca (Opcional)</Label>
              <Input
                {...register("commercialName")}
                placeholder="A.E. Araujo. F.P."
              />
              <p className="text-xs text-muted-foreground">
                Nombre comercial que aparecerá en facturas y documentos
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dirección Fiscal</Label>
              <Textarea
                {...register("address")}
                placeholder="Av. Principal, Edificio Violet, Piso 10..."
              />
              {errors.address && (
                <p className="text-xs text-destructive">
                  {errors.address.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sector / Zona (Opcional)</Label>
              <Input {...register("sector")} placeholder="Sector Centro Turnero" />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input {...register("city")} placeholder="Valencia" />
            </div>
            <div className="space-y-2">
              <Label>Estado / Provincia</Label>
              <Input {...register("state")} placeholder="Carabobo" />
            </div>
            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input {...register("postalCode")} placeholder="2115" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Contacto</Label>
              <Input {...register("phone")} placeholder="+58 212 000 0000" />
            </div>
            <div className="space-y-2">
              <Label>Email (Opcional)</Label>
              <Input {...register("email")} type="email" placeholder="contacto@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Sitio Web (Opcional)</Label>
              <Input {...register("website")} placeholder="www.empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Moneda Principal</Label>
              <Select defaultValue={initialData?.currency || "USD"} onValueChange={(value) => register("currency").onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                  <SelectItem value="VES">VES - Bolívar Venezolano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function InvoiceForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, control, handleSubmit, watch } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "pendiente",
      items: [{ name: "", quantity: 1, price: 0, tax: 16 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );
  const taxTotal = items.reduce(
    (acc, item) => acc + item.quantity * item.price * (item.tax / 100),
    0,
  );
  const total = subtotal + taxTotal;

  const islrWithholding =
    watch("islrConceptCode") && watch("islrConceptCode") !== "none"
      ? WithholdingService.calculateIslrWithholding(
          subtotal,
          watch("islrConceptCode") as string,
        )
      : 0;

  const ivaWithholding = taxTotal * (watch("ivaWithholdingPercentage") / 100);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Nueva Factura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Número de Factura</Label>
              <Input {...register("number")} placeholder="FAC-0001" />
            </div>
            <div className="space-y-2">
              <Label>Proveedor / Cliente</Label>
              <Input
                {...register("customerName")}
                placeholder="Nombre o Razón Social"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagada">Pagada</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Número de Control</Label>
              <Input {...register("controlNumber")} placeholder="00-000001" />
            </div>
            <div className="space-y-2">
              <Label>Retención ISLR</Label>
              <Controller
                control={control}
                name="islrConceptCode"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Concepto ISLR" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin Retención</SelectItem>
                      {WithholdingService.getIslrConcepts().map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          [{c.code}] {c.name} ({c.rate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Retención IVA (%)</Label>
              <Controller
                control={control}
                name="ivaWithholdingPercentage"
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue={field.value.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Retención" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Sin Retención)</SelectItem>
                      <SelectItem value="75">75% (Especial)</SelectItem>
                      <SelectItem value="100">100% (Especial)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Líneas de Factura</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ name: "", quantity: 1, price: 0, tax: 16 })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar Línea
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24">Cant.</TableHead>
                  <TableHead className="w-32">Precio</TableHead>
                  <TableHead className="w-24">IVA%</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        {...register(`items.${index}.name` as const)}
                        placeholder="Producto o Servicio"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity` as const)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.price` as const)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        {...register(`items.${index}.tax` as const)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      $
                      {(
                        (items[index]?.quantity || 0) *
                        (items[index]?.price || 0) *
                        (1 + (items[index]?.tax || 0) / 100)
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end space-y-2 pt-4">
            <div className="flex justify-between w-64 text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-64 text-sm">
              <span className="text-muted-foreground">IVA:</span>
              <span className="font-medium">${taxTotal.toFixed(2)}</span>
            </div>

            {ivaWithholding > 0 && (
              <div className="flex justify-between w-64 text-sm text-amber-600 font-bold">
                <span>
                  Retención IVA ({watch("ivaWithholdingPercentage")}%):
                </span>
                <span>-${ivaWithholding.toFixed(2)}</span>
              </div>
            )}

            {islrWithholding > 0 && (
              <div className="flex justify-between w-64 text-sm text-rose-600 font-bold">
                <span>Retención ISLR:</span>
                <span>-${islrWithholding.toFixed(2)}</span>
              </div>
            )}

            <Separator className="w-64" />
            <div className="flex justify-between w-64 text-lg font-bold">
              <span>Total a Pagar:</span>
              <span className="text-primary">
                ${(total - ivaWithholding - islrWithholding).toFixed(2)}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Save className="w-4 h-4 mr-2" /> Generar Factura
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

export function ProductForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: any) => void;
  initialData?: Partial<Product>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      images: [],
      unit: "Unidad",
      stock: 0,
      minStock: 5,
      cost: 0,
      isCombo: false,
      components: [],
      warehouseStocks: [],
      ...initialData,
    },
  });

  const { products: allProducts } = useInventory();

  const {
    fields: componentFields,
    append: appendComponent,
    remove: removeComponent,
  } = useFieldArray({
    control,
    name: "components",
  });

  const {
    fields: warehouseFields,
    append: appendWarehouse,
    remove: removeWarehouse,
  } = useFieldArray({
    control,
    name: "warehouseStocks",
  });

  const images = watch("images") || [];
  const isCombo = watch("isCombo");
  const warehouseStocks = watch("warehouseStocks");
  const components = watch("components");

  useEffect(() => {
    if (isCombo) {
      // Calculamos stock del combo
      const calculatedStock = InventoryService.calculateComboStock(
        { isCombo, components } as Product,
        allProducts,
      );
      setValue("stock", calculatedStock);
    } else if (warehouseFields.length > 0) {
      // Sumamos stock de almacenes
      const total = (warehouseStocks || []).reduce(
        (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
        0,
      );
      setValue("stock", total);
    }
  }, [
    isCombo,
    components,
    warehouseStocks,
    allProducts,
    setValue,
    warehouseFields.length,
  ]);

  // Si no hay almacenes configurados y se ingresa stock, asignar al almacén principal
  useEffect(() => {
    const currentStock = watch("stock");
    if (!isCombo && warehouseFields.length === 0 && currentStock > 0 && !initialData?.warehouseStocks) {
      appendWarehouse({ warehouseId: "wh-01", stock: currentStock });
    }
  }, [watch("stock"), isCombo, warehouseFields.length, initialData]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar a máximo 300x300 manteniendo aspecto (más pequeño)
          let width = img.width;
          let height = img.height;
          const maxSize = 300;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Comprimir a 40% de calidad (más compresión)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
          console.log("Imagen comprimida:", compressedDataUrl.length, "caracteres");
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = watch("images") || [];
    
    if (files.length + currentImages.length > 3) {
      alert("Solo puedes seleccionar máximo 3 fotos");
      e.target.value = "";
      return;
    }
    
    setSelectedFiles(files);
    
    // Comprimir y convertir archivos a URLs
    const newImages = [...currentImages];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressedUrl = await compressImage(files[i]);
        console.log("Imagen comprimida:", compressedUrl.length, "caracteres");
        newImages.push(compressedUrl);
      } catch (error) {
        console.error("Error al comprimir imagen:", error);
        alert("Error al procesar la imagen " + (i + 1));
      }
    }
    
    setValue("images", newImages, { shouldValidate: true });
    console.log("Total de imágenes:", newImages.length);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = watch("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue("images", newImages, { shouldValidate: true });
    console.log("Imagen eliminada. Total:", newImages.length);
  };

  const handleFormSubmit = (data: any) => {
    // Copiar precio de venta a costo
    data.cost = data.price || 0;
    console.log("Guardando producto con imágenes:", data.images?.length || 0);
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Gestión de Producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* FOTOS - Primera sección */}
            <div className="md:col-span-3 space-y-4 border-b pb-4">
              <Label className="text-primary font-bold text-lg">Galería de Fotos (Máx 3)</Label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 relative">
                    <div className="h-32 w-full rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 flex items-center justify-center overflow-hidden relative">
                      {images[i] ? (
                        <>
                          <img
                            src={images[i]}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handleRemoveImage(i)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 opacity-20" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                  disabled={images.length >= 3}
                />
                <p className="text-xs text-muted-foreground">
                  {images.length}/3 fotos
                </p>
              </div>
            </div>

            {/* Orden según la tabla: CAUPLAS, TORFLEX, INDOMAX, OEM */}
            <div className="space-y-2">
              <Label>CAUPLAS</Label>
              <Input {...register("cauplas")} placeholder="Código Cauplas" />
              {errors.cauplas && (
                <p className="text-xs text-destructive">
                  {errors.cauplas.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>TORFLEX</Label>
              <Input {...register("torflex")} placeholder="Código Torflex" />
            </div>

            <div className="space-y-2">
              <Label>INDOMAX</Label>
              <Input {...register("indomax")} placeholder="Código Indomax" />
            </div>

            <div className="space-y-2">
              <Label>OEM</Label>
              <Input {...register("oem")} placeholder="Código Original" />
            </div>

            {/* DESCRIPCION DEL PRODUCTO */}
            <div className="space-y-2 md:col-span-2">
              <Label>DESCRIPCION DEL PRODUCTO</Label>
              <Input
                {...register("descripcionManguera")}
                placeholder="Detalle técnico del producto"
              />
            </div>

            {/* CATEGORIA */}
            <div className="space-y-2">
              <Label>CATEGORIA</Label>
              <Input {...register("category")} placeholder="Categoría" />
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message as string}
                </p>
              )}
            </div>

            {/* TIPO DE COMBUSTIBLE */}
            <div className="space-y-2">
              <Label>TIPO DE COMBUSTIBLE</Label>
              <Input
                {...register("aplicacionesDiesel")}
                placeholder="Diesel / Nafta"
              />
            </div>

            {/* NUEVOS ITEMS */}
            <div className="space-y-2">
              <Label>NUEVOS ITEMS</Label>
              <Input
                {...register("isNuevo")}
                placeholder="Ej: BOLETIN #33"
              />
            </div>

            {/* PRECIO FCA */}
            <div className="space-y-2">
              <Label>PRECIO FCA CÓRDOBA $</Label>
              <Input type="number" step="0.01" {...register("precioFCA")} />
            </div>

            {/* CANTIDAD (STOCK) */}
            <div className="space-y-2">
              <Label>
                CANTIDAD (STOCK){" "}
                {(isCombo || warehouseFields.length > 0) && "(Calculado)"}
              </Label>
              <Input
                type="number"
                {...register("stock")}
                readOnly={isCombo || warehouseFields.length > 0}
                className={cn(
                  (isCombo || warehouseFields.length > 0) &&
                    "bg-muted font-bold text-primary",
                )}
              />
            </div>

            {/* Campos adicionales */}
            <div className="space-y-2">
              <Label>PRECIO DE VENTA ($)</Label>
              <Input type="number" step="0.01" {...register("price")} placeholder="0.00" />
              {errors.price && (
                <p className="text-xs text-destructive">
                  {errors.price.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>UNIDAD</Label>
              <Input {...register("unit")} placeholder="Unidad" defaultValue="Unidad" />
              {errors.unit && (
                <p className="text-xs text-destructive">
                  {errors.unit.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>STOCK MÍNIMO</Label>
              <Input type="number" {...register("minStock")} placeholder="5" defaultValue="5" />
            </div>

            <div className="space-y-4 lg:col-span-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-bold">Tipo de Producto</Label>
                  <p className="text-xs text-muted-foreground">
                    Define si es un producto simple o un kit/combo.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="combo-mode">Es un Combo?</Label>
                  <Controller
                    control={control}
                    name="isCombo"
                    render={({ field }) => (
                      <Switch
                        id="combo-mode"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              {isCombo && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-primary font-bold">
                      Componentes del Combo
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendComponent({ productId: "", quantity: 1 })
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" /> Agregar Componente
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-32">Cantidad</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {componentFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`components.${index}.productId`}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allProducts
                                      .filter((p) => p.id !== initialData?.id)
                                      .map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.cauplas || p.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              {...register(`components.${index}.quantity`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeComponent(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isCombo && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-primary font-bold">
                      Stock por Almacén
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendWarehouse({ warehouseId: "wh-main", stock: 0 })
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" /> Asignar Almacén
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Almacén</TableHead>
                        <TableHead className="w-32">Stock</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              control={control}
                              name={`warehouseStocks.${index}.warehouseId`}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar almacén" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {InventoryService.getDefaultWarehouses().map(
                                      (w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                          {w.name}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              {...register(`warehouseStocks.${index}.stock`)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeWarehouse(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="md:col-span-3 pt-4 border-t">
              <Button
                type="submit"
                className="w-full h-14 text-xl font-bold bg-primary shadow-lg shadow-primary/20"
              >
                <Save className="w-6 h-6 mr-2" /> Guardar Producto
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function EmployeeForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: any) => void;
  initialData?: Partial<Employee>;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData || {
      status: "activo",
      joinDate: new Date().toISOString().split("T")[0],
      cargasFamiliares: 0,
      centroCostos: "Administración",
      rif: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Ficha de Empleado (LOTTT)
        </CardTitle>
        <CardDescription>
          Expediente laboral conforme a la legislación venezolana vigente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input {...register("lastName")} />
              </div>
              <div className="space-y-2">
                <Label>Cédula de Identidad</Label>
                <Input {...register("dni")} placeholder="V-12345678" />
              </div>
              <div className="space-y-2">
                <Label>RIF Personal</Label>
                <Input {...register("rif")} placeholder="V-12345678-9" />
              </div>
              <div className="space-y-2">
                <Label>Inscripción Militar</Label>
                <Input
                  {...register("militaryRegistration")}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargas Familiares</Label>
                <Input
                  type="number"
                  min="0"
                  {...register("cargasFamiliares")}
                />
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Corporativo</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...register("phone")} placeholder="+58 412 000 0000" />
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              Datos Laborales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cargo / Posición</Label>
                <Input {...register("position")} />
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Input {...register("department")} />
              </div>
              <div className="space-y-2">
                <Label>Centro de Costos</Label>
                <Controller
                  control={control}
                  name="centroCostos"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administración">
                          Administración
                        </SelectItem>
                        <SelectItem value="Ventas">Ventas</SelectItem>
                        <SelectItem value="Operaciones">Operaciones</SelectItem>
                        <SelectItem value="Producción">Producción</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Salario Mensual (USD)</Label>
                <Input type="number" step="0.01" {...register("salary")} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Ingreso</Label>
                <Input type="date" {...register("joinDate")} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="suspendido">Suspendido</SelectItem>
                        <SelectItem value="retirado">Retirado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" /> Guardar Expediente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RequisitionForm({
  onSubmit,
}: {
  onSubmit: (data: any) => void;
}) {
  const { register, control, handleSubmit } = useForm({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      urgency: "media",
      items: [{ name: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Package className="w-5 h-5" />
            Solicitud de Requisición
          </CardTitle>
          <CardDescription>
            Documento interno para requerimientos de almacén o suministros.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento / Área</Label>
              <Input
                {...register("department")}
                placeholder="Ej: Producción / Almacén"
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Controller
                control={control}
                name="urgency"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">
                        Baja - Reposición Normal
                      </SelectItem>
                      <SelectItem value="media">
                        Media - Stock Mínimo
                      </SelectItem>
                      <SelectItem value="alta">
                        Alta - Crítico / Quiebre
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas / Justificación</Label>
            <Textarea
              {...register("notes")}
              placeholder="Explique la necesidad del pedido..."
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold">Desglose de Ítems</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => append({ name: "", quantity: 1 })}
              >
                <Plus className="w-3 h-3 mr-1" /> Nuevo ítem
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Producto / Descripción</TableHead>
                    <TableHead className="w-32">Cantidad</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-transparent">
                      <TableCell>
                        <Input
                          {...register(`items.${index}.name` as const)}
                          placeholder="Nombre del producto"
                          className="border-none shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...register(`items.${index}.quantity` as const)}
                          className="border-none shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 mt-6 shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4 mr-2" /> Enviar para Aprobación
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
