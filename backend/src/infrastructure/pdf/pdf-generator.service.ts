import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportColumn {
  header: string;
  dataKey: string;
}

interface ReportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ReportColumn[];
  data: any[];
}

export const generatePDFReport = (config: ReportConfig) => {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(config.title, 14, 22);

  // Subtitle
  if (config.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(config.subtitle, 14, 30);
  }

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 38);

  const startY = config.subtitle ? 45 : 35;

  autoTable(doc, {
    startY,
    head: [config.columns.map(col => col.header)],
    body: config.data.map(row => config.columns.map(col => row[col.dataKey])),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(config.filename);
};
