const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { executeSql } = require('./db.cjs');

let io = null;
let serverInstance = null;
const PORT = 8080;
let connectedNodes = []; // Array of { id, ip, connectedAt }

function startLocalServer() {
  if (serverInstance) return;

  const app = express();
  serverInstance = http.createServer(app);
  
  // Setup Socket.io
  io = new Server(serverInstance, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve the React frontend (Vite compiled output)
  const path = require('path');
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // Basic API Endpoint for Testing/Sync
  app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'Master Server is running', nodes: connectedNodes });
  });

  // API to execute raw SQL (Requires strict security in real production, filtering here is simplified)
  app.post('/api/sql', (req, res) => {
    try {
      const { query, params } = req.body;
      const result = executeSql(query, params || []);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('[API:sql] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const { getDb } = require('./db.cjs');

  // Business Logic: Process Sale Atomically
  app.post('/api/transactions/sale', (req, res) => {
    try {
      const db = getDb();
      const { tenantId, customerName, customerRif, items, subtotal, taxIva, taxIgtf, total, metadata, number, date } = req.body;
      const docType = metadata?.type || 'venta';
      const status = metadata?.status || (docType === 'venta' ? 'PAID' : 'PENDING');
      
      const processSale = db.transaction(() => {
        // 1. Create Invoice/Document
        const invoiceId = req.body.id || require('crypto').randomUUID();
        db.prepare(`
          INSERT INTO sales_invoices (
            id, tenant_id, customer_name, customer_rif, subtotal, tax_iva, tax_igtf, total, status, type,
            control_number, iva_withholding_percentage, iva_withholding_amount, total_ves, exchange_rate_used, parent_id, notes, number, date, metadata
          )
          VALUES ,(? ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceId, 
          tenantId, 
          customerName, 
          customerRif, 
          subtotal, 
          taxIva, 
          taxIgtf, 
          total, 
          status,
          docType,
          metadata?.controlNumber || null,
          metadata?.ivaWithholdingPercentage || 0,
          metadata?.ivaWithholdingAmount || 0,
          metadata?.totalVES || 0,
          metadata?.exchangeRateUsed || 0,
          metadata?.parentId || null,
          metadata?.notes || null,
          number || invoiceId.substring(0,8),
          date || new Date().toISOString(),
          JSON.stringify(metadata || {})
        );

        // 2. Loop Items -> Create Invoice Items & Discount Stock
        const insertItem = db.prepare(`
          INSERT INTO sales_invoice_items (invoice_id, product_id, name, quantity, price, tax)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const discountStock = db.prepare(`
          UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?
        `);
        
        let totalCost = 0;
        for (const item of items) {
          insertItem.run(invoiceId, item.product_id, item.name, item.quantity, item.price, item.tax || 0);
          
          // Only discount stock if it's a real sale or delivery note
          if (docType === 'venta' || docType === 'nota_entrega') {
            discountStock.run(item.quantity, item.product_id, tenantId);
          }
        }

        // 3. Register standard Income in Finance (only for actual Sales)
        if (docType === 'venta') {
          const transactionId = require('crypto').randomUUID();
          db.prepare(`
            INSERT INTO finance_transactions (id, tenant_id, type, category, amount, description, status)
            VALUES (?, ?, 'INCOME', 'Sales', ?, ?, 'COMPLETED')
          `).run(transactionId, tenantId, total, `Venta Factura #${invoiceId.substring(0,8)} - ${customerName}`);
        }

        return invoiceId;
      });

      const invoiceId = processSale();
      res.json({ success: true, invoiceId });
    } catch (err) {
      console.error('[API:transaction:sale] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Business Logic: Fetch Invoices for Master-Client synchronization
  app.get('/api/transactions/invoices/:tenantId', (req, res) => {
    try {
      const db = getDb();
      const { tenantId } = req.params;
      
      const invoices = db.prepare('SELECT * FROM sales_invoices WHERE tenant_id = ? ORDER BY date DESC').all(tenantId);
      
      const mapped = invoices.map(inv => {
        let metadata = {};
        try { metadata = JSON.parse(inv.metadata || '{}'); } catch {}
        
        // Items are traditionally fetched here or handled lazily. 
        // For sales rendering, we fetch them too.
        const items = db.prepare('SELECT * FROM sales_invoice_items WHERE invoice_id = ?').all(inv.id).map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          tax: item.tax_iva
        }));
        
        return {
          id: inv.id,
          number: inv.number || inv.control_number || inv.id.substring(0,8),
          customerName: inv.customer_name,
          customerRif: inv.customer_rif,
          date: inv.date || new Date().toISOString(),
          subtotal: inv.subtotal,
          taxTotal: inv.tax_iva + inv.tax_igtf,
          total: inv.total,
          status: inv.status,
          type: inv.type,
          items: items,
          metadata: metadata,
          tenant_id: inv.tenant_id
        };
      });
      
      res.json({ success: true, data: mapped });
    } catch (err) {
      console.error('[API:transaction:invoices] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Business Logic: Process Purchase Atomically
  app.post('/api/transactions/purchase', (req, res) => {
    try {
      const db = getDb();
      const { tenantId, supplierName, items, total } = req.body;
      
      const processPurchase = db.transaction(() => {
        // 1. Create Purchase Order Log (simplified for the scope)
        const poId = require('crypto').randomUUID();
        
        // 2. Loop Items -> Increase Stock
        const addStock = db.prepare(`
          UPDATE products SET stock = stock + ? WHERE id = ? AND tenant_id = ?
        `);
        
        for (const item of items) {
          addStock.run(item.quantity, item.product_id, tenantId);
        }

        // 3. Register Expense in Finance
        const transactionId = require('crypto').randomUUID();
        db.prepare(`
          INSERT INTO finance_transactions (id, tenant_id, type, category, amount, description, status)
          VALUES (?, ?, 'EXPENSE', 'Purchases', ?, ?, 'COMPLETED')
        `).run(transactionId, tenantId, total, `Compra Proveedor: ${supplierName}`);

        return poId;
      });

      const orderId = processPurchase();
      res.json({ success: true, orderId });
    } catch (err) {
      console.error('[API:transaction:purchase] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // Business Logic: Convert Document (e.g. Quote -> Final Invoice)
  app.post('/api/transactions/convert', (req, res) => {
    try {
      const db = getDb();
      const { sourceId, targetType, tenantId } = req.body;
      
      const processConversion = db.transaction(() => {
        // 1. Get Source Document
        const source = db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(sourceId);
        if (!source) throw new Error('Documento origen no encontrado');
        if (source.status === 'convertido') throw new Error('El documento ya ha sido convertido');

        const sourceItems = db.prepare('SELECT * FROM sales_invoice_items WHERE invoice_id = ?').all(sourceId);

        // 2. Create Target Document
        const targetId = require('crypto').randomUUID();
        db.prepare(`
          INSERT INTO sales_invoices (
            id, tenant_id, customer_name, customer_rif, subtotal, tax_iva, tax_igtf, total, status, type,
            control_number, total_ves, exchange_rate_used, parent_id, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          targetId,
          source.tenant_id,
          source.customer_name,
          source.customer_rif,
          source.subtotal,
          source.tax_iva,
          source.tax_igtf,
          source.total,
          targetType === 'venta' ? 'PAID' : 'PENDING',
          targetType,
          null, // Reset control number for new fiscal document
          source.total_ves,
          source.exchange_rate_used,
          source.id,
          `Convertido desde ${source.type} #${source.id.substring(0,8)}`
        );

        // 3. Mark Source as Converted
        db.prepare('UPDATE sales_invoices SET status = "convertido" WHERE id = ?').run(sourceId);

        // 4. Duplicate Items & Apply Logic (Stock/Finance)
        const insertItem = db.prepare(`
          INSERT INTO sales_invoice_items (invoice_id, product_id, name, quantity, price, tax)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const discountStock = db.prepare(`
          UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?
        `);

        for (const item of sourceItems) {
          insertItem.run(targetId, item.product_id, item.name, item.quantity, item.price, item.tax);
          
          // Only discount stock if becoming a real sale or delivery note
          // AND it wasn't already discounted in previous phase (Delivery Notes discount stock)
          if ((targetType === 'venta' || targetType === 'nota_entrega') && source.type !== 'nota_entrega') {
            discountStock.run(item.quantity, item.product_id, source.tenant_id);
          }
        }

        // 5. Register Income if it's a new Sale
        if (targetType === 'venta') {
          const transactionId = require('crypto').randomUUID();
          db.prepare(`
            INSERT INTO finance_transactions (id, tenant_id, type, category, amount, description, status)
            VALUES (?, ?, 'INCOME', 'Sales', ?, ?, 'COMPLETED')
          `).run(transactionId, source.tenant_id, source.total, `Conversión Factura #${targetId.substring(0,8)}`);
        }

        return targetId;
      });

      const targetId = processConversion();
      res.json({ success: true, targetId });
    } catch (err) {
      console.error('[API:transaction:convert] Error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Socket.io Connection Logic
  io.on('connection', (socket) => {
    const nodeIp = socket.handshake.address;
    console.log(`[Socket] Nuevo nodo conectado: ${socket.id} (IP: ${nodeIp})`);
    
    connectedNodes.push({ id: socket.id, ip: nodeIp, connectedAt: new Date().toISOString() });
    io.emit('nodes:update', connectedNodes);

    // Broadcast config updates
    socket.on('config:update', (data) => {
      // Broadcast to everyone else
      socket.broadcast.emit('config:update', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Nodo desconectado: ${socket.id}`);
      connectedNodes = connectedNodes.filter(n => n.id !== socket.id);
      io.emit('nodes:update', connectedNodes);
    });
  });

  // SPA Fallback for React Router
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Bind to all network interfaces (0.0.0.0)
  serverInstance.listen(PORT, '0.0.0.0', () => {
    console.log(`[LocalServer] Servidor Maestro ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`[LocalServer] Nodos ahora pueden conectarse usando la IP local de esta máquina en el puerto ${PORT}`);
  });
}

function getSocketIo() {
  return io;
}

module.exports = {
  startLocalServer,
  getSocketIo
};
