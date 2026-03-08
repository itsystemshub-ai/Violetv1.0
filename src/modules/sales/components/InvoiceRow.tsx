/**
 * Componente optimizado para filas de facturas
 * Usa React.memo para prevenir re-renders innecesarios
 */

import React from 'react';
import {
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit2,
  MessageCircle
} from 'lucide-react';
import { TableRow, TableCell } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { formatDate, formatCurrency } from '@/lib/index';

interface InvoiceRowProps {
  invoice: any;
  type: 'venta' | 'pedido';
  onEdit?: (invoice: any) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onExportPDF: (invoice: any) => void;
  onExportExcel: (invoice: any) => void;
}

export const InvoiceRow: React.FC<InvoiceRowProps> = React.memo(({
  invoice: inv,
  type,
  onEdit,
  onDelete,
  onApprove,
  onExportPDF,
  onExportExcel,
}) => {
  return (
    <TableRow className="border-border/40 hover:bg-muted/10 transition-colors group">
      <TableCell className="font-black italic text-sm text-primary px-6 py-4">
        {inv.number}
      </TableCell>
      <TableCell className="text-center px-6 py-4">
        <Badge
          variant="outline"
          className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary rounded-md px-2"
        >
          {inv.metadata?.entityType || 'Cliente'}
        </Badge>
      </TableCell>
      <TableCell className="px-6 py-4 text-[10px] font-bold text-muted-foreground">
        {inv.customerRif || '---'}
      </TableCell>
      <TableCell className="px-6 py-4 font-bold text-xs uppercase text-foreground/80 leading-none">
        {inv.customerName}
      </TableCell>
      <TableCell className="text-center text-xs font-bold text-muted-foreground px-6 py-4">
        {formatDate(inv.date)}
      </TableCell>
      {type === 'pedido' && (
        <TableCell className="text-center px-6 py-4 font-black text-xs">
          {inv.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
        </TableCell>
      )}
      <TableCell className="text-right font-black italic text-sm text-foreground px-6 py-4 tabular-nums">
        {formatCurrency(inv.total)}
      </TableCell>
      <TableCell className="text-center px-6 py-4">
        <Badge
          variant={
            inv.status === 'pagada' || inv.status === 'procesado'
              ? 'default'
              : 'secondary'
          }
          className={`uppercase font-black text-[9px] tracking-wider px-3 py-1 rounded-full shadow-sm ${
            inv.status === 'pagada' || inv.status === 'procesado'
              ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
              : 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
          }`}
        >
          {type === 'pedido' && (inv.status === 'procesado' || inv.status === 'pagada')
            ? 'Aprobado'
            : type === 'pedido'
              ? 'Pendiente'
              : inv.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right px-6 py-4 pr-6">
        <div className="flex justify-end gap-1.5">
          {type === 'pedido' && inv.status === 'pendiente' && onApprove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-black uppercase"
              onClick={() => onApprove(inv.id)}
            >
              Aprobar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl shadow-2xl border-border/40 w-48 p-1"
            >
              <DropdownMenuItem
                onClick={() => onExportPDF(inv)}
                className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
              >
                <FileText className="h-3.5 w-3.5" /> Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExportExcel(inv)}
                className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const message = `Hola, te envío la ${type === 'venta' ? 'factura' : 'orden'} *#${inv.number}* por un total de *${formatCurrency(inv.total)}*. Ver detalles: https://violet-erp.com/invoice/${inv.id}`;
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, "_blank");
                }}
                className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3 text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(inv)}
                  className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
              )}
              <Separator className="my-1 opacity-50" />
              <DropdownMenuItem
                onClick={() => onDelete && onDelete(inv.id)}
                className="rounded-lg text-[11px] font-bold uppercase gap-2 py-2 px-3 text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />{' '}
                {type === 'venta' ? 'Anular Factura' : 'Eliminar Pedido'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});

InvoiceRow.displayName = 'InvoiceRow';
