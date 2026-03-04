import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/shared/components/ui/button';
import { Printer, Download, FileSpreadsheet, X } from 'lucide-react';
import { localDb } from '@/lib/localDb';
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import * as XLSX from 'xlsx';

// Helper function para formatear números de forma segura con formato español (comas)
const safeFormatNumber = (value: any, locale: string = 'es-VE'): string => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return '0,00';
  }
  return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function InvoicePreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('id');
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tenant, exchangeRate, taxes } = useSystemConfig();

  useEffect(() => {
    const loadInvoice = async () => {
      if (invoiceId) {
        const inv = await localDb.invoices.get(invoiceId);
        
        // Si la factura tiene items sin descripción, buscar los productos
        if (inv && inv.items) {
          const itemsWithDescription = await Promise.all(
            inv.items.map(async (item: any) => {
              if (!item.description && !item.product_name) {
                // Buscar el producto por ID
                const product = await localDb.products.get(item.product_id);
                if (product) {
                  return {
                    ...item,
                    name: product.cauplas || item.name,
                    description: product.name,
                    product_name: product.name
                  };
                }
              }
              return item;
            })
          );
          inv.items = itemsWithDescription;
        }
        
        setInvoice(inv);
      }
      setLoading(false);
    };
    loadInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!invoice || !invoice.items || invoice.items.length === 0) return;
    
    const wsData: any[][] = [
      [tenant?.fiscalName || tenant?.name || 'VELOCITY CORP'],
      [tenant?.commercialName || 'Soluciones ERP Avanzadas'],
      [`RIF: ${tenant?.rif || 'J-12345678-9'}`],
      [],
      ['DATOS DEL CLIENTE'],
      [invoice.customer_empresa || invoice.customerName],
      [`RIF: ${invoice.customer_rif || invoice.customerRif}`],
      [invoice.customer_direccion || ''],
      [],
      ['Factura N°', invoice.number],
      ['Fecha', new Date(invoice.date).toLocaleDateString()],
      [],
      ['Código', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total'],
      ...invoice.items.map((item: any) => [
        item.product_id || item.name,
        item.name,
        item.quantity,
        item.price,
        item.total || (item.price * item.quantity)
      ]),
      [],
      ['', '', '', 'Subtotal', invoice.subtotal],
      ['', '', '', `IVA (${taxes?.iva_general || 16}%)`, invoice.taxTotal],
      ['', '', '', 'TOTAL', invoice.total]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Factura');
    XLSX.writeFile(wb, `Factura_${invoice.number}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Factura no encontrada</p>
          <Button onClick={() => navigate('/sales')}>Volver a Ventas</Button>
        </div>
      </div>
    );
  }

  const currency = invoice.metadata?.currency || 'USD';
  const isBs = currency === 'VES';
  const rate = invoice.metadata?.exchangeRateUsed || exchangeRate;

  return (
    <>
      {/* Action Bar - No se imprime */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/sales')}
              className="rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Vista Previa - {invoice.number}</h1>
              <p className="text-xs text-muted-foreground">
                {invoice.type === 'pedido' ? 'Proforma' : 'Factura'} • {currency}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleSavePDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido de la factura */}
      <div className="pt-20 no-print-padding">
        {isBs ? (
          function InvoiceTemplateBs({ invoice, tenant, rate, taxes }: any) {
            if (!invoice) {
              console.error('Invoice is null or undefined');
              return <div className="p-8 text-center">Error: No se encontró la factura</div>;
            }

            if (!invoice.items || !Array.isArray(invoice.items)) {
              console.error('Invoice items is not an array:', invoice.items);
              return <div className="p-8 text-center">Error: La factura no tiene items válidos</div>;
            }

            const subtotalBs = (invoice.subtotal || 0) * rate;
            const ivaBs = (invoice.taxTotal || 0) * rate;
            const totalBs = (invoice.total || 0) * rate;
            const igtfBs = (invoice.total || 0) * rate * 0.03;
            const totalConIgtf = totalBs + igtfBs;

            // Paginación: 15 items por página
            const ITEMS_PER_PAGE = 15;
            const totalPages = Math.ceil(invoice.items.length / ITEMS_PER_PAGE);
            const pages = [];

            for (let i = 0; i < totalPages; i++) {
              const startIdx = i * ITEMS_PER_PAGE;
              const endIdx = startIdx + ITEMS_PER_PAGE;
              const pageItems = invoice.items.slice(startIdx, endIdx);
              pages.push({
                pageNumber: i + 1,
                items: pageItems
              });
            }

            return (
              <>
                {pages.map((page, pageIdx) => (
                  <main key={pageIdx} className="mx-auto flex justify-center p-4 md:p-12 page-break">
                    <article 
                      className="invoice-container bg-white rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                      style={{ width: '8.5in', minHeight: '11in' }}
                    >
                      {/* Barra superior gradiente */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-slate-900 to-blue-600" />

                      {/* Header */}
                      <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-2xl">V</span>
                            </div>
                            <div>
                              <h1 className="font-bold text-2xl tracking-tight text-slate-900 uppercase">
                                {tenant?.fiscalName || tenant?.name || 'VELOCITY CORP'}
                              </h1>
                              <p className="text-xs font-medium text-blue-600 tracking-widest uppercase">
                                {tenant?.commercialName || 'Soluciones ERP Avanzadas'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">RIF: {tenant?.rif || 'J-12345678-9'}</p>
                          <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                            {tenant?.address || 'Dirección no especificada'}<br />
                            {tenant?.phone && (
                              <>
                                Tel: {tenant.phone}<br />
                              </>
                            )}
                            {tenant?.email && `Email: ${tenant.email}`}
                          </p>
                        </div>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Cliente */}
                        <section className="bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-sm">
                          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Datos del Cliente
                          </h2>
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {invoice.customer_empresa || invoice.customerName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  RIF: {invoice.customer_rif || invoice.customerRif || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {invoice.customer_direccion || 'Dirección no especificada'}
                              </p>
                            </div>
                          </div>
                        </section>

                        {/* Factura */}
                        <section className="flex flex-col justify-between border-2 border-slate-900 rounded-2xl p-5 relative overflow-hidden bg-white">
                          <div className="absolute top-0 right-0 px-3 py-1 bg-slate-900 text-[10px] font-bold text-white uppercase tracking-tighter">
                            Factura Fiscal
                          </div>
                          <div className="grid grid-cols-2 gap-4 h-full">
                            <div className="flex flex-col justify-center border-r border-slate-100">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Factura N°</span>
                              <span className="text-xl font-mono font-medium text-slate-900">{invoice.number}</span>
                            </div>
                            <div className="flex flex-col justify-center pl-4">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Control N°</span>
                              <span className="text-xl font-mono font-medium text-blue-600">{invoice.number}</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Fecha de Emisión</p>
                              <p className="text-sm font-semibold text-slate-700">
                                {new Date(invoice.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Tasa BCV</p>
                              <p className="text-sm font-mono font-medium text-slate-700">{rate.toFixed(2)} Bs./USD</p>
                            </div>
                          </div>
                        </section>
                      </div>

                      {/* Indicador de página */}
                      <div className="flex justify-end mb-3">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                          Página {page.pageNumber} de {totalPages}
                        </span>
                      </div>

                      {/* Tabla */}
                      <section className="mb-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b-2 border-slate-900">
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CAUPLAS</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cant.</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Bs.</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {page.items.map((item: any, idx: number) => (
                              <tr key={idx} className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-slate-50' : ''}`}>
                                <td className="py-3 px-3 font-mono text-xs text-slate-500">{item.product_id || item.name?.substring(0, 10) || 'N/A'}</td>
                                <td className="py-3 px-3 font-medium text-slate-900">{item.name || 'Sin descripción'}</td>
                                <td className="py-3 px-3 font-mono">{(item.quantity || 0).toFixed(2)}</td>
                                <td className="py-3 px-3 text-right font-mono">
                                  {safeFormatNumber((item.price || 0) * rate, 'es-VE')}
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                                  {safeFormatNumber((item.total || ((item.price || 0) * (item.quantity || 0))) * rate, 'es-VE')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>

                      {/* Totales - Solo en la última página */}
                      {page.pageNumber === totalPages && (
                        <section className="flex flex-col md:flex-row gap-6 items-start justify-between border-t border-slate-100 pt-6">
                          {/* IGTF */}
                          <div className="w-full md:w-1/3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                              Calculadora IGTF (3%)
                            </h3>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[10px] text-slate-500 font-medium mb-1">Pago en Divisas ($)</label>
                                <input 
                                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 font-mono text-sm text-slate-900"
                                  readOnly
                                  value={`$${safeFormatNumber(invoice.total, 'es-VE')}`}
                                />
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Monto IGTF Causado:</span>
                                <span className="font-bold text-slate-900 font-mono">
                                  {safeFormatNumber(igtfBs, 'es-VE')} Bs.
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Totales */}
                          <div className="w-full md:w-1/2 flex flex-col items-end">
                            <div className="w-full space-y-2">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-medium text-slate-500 uppercase">Base Imponible</span>
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                  {safeFormatNumber(subtotalBs, 'es-VE')} Bs.
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-medium text-slate-500 uppercase">IVA ({taxes?.iva_general || 16}%)</span>
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                  {safeFormatNumber(ivaBs, 'es-VE')} Bs.
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <div className="flex flex-col items-start">
                                  <span className="text-xs font-medium text-slate-500 uppercase">IGTF (3%)</span>
                                  <span className="text-[9px] text-slate-400">(Sobre ${safeFormatNumber(invoice.total, 'es-VE')} pagados)</span>
                                </div>
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                  {safeFormatNumber(igtfBs, 'es-VE')} Bs.
                                </span>
                              </div>
                              <div className="h-px bg-slate-900 w-full my-3" />
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Total Factura</span>
                                <div className="text-right">
                                  <span className="block text-3xl font-bold text-slate-950 tracking-tighter">
                                    {safeFormatNumber(totalConIgtf, 'es-VE')} Bs.
                                  </span>
                                  <span className="text-xs font-mono font-medium text-blue-600">
                                    Equiv. ${safeFormatNumber(invoice.total, 'es-VE')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* Footer */}
                      <footer className="mt-12 pt-6 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                          <div className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">
                            <p className="font-bold text-slate-600 mb-1">Información de Imprenta Autorizada</p>
                            <p>Imprenta Digital Global, S.A. | RIF: J-00123456-0</p>
                            <p>Providencia SENIAT N° 00045/2023 | Fecha: 01/01/2023</p>
                            <p>Numeración: Desde 00004000 hasta 00005000</p>
                          </div>
                          <div className="flex flex-col md:items-end gap-2">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 flex items-center justify-center p-2 opacity-60">
                              <div className="w-full h-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                                <span className="text-[8px] text-center px-1 font-bold text-slate-300">QR CODE</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Emitido por Violet ERP v2.4.0</p>
                          </div>
                        </div>
                      </footer>
                    </article>
                  </main>
                ))}
              </>
            );
          }

        ) : (
          <InvoiceTemplateUSD invoice={invoice} tenant={tenant} taxes={taxes} />
        )}
      </div>

      <style>{`
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .no-print-padding { padding-top: 0 !important; }
          .invoice-container { box-shadow: none !important; margin: 0 !important; }
          .page-break { page-break-after: always; }
          .page-break:last-child { page-break-after: auto; }
          @page { size: 8.5in 11in; margin: 0; }
        }
      `}</style>
    </>
  );
}

