/**
 * ExportReportButton - Botón para exportar reportes
 * Características:
 * - Múltiples formatos (Excel, CSV)
 * - Tipos de reportes predefinidos
 * - Menú desplegable
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Image, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  exportProductsWithoutPhotos,
  exportPhotoAuditReport,
  exportInventoryReport,
  exportLowStockReport,
  generatePhotoStats,
} from '../utils/reportExporter';

interface ExportReportButtonProps {
  products: any[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  products,
  variant = 'outline',
  size = 'default',
  className,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (
    type: 'without-photos' | 'audit' | 'inventory' | 'low-stock',
    format: 'excel' | 'csv' = 'excel'
  ) => {
    setIsExporting(true);

    try {
      switch (type) {
        case 'without-photos':
          exportProductsWithoutPhotos(products, format);
          toast.success('Reporte de productos sin fotos exportado');
          break;

        case 'audit':
          exportPhotoAuditReport(products);
          toast.success('Reporte de auditoría de fotos exportado');
          break;

        case 'inventory':
          exportInventoryReport(products);
          toast.success('Reporte de inventario exportado');
          break;

        case 'low-stock':
          exportLowStockReport(products);
          toast.success('Reporte de bajo stock exportado');
          break;
      }
    } catch (error) {
      console.error('Error exportando reporte:', error);
      toast.error('Error al exportar reporte');
    } finally {
      setIsExporting(false);
    }
  };

  const stats = generatePhotoStats(products);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isExporting || products.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Reporte
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Reportes de Fotos</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('without-photos', 'excel')}
          disabled={stats.withoutPhotos === 0}
        >
          <Image className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <div>Productos Sin Fotos</div>
            <div className="text-xs text-muted-foreground">
              {stats.withoutPhotos} productos
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('audit', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <div>Auditoría de Fotos</div>
            <div className="text-xs text-muted-foreground">
              {stats.percentage.toFixed(1)}% con fotos
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Reportes de Inventario</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('inventory', 'excel')}>
          <Package className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <div>Inventario Completo</div>
            <div className="text-xs text-muted-foreground">
              {products.length} productos
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('low-stock', 'excel')}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <div>Productos Bajo Stock</div>
            <div className="text-xs text-muted-foreground">
              Stock crítico
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('without-photos', 'csv')}
          disabled={stats.withoutPhotos === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Sin Fotos (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Versión compacta del botón
 */
export const ExportReportButtonCompact: React.FC<{
  products: any[];
  type: 'without-photos' | 'audit' | 'inventory' | 'low-stock';
  format?: 'excel' | 'csv';
}> = ({ products, type, format = 'excel' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      switch (type) {
        case 'without-photos':
          exportProductsWithoutPhotos(products, format);
          break;
        case 'audit':
          exportPhotoAuditReport(products);
          break;
        case 'inventory':
          exportInventoryReport(products);
          break;
        case 'low-stock':
          exportLowStockReport(products);
          break;
      }
      toast.success('Reporte exportado correctamente');
    } catch (error) {
      toast.error('Error al exportar reporte');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || products.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar
    </Button>
  );
};
