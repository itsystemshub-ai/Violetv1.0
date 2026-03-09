import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, Tenant, formatCurrency, formatDate } from './index';

export const exportInvoicePDF = (invoice: Invoice, tenant: Tenant, ivaPercentage: number = 16) => {
  const doc = new jsPDF();
  
  const blueColor: [number, number, number] = [0, 102, 204]; // Color of headers
  
  // LOGO and Tenant Info (Left)
  if (tenant.logoUrl) {
    try {
      doc.addImage(tenant.logoUrl, 'PNG', 14, 15, 40, 15);
    } catch { /* ignore if not loadable */ }
  } else {
    doc.setFontSize(22);
    doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.text(tenant.name || "Empresa", 14, 25);
  }

  doc.setFontSize(9);
  doc.setTextColor(100);
  let yPos = 35;
  if(tenant.name) { doc.text(tenant.name, 14, yPos); yPos += 5; }
  if(tenant.address) { doc.text(tenant.address, 14, yPos); yPos += 5; }
  if(tenant.phone) { doc.text(tenant.phone, 14, yPos); yPos += 5; }
  if(tenant.email) { doc.text(tenant.email, 14, yPos); yPos += 5; }
  
  // Right side: FACTURA title
  doc.setFontSize(22);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text("FACTURA", 150, 25);

  // Invoice Details Table (Right)
  autoTable(doc, {
    startY: 30,
    margin: { left: 120 },
    head: [['Nº DE FACTURA', 'FECHA']],
    body: [[invoice.number, formatDate(invoice.date)]],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255, halign: 'center' },
    bodyStyles: { halign: 'center', fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    margin: { left: 120 },
    head: [['ID DE CLIENTE', 'CONDICIONES']],
    body: [[invoice.customerId || '-', 'Contado']],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255, halign: 'center' },
    bodyStyles: { halign: 'center', fontSize: 9 },
  });

  autoTable(doc, {
    startY: 65,
    margin: { right: 110, left: 14 },
    head: [['FACTURAR A:']],
    body: [[
      `${invoice.customerName}\n${invoice.customerRif ? 'RIF: ' + invoice.customerRif : ''}`
    ]],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255 },
    bodyStyles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: 65,
    margin: { left: 110, right: 14 },
    head: [['ENVIAR A:']],
    body: [[
      `${invoice.customerName}\n`
    ]],
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255 },
    bodyStyles: { fontSize: 9 },
  });

  // Main items table
  const tableData = invoice.items.map(item => [
    item.name,
    item.quantity,
    formatCurrency(item.price, "USD"),
    formatCurrency(item.total, "USD")
  ]);

  // Fill up blank lines to look like a full page invoice as per design
  const minRows = 15;
  while(tableData.length < minRows) {
    tableData.push(['', '', '', '']);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['DESCRIPCIÓN', 'CANTIDAD', 'PRECIO UNITARIO', 'MONTO']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: blueColor, textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 90 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Thanks text
  doc.setFontSize(16);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text("GRACIAS", 40, finalY + 15);

  // Totals table
  autoTable(doc, {
    startY: finalY,
    margin: { left: 120 },
    body: [
      ['SUBTOTAL', formatCurrency(invoice.subtotal, "USD")],
      [`IMPUESTOS (${ivaPercentage}%)`, formatCurrency(invoice.taxTotal, "USD")],
      ['TOTAL', formatCurrency(invoice.total, "USD")]
    ],
    theme: 'grid',
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right' },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: { fillColor: [240, 245, 255] },
  });

  // Footer message
  const footerY = 270;
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerMsg = `Si tiene preguntas relacionadas con esta factura, póngase en contacto con\n${tenant.name}, ${tenant.phone || ''}, ${tenant.email || ''}\n\nwww.sudireccionweb.com`;
  doc.text(footerMsg, 105, footerY, { align: 'center' });

  doc.save(`Factura_${invoice.number}.pdf`);
};

export const exportInvoiceExcel = (invoice: Invoice, tenant: Tenant) => {
  const wb = XLSX.utils.book_new();

  const wsData = [
    [tenant.name],
    [tenant.address, "", "FACTURA"],
    [tenant.phone, "", "NO DE FACTURA", invoice.number],
    [tenant.email, "", "FECHA", formatDate(invoice.date)],
    [],
    ["FACTURAR A:", "", "ENVIAR A:"],
    [invoice.customerName, "", invoice.customerName],
    [invoice.customerRif ? `RIF: ${invoice.customerRif}` : ""],
    [],
    ["DESCRIPCIÓN", "CANTIDAD", "PRECIO UNITARIO", "MONTO"],
    ...invoice.items.map(m => [m.name, m.quantity, m.price, m.total]),
    [],
    ["", "", "SUBTOTAL", invoice.subtotal],
    ["", "", "IMPUESTOS", invoice.taxTotal],
    ["", "", "TOTAL", invoice.total],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, `Factura_${invoice.number}`);
  XLSX.writeFile(wb, `Factura_${invoice.number}.xlsx`);
};
