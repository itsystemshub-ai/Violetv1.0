/**
 * NewOrderDialog - Dialog to create new purchase orders
 * Allows selecting a supplier, adding items and submitting for approval
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { Plus, Trash2, ShoppingCart, Package } from "lucide-react";
import { useSuppliers } from "../../hooks/useSuppliers";
import {
  usePurchaseOrders,
  PurchaseOrderItem,
} from "../../hooks/usePurchaseOrders";
import { toast } from "sonner";

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DraftItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

export const NewOrderDialog: React.FC<NewOrderDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { suppliers } = useSuppliers();
  const { createOrder } = usePurchaseOrders();

  const [supplierId, setSupplierId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [warehouse] = useState("Almacén Principal");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { id: "1", productName: "", sku: "", quantity: 1, price: 0 },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        productName: "",
        sku: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof DraftItem,
    value: string | number,
  ) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (!supplierId) {
      toast.error("Selecciona un proveedor.");
      return;
    }
    if (!deliveryDate) {
      toast.error("Ingresa la fecha de entrega estimada.");
      return;
    }
    const validItems = items.filter((i) => i.productName && i.price > 0);
    if (validItems.length === 0) {
      toast.error("Agrega al menos un ítem válido con nombre y precio.");
      return;
    }

    const orderItems: PurchaseOrderItem[] = validItems.map((i) => ({
      id: `ITEM-${Date.now()}-${i.id}`,
      productId: i.sku || i.id,
      productName: i.productName,
      sku: i.sku || "N/A",
      quantity: i.quantity,
      price: i.price,
      subtotal: i.quantity * i.price,
    }));

    createOrder({
      date: new Date().toISOString().split("T")[0],
      supplier: selectedSupplier?.name || "",
      supplierId,
      deliveryDate,
      items: orderItems,
      subtotal,
      tax,
      total,
      status: "pending",
      paymentTerms: parseInt(paymentTerms, 10),
      warehouse,
      warehouseId: "WH-001",
      createdBy: "Usuario Actual",
      notes,
    });

    toast.success("Orden de compra creada y enviada a aprobación.");
    onOpenChange(false);
    // Reset
    setSupplierId("");
    setDeliveryDate("");
    setPaymentTerms("30");
    setNotes("");
    setItems([{ id: "1", productName: "", sku: "", quantity: 1, price: 0 }]);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black italic uppercase text-primary text-xl tracking-tighter flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Nueva Orden de Compra
          </DialogTitle>
          <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
            Completa los datos para generar y enviar a aprobación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Proveedor y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Proveedor *
              </Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-bold">{s.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({s.paymentTerms}d)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Fecha de Entrega *
              </Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="rounded-xl"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Plazo de Pago (días)
              </Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["15", "30", "45", "60", "90"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} días
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Almacén de Destino
              </Label>
              <Input
                value={warehouse}
                disabled
                className="rounded-xl bg-muted/40"
              />
            </div>
          </div>

          {/* Ítems */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Ítems de la Orden
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="rounded-xl gap-1.5 text-xs font-bold h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Ítem
              </Button>
            </div>

            <div className="rounded-2xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 bg-muted/30 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <div className="col-span-5">Producto / Descripción</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-2 text-right">Cant.</div>
                <div className="col-span-2 text-right">Precio Unit.</div>
                <div className="col-span-1" />
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border/30 items-center"
                >
                  <div className="col-span-5">
                    <Input
                      value={item.productName}
                      onChange={(e) =>
                        updateItem(item.id, "productName", e.target.value)
                      }
                      placeholder="Nombre del producto..."
                      className="rounded-lg h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.sku}
                      onChange={(e) =>
                        updateItem(item.id, "sku", e.target.value)
                      }
                      placeholder="SKU"
                      className="rounded-lg h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      min={1}
                      className="rounded-lg h-8 text-xs text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      min={0}
                      step="0.01"
                      className="rounded-lg h-8 text-xs text-right"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Observaciones Internas (opcional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas o instrucciones especiales para esta orden..."
              className="rounded-xl resize-none h-20 text-sm"
            />
          </div>

          {/* Totales */}
          <div className="bg-muted/20 rounded-2xl p-4 space-y-2 border border-border/40">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-muted-foreground">Subtotal</span>
              <span className="font-black">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-muted-foreground">IVA (16%)</span>
              <span className="font-black">{fmt(tax)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <span className="font-black text-sm uppercase tracking-wider text-primary">
                Total Orden
              </span>
              <Badge className="bg-primary text-primary-foreground text-base font-black px-3 py-1 rounded-xl">
                {fmt(total)}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="w-4 h-4" />
            Crear y Enviar a Aprobación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