// Template para Bolívares
function InvoiceTemplateBs({ invoice, tenant, rate, taxes }: any) {
  if (!invoice) {
    console.error('Invoice is null or undefined');
    return <div className="p-8 text-center">Error: No se encontró la factura</div>;
  }
  
  if (!invoice.items || !Array.isArray(invoice.items)) {
    console.error('Invoice items is not an array:', invoice.items);
    return <div className="p-8 text-center">Error: La factura no tiene items válidos</div>;
  }
  
  const subtotalBs = (invoice.subtotal || 0) * rate;
  const ivaBs = (invoice.taxTotal || 0) * rate;
  const totalBs = (invoice.total || 0) * rate;
  const igtfBs = (invoice.total || 0) * rate * 0.03;
  const totalConIgtf = totalBs + igtfBs;

  // Paginación: 15 items por página
  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(invoice.items.length / ITEMS_PER_PAGE);
  const pages = [];
  
  for (let i = 0; i < totalPages; i++) {
    const startIdx = i * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageItems = invoice.items.slice(startIdx, endIdx);
    
    // Calcular totales de esta página
    const pageSubtotal = pageItems.reduce((sum: number, item: any) => {
      return sum + ((item.total || ((item.price || 0) * (item.quantity || 0))));
    }, 0);
    
    // Solo calcular IVA si withIva es true
    const pageIva = invoice.metadata?.withIva ? pageSubtotal * ((taxes?.iva_general || 16) / 100) : 0;
    const pageTotal = pageSubtotal + pageIva;
    const pageSubtotalBs = pageSubtotal * rate;
    const pageIvaBs = pageIva * rate;
    const pageTotalBs = pageTotal * rate;
    const pageIgtfBs = pageTotal * rate * 0.03;
    const pageTotalConIgtf = pageTotalBs + pageIgtfBs;
    
    pages.push({
      pageNumber: i + 1,
      items: pageItems,
      subtotal: pageSubtotal,
      iva: pageIva,
      total: pageTotal,
      subtotalBs: pageSubtotalBs,
      ivaBs: pageIvaBs,
      totalBs: pageTotalBs,
      igtfBs: pageIgtfBs,
      totalConIgtf: pageTotalConIgtf
    });
  }

  return (
    <>
      {pages.map((page, pageIdx) => (
        <main key={pageIdx} className="mx-auto flex justify-center p-4 md:p-12 page-break">
          <article 
            className="invoice-container bg-white rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            style={{ width: '8.5in', minHeight: '11in' }}
          >
            {/* Barra superior gradiente */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-slate-900 to-blue-600" />

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
              ) : (
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">V</span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-2xl tracking-tight text-slate-900 uppercase">
                  {tenant?.fiscalName || tenant?.name || 'VELOCITY CORP'}
                </h1>
                <p className="text-xs font-medium text-blue-600 tracking-widest uppercase">
                  {tenant?.commercialName || 'Soluciones ERP Avanzadas'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">RIF: {tenant?.rif || 'J-12345678-9'}</p>
            <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
              {tenant?.address || 'Dirección no especificada'}<br />
{tenant?.phone && (
                <>
                  Tel: {tenant.phone}<br />
                </>
              )}
              {tenant?.email && `Email: ${tenant.email}`}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Cliente */}
          <section className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Datos del Cliente
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {invoice.customer_empresa || invoice.customerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    RIF: {invoice.customer_rif || invoice.customerRif || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {invoice.customer_direccion || 'Dirección no especificada'}
                </p>
              </div>
            </div>
          </section>

          {/* Factura */}
          <section className="flex flex-col justify-between border-2 border-slate-900 rounded-2xl p-6 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-900 text-[10px] font-bold text-white uppercase tracking-tighter">
              Factura Fiscal
            </div>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col justify-center border-r border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Factura N°</span>
                <span className="text-xl font-mono font-medium text-slate-900">{invoice.number}</span>
              </div>
              <div className="flex flex-col justify-center pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Control N°</span>
                <span className="text-xl font-mono font-medium text-blue-600">{invoice.number}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Fecha de Emisión</p>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(invoice.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Tasa BCV</p>
                <p className="text-sm font-mono font-medium text-slate-700">{rate.toFixed(2)} Bs./USD</p>
              </div>
            </div>
          </section>
        </div>

        {/* Tabla */}
        <section className="mb-10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CAUPLAS</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cant.</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Bs.</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {page.items.map((item: any, idx: number) => (
                <tr key={idx} className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-slate-50' : ''}`}>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">{item.name || 'N/A'}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{item.description || item.product_name || 'Sin descripción'}</td>
                  <td className="py-3 px-3 font-mono">{safeFormatNumber(item.quantity || 0, 'es-VE')}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {safeFormatNumber((item.price || 0) * rate, 'es-VE')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {safeFormatNumber((item.total || ((item.price || 0) * (item.quantity || 0))) * rate, 'es-VE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totales - En todas las páginas */}
        <section className="flex flex-col md:flex-row gap-8 items-start justify-between border-t border-slate-100 pt-8">
          {/* IGTF - Solo en la última página */}
          {page.pageNumber === totalPages && (
            <div className="w-full md:w-1/3 bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Calculadora IGTF (3%)
              </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">Pago en Divisas ($)</label>
                <input 
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 font-mono text-sm text-slate-900"
                  readOnly
                  value={`$${safeFormatNumber(page.total, 'es-VE')}`}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Monto IGTF Causado:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {safeFormatNumber(page.igtfBs, 'es-VE')} Bs.
                </span>
              </div>
            </div>
            </div>
          )}

          {/* Totales */}
          <div className={`w-full ${page.pageNumber === totalPages ? 'md:w-1/2' : 'md:w-2/3 ml-auto'} flex flex-col items-end`}>
            <div className="w-full space-y-2 mb-4">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium text-slate-500 uppercase">Base Imponible</span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {safeFormatNumber(page.subtotalBs, 'es-VE')} Bs.
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium text-slate-500 uppercase">IVA ({taxes?.iva_general || 16}%)</span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {safeFormatNumber(page.ivaBs, 'es-VE')} Bs.
                </span>
              </div>
              {page.pageNumber === totalPages && (
                <div className="flex justify-between items-center py-1">
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-slate-500 uppercase">IGTF (3%)</span>
                    <span className="text-[9px] text-slate-400">(Sobre ${safeFormatNumber(page.total, 'es-VE')} pagados)</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {safeFormatNumber(page.igtfBs, 'es-VE')} Bs.
                  </span>
                </div>
              )}
              <div className="h-px bg-slate-900 w-full my-4" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900 uppercase tracking-tighter">TOTAL FACTURA</span>
                <div className="text-right">
                  <span className="block text-3xl font-bold text-slate-950 tracking-tighter">
                    {safeFormatNumber(page.pageNumber === totalPages ? page.totalConIgtf : page.totalBs, 'es-VE')} Bs.
                  </span>
                  <span className="text-xs font-mono font-medium text-blue-600">
                    Equiv. ${safeFormatNumber(page.total, 'es-VE')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">
              <p className="font-bold text-slate-600 mb-1">Información de Imprenta Autorizada</p>
              <p>Imprenta Digital Global, S.A. | RIF: J-00123456-0</p>
              <p>Providencia SENIAT N° 00045/2023 | Fecha: 01/01/2023</p>
              <p>Numeración: Desde 00004000 hasta 00005000</p>
            </div>
            <div className="flex justify-center items-center">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                Página {page.pageNumber} de {totalPages}
              </span>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 flex items-center justify-center p-2 opacity-60">
                <div className="w-full h-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-[8px] text-center px-1 font-bold text-slate-300">FISCAL QR CODE</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Emitido electrónicamente por Violet ERP v2.4.0</p>
            </div>
          </div>
        </footer>
      </article>
    </main>
      ))}
    </>
  );
}

// Template para USD
function InvoiceTemplateUSD({ invoice, tenant, taxes }: any) {
  if (!invoice) {
    console.error('Invoice is null or undefined');
    return <div className="p-8 text-center">Error: No se encontró la factura</div>;
  }
  
  if (!invoice.items || !Array.isArray(invoice.items)) {
    console.error('Invoice items is not an array:', invoice.items);
    return <div className="p-8 text-center">Error: La factura no tiene items válidos</div>;
  }
  
  // Paginación: 15 items por página
  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(invoice.items.length / ITEMS_PER_PAGE);
  const pages = [];
  
  for (let i = 0; i < totalPages; i++) {
    const startIdx = i * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageItems = invoice.items.slice(startIdx, endIdx);
    
    // Calcular totales de esta página
    const pageSubtotal = pageItems.reduce((sum: number, item: any) => {
      return sum + ((item.total || ((item.price || 0) * (item.quantity || 0))));
    }, 0);
    
    // Solo calcular IVA si withIva es true
    const pageIva = invoice.metadata?.withIva ? pageSubtotal * ((taxes?.iva_general || 16) / 100) : 0;
    const pageTotal = pageSubtotal + pageIva;
    
    pages.push({
      pageNumber: i + 1,
      items: pageItems,
      subtotal: pageSubtotal,
      iva: pageIva,
      total: pageTotal
    });
  }
  
  return (
    <>
      {pages.map((page, pageIdx) => (
        <main key={pageIdx} className="mx-auto flex justify-center p-4 md:p-12 page-break">
          <article 
            className="invoice-container bg-white rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            style={{ width: '8.5in', minHeight: '11in' }}
          >
            {/* Barra superior gradiente */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-slate-900 to-blue-600" />

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
              ) : (
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">V</span>
                </div>
              )}
              <div>
                <h1 className="font-bold text-2xl tracking-tight text-slate-900 uppercase">
                  {tenant?.fiscalName || tenant?.name || 'VELOCITY CORP'}
                </h1>
                <p className="text-xs font-medium text-blue-600 tracking-widest uppercase">
                  {tenant?.commercialName || 'Soluciones ERP Avanzadas'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">RIF: {tenant?.rif || 'J-12345678-9'}</p>
            <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
              {tenant?.address || 'Dirección no especificada'}<br />
{tenant?.phone && (
                <>
                  Tel: {tenant.phone}<br />
                </>
              )}
              {tenant?.email && `Email: ${tenant.email}`}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Cliente */}
          <section className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Datos del Cliente
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {invoice.customer_empresa || invoice.customerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    RIF: {invoice.customer_rif || invoice.customerRif || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="h-4 w-4 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {invoice.customer_direccion || 'Dirección no especificada'}
                </p>
              </div>
            </div>
          </section>

          {/* Factura */}
          <section className="flex flex-col justify-between border-2 border-slate-900 rounded-2xl p-6 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 px-3 py-1 bg-slate-900 text-[10px] font-bold text-white uppercase tracking-tighter">
              Factura Internacional - USD
            </div>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col justify-center border-r border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Factura N°</span>
                <span className="text-xl font-mono font-medium text-slate-900">{invoice.number}</span>
              </div>
              <div className="flex flex-col justify-center pl-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Control N°</span>
                <span className="text-xl font-mono font-medium text-blue-600">{invoice.number}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Fecha de Emisión</p>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(invoice.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Tabla */}
        <section className="mb-10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CAUPLAS</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cantidad</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total USD</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {page.items.map((item: any, idx: number) => (
                <tr key={idx} className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-slate-50' : ''}`}>
                  <td className="py-4 px-4 font-mono text-xs text-slate-500">{item.name || 'N/A'}</td>
                  <td className="py-4 px-4 font-medium text-slate-900">{item.description || item.product_name || 'Sin descripción'}</td>
                  <td className="py-4 px-4 font-mono">{safeFormatNumber(item.quantity || 0, 'es-VE')}</td>
                  <td className="py-4 px-4 text-right font-mono">
                    {safeFormatNumber(item.price || 0, 'es-VE')}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">
                    {safeFormatNumber((item.total || ((item.price || 0) * (item.quantity || 0))), 'es-VE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totales - En todas las páginas */}
        <section className="flex flex-col md:flex-row gap-8 items-start justify-between border-t border-slate-100 pt-8">
          <div className="w-full md:w-2/3 flex flex-col items-end ml-auto">
            <div className="w-full space-y-2 mb-4">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium text-slate-500 uppercase">Base Imponible</span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  $ {safeFormatNumber(page.subtotal, 'es-VE')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-medium text-slate-500 uppercase">IVA ({taxes?.iva_general || 16}%)</span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  $ {safeFormatNumber(page.iva, 'es-VE')}
                </span>
              </div>
              <div className="h-px bg-slate-900 w-full my-4" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900 uppercase tracking-tighter">TOTAL FACTURA</span>
                <div className="text-right">
                  <span className="block text-3xl font-bold text-slate-950 tracking-tighter">
                    $ {safeFormatNumber(page.total, 'es-VE')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">
              <p className="font-bold text-slate-600 mb-1">Información de Imprenta Autorizada</p>
              <p>Imprenta Digital Global, S.A. | RIF: J-00123456-0</p>
              <p>Providencia SENIAT N° 00045/2023 | Fecha: 01/01/2023</p>
              <p>Numeración: Desde 00004000 hasta 00005000</p>
            </div>
            <div className="flex justify-center items-center">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                Página {page.pageNumber} de {totalPages}
              </span>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 flex items-center justify-center p-2 opacity-60">
                <div className="w-full h-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-[8px] text-center px-1 font-bold text-slate-300">FISCAL QR CODE</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Emitido electrónicamente por Violet ERP v2.4.0</p>
            </div>
          </div>
        </footer>
      </article>
    </main>
      ))}
    </>
  );
}
