/**
 * reportExporter - Utilidades para exportar reportes
 * Características:
 * - Exportar a Excel
 * - Exportar a CSV
 * - Exportar a PDF
 * - Reportes personalizados
 */

import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

/**
 * Exporta datos a Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const {
    filename = `reporte_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName = 'Reporte',
    includeHeaders = true,
  } = options;

  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(data, {
    header: includeHeaders ? undefined : [],
  });

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Descargar archivo
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const {
    filename = `reporte_${new Date().toISOString().split('T')[0]}.csv`,
  } = options;

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Convertir a CSV
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Crear blob y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exporta reporte de productos sin fotos
 */
export function exportProductsWithoutPhotos(
  products: any[],
  format: 'excel' | 'csv' = 'excel'
): void {
  // Filtrar productos sin fotos
  const productsWithoutPhotos = products.filter(
    (p) => !p.FOTO1 && !p.FOTO2 && !p.FOTO3
  );

  // Preparar datos para exportar
  const exportData = productsWithoutPhotos.map((p) => ({
    'Código': p.CAUPLAS || '',
    'Descripción': p.DESCRIPCION || '',
    'Marca': p.MARCA || '',
    'Modelo': p.MODELO || '',
    'Precio': p.PRECIO || 0,
    'Stock': p.STOCK || 0,
    'Categoría': p.CATEGORIA || '',
    'Ubicación': p.UBICACION || '',
  }));

  const filename = `productos_sin_fotos_${new Date().toISOString().split('T')[0]}`;

  if (format === 'excel') {
    exportToExcel(exportData, {
      filename: `${filename}.xlsx`,
      sheetName: 'Productos Sin Fotos',
    });
  } else {
    exportToCSV(exportData, {
      filename: `${filename}.csv`,
    });
  }
}

/**
 * Exporta reporte de auditoría de fotos
 */
export function exportPhotoAuditReport(products: any[]): void {
  const reportData = products.map((p) => {
    const photoCount = [p.FOTO1, p.FOTO2, p.FOTO3].filter(Boolean).length;
    
    return {
      'Código': p.CAUPLAS || '',
      'Descripción': p.DESCRIPCION || '',
      'Fotos': photoCount,
      'Foto 1': p.FOTO1 ? 'Sí' : 'No',
      'Foto 2': p.FOTO2 ? 'Sí' : 'No',
      'Foto 3': p.FOTO3 ? 'Sí' : 'No',
      'Estado': photoCount === 0 ? 'Sin fotos' : 
                photoCount === 3 ? 'Completo' : 'Parcial',
      'Última Actualización': p.UPDATED_AT || '',
    };
  });

  exportToExcel(reportData, {
    filename: `auditoria_fotos_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Auditoría de Fotos',
  });
}

/**
 * Exporta reporte de inventario completo
 */
export function exportInventoryReport(
  products: any[],
  options: {
    includePhotos?: boolean;
    includeStock?: boolean;
    includePrices?: boolean;
  } = {}
): void {
  const {
    includePhotos = true,
    includeStock = true,
    includePrices = true,
  } = options;

  const reportData = products.map((p) => {
    const data: Record<string, any> = {
      'Código': p.CAUPLAS || '',
      'Descripción': p.DESCRIPCION || '',
      'Marca': p.MARCA || '',
      'Modelo': p.MODELO || '',
      'Categoría': p.CATEGORIA || '',
    };

    if (includePrices) {
      data['Precio'] = p.PRECIO || 0;
      data['Costo'] = p.COSTO || 0;
    }

    if (includeStock) {
      data['Stock'] = p.STOCK || 0;
      data['Stock Mínimo'] = p.STOCK_MIN || 0;
      data['Stock Máximo'] = p.STOCK_MAX || 0;
    }

    if (includePhotos) {
      const photoCount = [p.FOTO1, p.FOTO2, p.FOTO3].filter(Boolean).length;
      data['Fotos'] = photoCount;
    }

    return data;
  });

  exportToExcel(reportData, {
    filename: `inventario_completo_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Inventario',
  });
}

/**
 * Exporta reporte de productos con bajo stock
 */
export function exportLowStockReport(products: any[]): void {
  const lowStockProducts = products.filter(
    (p) => (p.STOCK || 0) <= (p.STOCK_MIN || 0)
  );

  const reportData = lowStockProducts.map((p) => ({
    'Código': p.CAUPLAS || '',
    'Descripción': p.DESCRIPCION || '',
    'Stock Actual': p.STOCK || 0,
    'Stock Mínimo': p.STOCK_MIN || 0,
    'Diferencia': (p.STOCK || 0) - (p.STOCK_MIN || 0),
    'Precio': p.PRECIO || 0,
    'Valor Total': ((p.STOCK || 0) * (p.PRECIO || 0)).toFixed(2),
  }));

  exportToExcel(reportData, {
    filename: `productos_bajo_stock_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Bajo Stock',
  });
}

/**
 * Exporta reporte personalizado
 */
export function exportCustomReport<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  const reportData = data.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      row[col.label] = item[col.key];
    });
    return row;
  });

  exportToExcel(reportData, {
    filename: `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Reporte',
  });
}

/**
 * Descarga un blob como archivo
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera estadísticas de fotos
 */
export function generatePhotoStats(products: any[]): {
  total: number;
  withPhotos: number;
  withoutPhotos: number;
  partial: number;
  complete: number;
  percentage: number;
} {
  const total = products.length;
  let withPhotos = 0;
  let withoutPhotos = 0;
  let partial = 0;
  let complete = 0;

  products.forEach((p) => {
    const photoCount = [p.FOTO1, p.FOTO2, p.FOTO3].filter(Boolean).length;
    
    if (photoCount === 0) {
      withoutPhotos++;
    } else {
      withPhotos++;
      if (photoCount === 3) {
        complete++;
      } else {
        partial++;
      }
    }
  });

  return {
    total,
    withPhotos,
    withoutPhotos,
    partial,
    complete,
    percentage: total > 0 ? (withPhotos / total) * 100 : 0,
  };
}
