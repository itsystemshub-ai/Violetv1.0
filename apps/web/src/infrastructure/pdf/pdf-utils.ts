/**
 * PDF Utils - Stub para frontend
 */

export interface PDFReportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  columns: Array<{ header: string; dataKey: string }>;
  data: any[];
}

export function generatePDFReport(config: PDFReportConfig): void {
  console.log('[PDF] Generando reporte:', config.filename);
  // Stub: en producción usaría jsPDF o similar
}
