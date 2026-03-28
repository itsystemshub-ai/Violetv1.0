import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, Tenant, formatCurrency, formatDate } from '@/lib';

const ITEMS_PER_PAGE = 20; // 20 filas como en la imagen original

export const exportInvoicePDF = (invoice: Invoice, tenant: Tenant, ivaPercentage: number = 16) => {
  const doc = new jsPDF();
  const isProforma = invoice.type === 'pedido';
  const documentTitle = isProforma ? 'PROFORMA' : 'FACTURA';
  
  // Obtener la moneda del metadata
  const currency = invoice.metadata?.currency || 'USD';
  const isBs = currency === 'VES';
  
  // Si es en Bolívares, usar diseño diferente
  if (isBs) {
    exportInvoicePDF_Bs(invoice, tenant, ivaPercentage, isProforma, documentTitle);
  } else {
    exportInvoicePDF_USD(invoice, tenant, ivaPercentage, isProforma, documentTitle);
  }
};

// Función para exportar factura en BOLÍVARES - Diseño Moderno
function exportInvoicePDF_Bs(invoice: Invoice, tenant: Tenant, ivaPercentage: number, isProforma: boolean, documentTitle: string) {
  const doc = new jsPDF();
  const exchangeRate = invoice.metadata?.exchangeRateUsed || 36.50;
  const itemsPerPage = 15; // 15 items por página para el diseño moderno
  const totalPages = Math.ceil(invoice.items.length / itemsPerPage);
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) doc.addPage();
    
    const startIdx = pageNum * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, invoice.items.length);
    const pageItems = invoice.items.slice(startIdx, endIdx);
    
    // Calcular totales en Bs
    const subtotalBs = invoice.subtotal * exchangeRate;
    const ivaBs = invoice.taxTotal * exchangeRate;
    const totalBs = invoice.total * exchangeRate;
    
    // ============ ENCABEZADO ============
    doc.setFillColor(30, 41, 59); // slate-900
    doc.rect(0, 0, 210, 4, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(tenant.fiscalName || tenant.name || 'EMPRESA', 14, 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(tenant.commercialName || 'Soluciones ERP', 14, 20);
    
    // Info derecha
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`RIF: ${tenant.rif || 'J-00000000-0'}`, 196, 15, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const addressLine = tenant.address || 'Dirección de la empresa';
    doc.text(addressLine, 196, 19, { align: 'right' });
    doc.text(`Tel: ${tenant.phone || '0000-0000000'}`, 196, 23, { align: 'right' });
    
    // ============ SECCIÓN CLIENTE Y FACTURA ============
    const topY = 32;
    
    // Cuadro Cliente (izquierda)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, topY, 90, 32, 3, 3, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('DATOS DEL CLIENTE', 18, topY + 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const empresa = invoice.customer_empresa || invoice.metadata?.empresa || invoice.customerName;
    doc.text(empresa.substring(0, 35), 18, topY + 12);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`RIF: ${invoice.customer_rif || invoice.customerRif || 'N/A'}`, 18, topY + 17);
    
    const direccion = invoice.customer_direccion || invoice.metadata?.direccion || '';
    if (direccion) {
      doc.text(direccion.substring(0, 40), 18, topY + 22);
    }
    
    // Cuadro Factura (derecha)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1);
    doc.roundedRect(108, topY, 88, 32, 3, 3, 'FD');
    
    // Badge "Factura Fiscal - Bs"
    doc.setFillColor(30, 41, 59);
    doc.rect(108, topY, 40, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('FACTURA FISCAL - Bs', 128, topY + 4, { align: 'center' });
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7);
    doc.text('Factura N°', 112, topY + 12);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.number, 112, topY + 18);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha:', 112, topY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.date), 112, topY + 29);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Tasa BCV:', 155, topY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${exchangeRate.toFixed(2)} Bs/USD`, 155, topY + 29);
    
    // ============ TABLA DE ITEMS ============
    const tableStartY = 72;
    
    // Encabezado
    doc.setFillColor(30, 41, 59);
    doc.rect(14, tableStartY, 182, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('CÓDIGO', 18, tableStartY + 5);
    doc.text('DESCRIPCIÓN', 50, tableStartY + 5);
    doc.text('CANT.', 130, tableStartY + 5, { align: 'center' });
    doc.text('PRECIO UNIT. (Bs)', 160, tableStartY + 5, { align: 'right' });
    doc.text('TOTAL (Bs)', 192, tableStartY + 5, { align: 'right' });
    
    // Items
    let currentY = tableStartY + 8;
    const rowHeight = 5.5;
    
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    for (let i = 0; i < 15; i++) {
      const item = pageItems[i];
      
      // Fondo zebra
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, rowHeight, 'F');
      }
      
      // Línea
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(14, currentY + rowHeight, 196, currentY + rowHeight);
      
      if (item) {
        const precioBs = item.price * exchangeRate;
        const totalBsItem = (item.total || (item.price * item.quantity)) * exchangeRate;
        
        doc.setTextColor(100, 116, 139);
        doc.text(item.name.substring(0, 10), 18, currentY + 3.5);
        
        doc.setTextColor(30, 41, 59);
        doc.text(item.name.substring(0, 45), 50, currentY + 3.5);
        doc.text(item.quantity.toString(), 130, currentY + 3.5, { align: 'center' });
        doc.text(precioBs.toFixed(2), 160, currentY + 3.5, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.text(totalBsItem.toFixed(2), 192, currentY + 3.5, { align: 'right' });
        doc.setFont('helvetica', 'normal');
      }
      
      currentY += rowHeight;
    }
    
    // ============ TOTALES ============
    const totalsY = currentY + 5;
    
    // Cuadro IGTF (izquierda)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, totalsY, 80, 25, 2, 2, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('CALCULADORA IGTF (3%)', 18, totalsY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Pago en Divisas:', 18, totalsY + 11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`$${invoice.total.toFixed(2)}`, 18, totalsY + 16);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('IGTF Causado:', 18, totalsY + 21);
    doc.setFont('helvetica', 'bold');
    const igtfBs = invoice.total * exchangeRate * 0.03;
    doc.text(`${igtfBs.toFixed(2)} Bs`, 50, totalsY + 21);
    
    // Cuadro Totales (derecha)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(100, totalsY, 96, 25, 2, 2, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('BASE IMPONIBLE', 105, totalsY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${subtotalBs.toFixed(2)} Bs`, 192, totalsY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`IVA (${ivaPercentage}%)`, 105, totalsY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${ivaBs.toFixed(2)} Bs`, 192, totalsY + 10, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('IGTF (3%)', 105, totalsY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(`${igtfBs.toFixed(2)} Bs`, 192, totalsY + 15, { align: 'right' });
    
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(105, totalsY + 17, 192, totalsY + 17);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL FACTURA', 105, totalsY + 22);
    doc.setFontSize(14);
    doc.text(`${(totalBs + igtfBs).toFixed(2)} Bs`, 192, totalsY + 22, { align: 'right' });
    
    // Equivalente en USD
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(37, 99, 235);
    doc.text(`Equiv. $${invoice.total.toFixed(2)}`, 192, totalsY + 26, { align: 'right' });
    
    // Pie de página
    if (pageNum === totalPages - 1) {
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('Emitido electrónicamente por Violet ERP', 105, 285, { align: 'center' });
    }
  }
  
  const fileName = isProforma ? `Proforma_${invoice.number}.pdf` : `Factura_Bs_${invoice.number}.pdf`;
  doc.save(fileName);
}

// Función para exportar factura en DÓLARES
function exportInvoicePDF_USD(invoice: Invoice, tenant: Tenant, ivaPercentage: number, isProforma: boolean, documentTitle: string) {
  const doc = new jsPDF();
  
  // Dividir items en páginas
  const itemsPerPage = ITEMS_PER_PAGE;
  const totalPages = Math.ceil(invoice.items.length / itemsPerPage);
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    if (pageNum > 0) doc.addPage();
    
    const startIdx = pageNum * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, invoice.items.length);
    const pageItems = invoice.items.slice(startIdx, endIdx);
    
    // ============ ENCABEZADO EMPRESA ============
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    
    // Título principal
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(tenant.fiscalName || tenant.name || 'Inversiones y Confecciones', 105, 15, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.text(tenant.commercialName || 'A.E. Araujo. F.P.', 105, 21, { align: 'center' });
    
    // Dirección línea 1
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const addressLine1 = tenant.address || 'Calle Pelton entre Bolívar y Mariño CC Comuna Mercados Tovar Nivel PB Local 19';
    doc.text(addressLine1, 105, 26, { align: 'center' });
    
    // Dirección línea 2
    const addressParts = [];
    if (tenant.sector) addressParts.push(tenant.sector);
    if (tenant.city) addressParts.push(tenant.city);
    if (tenant.state) addressParts.push(tenant.state);
    if (tenant.postalCode) addressParts.push(`Zona Postal ${tenant.postalCode}`);
    
    const addressLine2 = addressParts.length > 0 
      ? addressParts.join(' ') + ` - Telf.: ${tenant.phone || '(0244) 661.21.54'}`
      : `Sector Centro Turnero Aragua Zona Postal 2115 - Telf.: ${tenant.phone || '(0244) 661.21.54'}`;
    
    doc.text(addressLine2, 105, 30, { align: 'center' });
    
    // RIF
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`RIF.: ${tenant.rif || 'V244451043'}`, 105, 36, { align: 'center' });
    
    // ============ CUADRO FECHA Y FACTURA ============
    const topBoxY = 42;
    
    // Cuadro grande de fecha (izquierda)
    doc.rect(14, topBoxY, 82, 10);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Lugar y Fecha de Emisión', 16, topBoxY + 4);
    
    const dateObj = new Date(invoice.date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    // Divisiones internas del cuadro de fecha
    doc.line(14, topBoxY + 5, 96, topBoxY + 5); // Línea horizontal
    
    // Día
    doc.line(30, topBoxY + 5, 30, topBoxY + 10); // Línea vertical
    doc.setFontSize(6);
    doc.text('Día', 17, topBoxY + 7.5);
    doc.setFontSize(8);
    doc.text(day.toString(), 22, topBoxY + 9);
    
    // Mes
    doc.line(46, topBoxY + 5, 46, topBoxY + 10); // Línea vertical
    doc.setFontSize(6);
    doc.text('Mes', 33, topBoxY + 7.5);
    doc.setFontSize(8);
    doc.text(month.toString(), 38, topBoxY + 9);
    
    // Año
    doc.line(62, topBoxY + 5, 62, topBoxY + 10); // Línea vertical
    doc.setFontSize(6);
    doc.text('Año', 49, topBoxY + 7.5);
    doc.setFontSize(8);
    doc.text(year.toString(), 70, topBoxY + 9);
    
    // Cuadro FACTURA (derecha)
    doc.rect(96, topBoxY, 100, 10);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(documentTitle, 146, topBoxY + 7, { align: 'center' });
    
    // ============ INFORMACIÓN DEL CLIENTE ============
    const clientBoxY = 56;
    
    // Cuadro principal del cliente
    doc.rect(14, clientBoxY, 182, 24);
    
    // Nombre o Razón Social
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Nombre o', 16, clientBoxY + 4);
    doc.text('Razón Social:', 16, clientBoxY + 7);
    
    // Nombre de la empresa en NEGRILLAS al lado
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const empresa = invoice.customer_empresa || invoice.metadata?.empresa || invoice.customerName;
    doc.text(empresa, 40, clientBoxY + 6);
    
    // Domicilio Fiscal
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Domicilio', 16, clientBoxY + 13);
    doc.text('Fiscal:', 16, clientBoxY + 16);
    
    doc.setFontSize(8);
    const direccion = invoice.customer_direccion || invoice.metadata?.direccion || '';
    doc.text(direccion, 40, clientBoxY + 15);
    
    // Línea horizontal divisoria
    doc.line(14, clientBoxY + 20, 196, clientBoxY + 20);
    
    // Fila inferior con RIF, Teléfono, Condiciones
    const bottomRowY = clientBoxY + 24;
    
    // RIF
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const rif = invoice.customer_rif || invoice.customerRif || '';
    doc.text(rif, 16, bottomRowY);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('RIF', 45, bottomRowY);
    
    // Línea vertical
    doc.line(88, clientBoxY + 20, 88, clientBoxY + 28);
    
    // Teléfono
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const telefono = invoice.customer_contacto || invoice.metadata?.contacto || '';
    doc.text(telefono, 90, bottomRowY);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Teléfono', 120, bottomRowY);
    
    // Línea vertical
    doc.line(138, clientBoxY + 20, 138, clientBoxY + 28);
    
    // Condiciones de Pago
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Condiciones de Pago', 160, bottomRowY - 2);
    
    doc.setFontSize(6);
    
    // Checkboxes
    doc.rect(140, clientBoxY + 21, 2, 2);
    doc.text('Contado', 143, bottomRowY - 1);
    
    doc.rect(140, clientBoxY + 24, 2, 2);
    doc.text('Crédito', 143, bottomRowY + 2);
    doc.text('_____ días', 153, bottomRowY + 2);
    
    // ============ TABLA DE ITEMS ============
    const tableStartY = 92;
    
    // Encabezado de tabla con fondo negro
    doc.setFillColor(0, 0, 0);
    doc.rect(14, tableStartY, 182, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Líneas verticales del encabezado
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(30, tableStartY, 30, tableStartY + 8);
    doc.line(145, tableStartY, 145, tableStartY + 8);
    doc.line(170, tableStartY, 170, tableStartY + 8);
    
    // Textos del encabezado
    doc.text('Cant.', 22, tableStartY + 5, { align: 'center' });
    doc.text('Concepto o Descripción', 87.5, tableStartY + 5, { align: 'center' });
    
    doc.setFontSize(7);
    doc.text('Precio', 157.5, tableStartY + 3.5);
    doc.text('Unitario', 155, tableStartY + 6.5);
    
    doc.setFontSize(8);
    doc.text('Precio Total', 183, tableStartY + 5, { align: 'center' });
    
    // Cuerpo de la tabla
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    let currentY = tableStartY + 8;
    const rowHeight = 5.5; // Altura reducida para 20 filas
    const maxRows = 20;
    
    for (let i = 0; i < maxRows; i++) {
      const item = pageItems[i];
      
      // Líneas de la fila
      doc.line(14, currentY, 196, currentY); // Línea horizontal superior
      doc.line(14, currentY, 14, currentY + rowHeight); // Izquierda
      doc.line(30, currentY, 30, currentY + rowHeight); // Después de cantidad
      doc.line(145, currentY, 145, currentY + rowHeight); // Antes de precio unitario
      doc.line(170, currentY, 170, currentY + rowHeight); // Antes de precio total
      doc.line(196, currentY, 196, currentY + rowHeight); // Derecha
      
      if (item) {
        doc.setFontSize(7);
        doc.text(item.quantity.toString(), 22, currentY + 3.5, { align: 'center' });
        
        // Descripción
        const descripcion = item.name.substring(0, 70);
        doc.text(descripcion, 32, currentY + 3.5);
        
        // Precios
        doc.text(formatCurrency(item.price, 'USD'), 167, currentY + 3.5, { align: 'right' });
        doc.text(formatCurrency(item.total || (item.price * item.quantity), 'USD'), 194, currentY + 3.5, { align: 'right' });
      }
      
      currentY += rowHeight;
    }
    
    // Línea final de la tabla
    doc.line(14, currentY, 196, currentY);
    
    // ============ SECCIÓN INFERIOR (EN CADA PÁGINA) ============
    const bottomY = currentY + 2;
    
    // ============ CUADRO IZQUIERDO: Nº DE CONTROL Y FORMA DE PAGO ============
    doc.setLineWidth(0.5);
    doc.rect(14, bottomY, 115, 28);
    
    // Nº DE CONTROL con fondo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nº DE CONTROL', 16, bottomY + 5);
    doc.text(invoice.number, 48, bottomY + 5);
    
    // Línea horizontal debajo de Nº DE CONTROL
    doc.line(14, bottomY + 7, 129, bottomY + 7);
    
    // FORMA DE PAGO
    doc.setFontSize(7);
    doc.text('FORMA', 16, bottomY + 11);
    doc.text('DE PAGO', 16, bottomY + 14);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    
    // Checkboxes primera fila
    doc.rect(30, bottomY + 9.5, 2.5, 2.5);
    doc.text('Efectivo', 34, bottomY + 11.5);
    
    doc.rect(55, bottomY + 9.5, 2.5, 2.5);
    doc.text('Transferencia', 59, bottomY + 11.5);
    
    // Checkboxes segunda fila
    doc.rect(30, bottomY + 13, 2.5, 2.5);
    doc.text('T. Débito', 34, bottomY + 15);
    
    doc.rect(55, bottomY + 13, 2.5, 2.5);
    doc.text('Otros', 59, bottomY + 15);
    
    // Nº y Banco
    doc.text('Nº', 30, bottomY + 19);
    doc.text('_______________', 35, bottomY + 19);
    
    doc.text('Banco:', 16, bottomY + 23);
    doc.text('_______________', 28, bottomY + 23);
    
    doc.text('Recibí Conforme', 75, bottomY + 26);
    
    // ============ CUADRO DERECHO: TOTALES ============
    doc.rect(129, bottomY, 67, 28);
    
    // Líneas horizontales divisorias
    doc.line(129, bottomY + 7, 196, bottomY + 7);
    doc.line(129, bottomY + 14, 196, bottomY + 14);
    doc.line(129, bottomY + 21, 196, bottomY + 21);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    
    // EXENTO
    doc.text('EXENTO', 160, bottomY + 4.5);
    doc.text(formatCurrency(0, 'USD'), 193, bottomY + 4.5, { align: 'right' });
    
    // BASE IMPONIBLE
    doc.text('BASE IMPONIBLE', 148, bottomY + 11.5);
    doc.text(formatCurrency(invoice.subtotal, 'USD'), 193, bottomY + 11.5, { align: 'right' });
    
    // IVA
    doc.text('IVA', 160, bottomY + 17);
    doc.setFontSize(6);
    doc.text(`${ivaPercentage}%`, 170, bottomY + 17);
    doc.setFontSize(7);
    doc.text(formatCurrency(invoice.taxTotal, 'USD'), 193, bottomY + 18.5, { align: 'right' });
    
    // TOTAL A PAGAR
    doc.setFontSize(8);
    doc.text('TOTAL A PAGAR', 148, bottomY + 25.5);
    doc.text(formatCurrency(invoice.total, 'USD'), 193, bottomY + 25.5, { align: 'right' });
    
    // ============ PIE DE PÁGINA ============
    const footerY = bottomY + 33;
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTA FACTURA VA SIN TACHADURA NI ENMIENDADURAS', 105, footerY, { align: 'center' });
    
    // Línea horizontal
    doc.setLineWidth(0.3);
    doc.line(14, footerY + 2, 196, footerY + 2);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ORIGINAL (BLANCO): CLIENTE', 50, footerY + 6);
    doc.text('COPIA (color): sin derecho a crédito fiscal', 150, footerY + 6);
    
    // Número de página
    if (totalPages > 1) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${pageNum + 1} de ${totalPages}`, 105, footerY + 10, { align: 'center' });
    }
  }
  
  const fileName = isProforma ? `Proforma_${invoice.number}.pdf` : `Factura_${invoice.number}.pdf`;
  doc.save(fileName);
};

export const exportInvoiceExcel = (invoice: Invoice, tenant: Tenant) => {
  const wb = XLSX.utils.book_new();
  const isProforma = invoice.type === 'pedido';
  const documentTitle = isProforma ? 'PROFORMA' : 'FACTURA';
  
  const itemsPerPage = ITEMS_PER_PAGE;
  const totalPages = Math.ceil(invoice.items.length / itemsPerPage);
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startIdx = pageNum * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, invoice.items.length);
    const pageItems = invoice.items.slice(startIdx, endIdx);
    
    const dateObj = new Date(invoice.date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    const wsData: any[][] = [
      [tenant.fiscalName || tenant.name || 'Inversiones y Confecciones'],
      [tenant.commercialName || 'A.E. Araujo. F.P.'],
      [tenant.address || 'Calle Pelton entre Bolívar y Mariño CC Comuna Mercados Tovar Nivel PB Local 19'],
      [`Sector Centro Turnero Aragua Zona Postal 2115 - Telf.: ${tenant.phone || '(0244) 661.21.54'}`],
      [`RIF.: ${tenant.rif || 'V244451043'}`],
      [],
      ['Lugar y Fecha de Emisión', day, month, year, '', documentTitle],
      [],
      ['Nombre o Razón Social:', invoice.customer_empresa || invoice.metadata?.empresa || invoice.customerName],
      ['Domicilio Fiscal:', invoice.customer_direccion || invoice.metadata?.direccion || ''],
      [],
      ['RIF', invoice.customer_rif || invoice.customerRif || '', 'Teléfono', invoice.customer_contacto || invoice.metadata?.contacto || '', 'Condiciones de Pago', 'Contado'],
      [],
      ['Cant.', 'Concepto o Descripción', 'Precio Unitario', 'Precio Total'],
      ...pageItems.map(item => [
        item.quantity,
        item.name,
        item.price,
        item.total || (item.price * item.quantity)
      ])
    ];
    
    const currentRows = pageItems.length;
    for (let i = currentRows; i < 20; i++) {
      wsData.push(['', '', '', '']);
    }
    
    if (pageNum === totalPages - 1) {
      wsData.push(
        [],
        [`Nº DE CONTROL ${invoice.number}`, '', 'EXENTO', 0],
        ['FORMA DE PAGO: Contado', '', 'BASE IMPONIBLE', invoice.subtotal],
        ['', '', 'IVA', invoice.taxTotal],
        ['', '', 'TOTAL A PAGAR', invoice.total],
        [],
        ['ESTA FACTURA VA SIN TACHADURA NI ENMIENDADURAS'],
        ['ORIGINAL (BLANCO): CLIENTE', '', 'COPIA (color): sin derecho a crédito fiscal']
      );
      
      if (totalPages > 1) {
        wsData.push([`Página ${pageNum + 1} de ${totalPages}`]);
      }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 8 },
      { wch: 60 },
      { wch: 15 },
      { wch: 15 },
      { wch: 5 },
      { wch: 20 }
    ];
    
    const sheetName = totalPages > 1 ? `${documentTitle}_Pag${pageNum + 1}` : documentTitle;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  
  const fileName = isProforma ? `Proforma_${invoice.number}.xlsx` : `Factura_${invoice.number}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
