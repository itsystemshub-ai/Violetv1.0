/**
 * Violet ERP - Migración de Base de Datos Híbrida
 * 
 * Esquema completo para SQLite local y PostgreSQL nube
 * Incluye tablas de sincronización y replicación
 */

import { db } from '@violet-erp/database';
import { createChangeTriggers } from '../sync/hybrid-sync.js';

/**
 * Inicializar base de datos completa con soporte híbrido
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing Hybrid Database Schema...');

    // Crear todas las tablas
    await createUsersTables();
    await createProductsTables();
    await createInventoryTables();
    await createSalesTables();
    await createCustomersTables();
    await createPurchasesTables();
    await createSuppliersTables();
    await createFinanceTables();
    await createAccountingTables();
    await createSyncTables();
    await createAuditTables();
    await createSystemTables();

    // Crear triggers de sincronización para cada tabla
    const syncTables = [
      'users', 'roles', 'permissions',
      'products', 'categories', 'brands', 'units',
      'inventory', 'warehouses', 'stock_movements',
      'customers', 'customer_addresses', 'customer_contacts',
      'sales', 'sale_items',
      'suppliers', 'supplier_addresses', 'supplier_contacts',
      'purchases', 'purchase_items',
      'accounts', 'journal_entries', 'journal_entry_items',
      'invoices', 'invoice_items', 'payments',
    ];

    syncTables.forEach((table) => {
      try {
        createChangeTriggers(db, table);
      } catch (error) {
        console.warn(`Warning creating triggers for ${table}:`, error.message);
      }
    });

    // Insertar datos por defecto
    await seedDefaultData();

    console.log('Hybrid Database Schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// ============================================================================
# TABLAS DE USUARIOS Y SEGURIDAD
# ============================================================================

function createUsersTables() {
  // Roles
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Permisos
  db.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      UNIQUE(resource, action)
    )
  `);

  // Role-Permissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  // Usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      department TEXT,
      position TEXT,
      role_id TEXT,
      is_active INTEGER DEFAULT 1,
      is_email_verified INTEGER DEFAULT 0,
      last_login DATETIME,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  // Sesiones
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)');
}

// ============================================================================
# TABLAS DE PRODUCTOS
# ============================================================================

function createProductsTables() {
  // Categorías
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      level INTEGER DEFAULT 0,
      path TEXT,
      is_active INTEGER DEFAULT 1,
      position INTEGER DEFAULT 0,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);

  // Marcas
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      website TEXT,
      is_active INTEGER DEFAULT 1,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Unidades
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      conversion_factor REAL DEFAULT 1,
      base_unit_id TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Productos
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL,
      brand_id TEXT,
      unit_id TEXT NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      max_stock INTEGER,
      current_stock INTEGER DEFAULT 0,
      reserved_stock INTEGER DEFAULT 0,
      available_stock INTEGER DEFAULT 0,
      barcode TEXT,
      is_active INTEGER DEFAULT 1,
      is_taxable INTEGER DEFAULT 1,
      tax_rate REAL DEFAULT 0,
      images TEXT,
      attributes TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)');
}

// ============================================================================
# TABLAS DE INVENTARIO
# ============================================================================

function createInventoryTables() {
  // Almacenes
  db.exec(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      manager_id TEXT,
      is_active INTEGER DEFAULT 1,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inventario por almacén
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      reserved INTEGER DEFAULT 0,
      available INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      max_stock INTEGER,
      reorder_point INTEGER DEFAULT 20,
      last_counted_at DATETIME,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, warehouse_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    )
  `);

  // Movimientos de stock
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      reason TEXT,
      notes TEXT,
      user_id TEXT NOT NULL,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON stock_movements(warehouse_id)');
}

// ============================================================================
# TABLAS DE VENTAS
# ============================================================================

function createSalesTables() {
  // Ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_method TEXT,
      notes TEXT,
      shipping_address TEXT,
      billing_address TEXT,
      salesperson_id TEXT,
      warehouse_id TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (salesperson_id) REFERENCES users(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    )
  `);

  // Items de venta
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      notes TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)');
}

// ============================================================================
# TABLAS DE CLIENTES
# ============================================================================

function createCustomersTables() {
  // Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'individual',
      first_name TEXT,
      last_name TEXT,
      company_name TEXT,
      tax_id TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      mobile TEXT,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      tags TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Direcciones de clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      street TEXT NOT NULL,
      street2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'DO',
      is_default INTEGER DEFAULT 0,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Contactos de clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_contacts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active)');
}

// ============================================================================
# TABLAS DE COMPRAS Y PROVEEDORES
# ============================================================================

function createPurchasesTables() {
  // Órdenes de compra
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      supplier_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      received_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      expected_date DATETIME,
      received_date DATETIME,
      notes TEXT,
      warehouse_id TEXT NOT NULL,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    )
  `);

  // Items de compra
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      received_quantity INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      notes TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_order_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchases_order ON purchases(order_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status)');
}

function createSuppliersTables() {
  // Proveedores
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      tax_id TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      payment_terms TEXT,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      rating REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      tags TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Direcciones de proveedores
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_addresses (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      type TEXT NOT NULL,
      street TEXT NOT NULL,
      street2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'DO',
      is_default INTEGER DEFAULT 0,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `);

  // Contactos de proveedores
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_contacts (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active)');
}

// ============================================================================
# TABLAS DE FINANZAS Y CONTABILIDAD
# ============================================================================

function createFinanceTables() {
  // Facturas
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      customer_id TEXT,
      supplier_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      notes TEXT,
      attachments TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Items de factura
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )
  `);

  // Pagos
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      type TEXT NOT NULL,
      customer_id TEXT,
      supplier_id TEXT,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      reference TEXT,
      date DATE NOT NULL,
      notes TEXT,
      attachments TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date)');
}

function createAccountingTables() {
  // Plan de cuentas
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      level INTEGER DEFAULT 0,
      path TEXT,
      balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_system INTEGER DEFAULT 0,
      description TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES accounts(id)
    )
  `);

  // Asientos contables
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      entry_number TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      reference_type TEXT,
      reference_id TEXT,
      created_by TEXT NOT NULL,
      posted_by TEXT,
      posted_at DATETIME,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Items de asiento
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entry_items (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      description TEXT,
      sync_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_journal_status ON journal_entries(status)');
}

// ============================================================================
# TABLAS DE SINCRONIZACIÓN
# ============================================================================

function createSyncTables() {
  // Conflictos de sincronización
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      local_data TEXT,
      cloud_data TEXT,
      error TEXT,
      resolution TEXT,
      resolved_by TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cola de sincronización offline
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      data TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      last_attempt DATETIME,
      error TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Estado de sincronización
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY,
      instance_id TEXT NOT NULL,
      last_sync DATETIME,
      last_push DATETIME,
      last_pull DATETIME,
      pending_changes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'idle',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insertar estado inicial
  db.exec(`
    INSERT OR IGNORE INTO sync_state (id, instance_id, status)
    VALUES (1, 'local-' || lower(hex(randomblob(8))), 'idle')
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority)');
}

// ============================================================================
# TABLAS DE AUDITORÍA Y SISTEMA
# ============================================================================

function createAuditTables() {
  // Logs de auditoría
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)');
}

function createSystemTables() {
  // Configuración del sistema
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      description TEXT,
      is_public INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notificaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      action_label TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Índices
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)');

  // Insertar configuración por defecto
  db.exec(`
    INSERT OR IGNORE INTO system_config (id, key, value, type, description) VALUES
    ('1', 'app_name', 'Violet ERP', 'string', 'Nombre de la aplicación'),
    ('2', 'app_version', '1.0.0', 'string', 'Versión de la aplicación'),
    ('3', 'currency', 'DOP', 'string', 'Moneda por defecto'),
    ('4', 'timezone', 'America/Santo_Domingo', 'string', 'Zona horaria'),
    ('5', 'locale', 'es_DO', 'string', 'Localización'),
    ('6', 'tax_rate', '18', 'number', 'Impuesto por defecto (%)'),
    ('7', 'invoice_prefix', 'FAC', 'string', 'Prefijo de facturas'),
    ('8', 'invoice_sequence', '1', 'number', 'Secuencia de facturas')
  `);
}

// ============================================================================
# DATOS POR DEFECTO
# ============================================================================

async function seedDefaultData() {
  const bcrypt = await import('bcrypt');

  // Roles
  const roles = [
    { id: 'super_admin', name: 'super_admin', description: 'Super Administrador', is_system: 1 },
    { id: 'admin', name: 'admin', description: 'Administrador', is_system: 1 },
    { id: 'manager', name: 'manager', description: 'Gerente', is_system: 1 },
    { id: 'user', name: 'user', description: 'Usuario', is_system: 1 },
    { id: 'viewer', name: 'viewer', description: 'Visualizador', is_system: 1 },
  ];

  roles.forEach((role) => {
    db.exec(
      `INSERT OR IGNORE INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)`,
      [role.id, role.name, role.description, role.is_system]
    );
  });

  // Permisos por defecto
  const permissions = [
    { id: 'users_create', name: 'Crear usuarios', resource: 'users', action: 'create' },
    { id: 'users_read', name: 'Ver usuarios', resource: 'users', action: 'read' },
    { id: 'users_update', name: 'Editar usuarios', resource: 'users', action: 'update' },
    { id: 'users_delete', name: 'Eliminar usuarios', resource: 'users', action: 'delete' },
    { id: 'products_create', name: 'Crear productos', resource: 'products', action: 'create' },
    { id: 'products_read', name: 'Ver productos', resource: 'products', action: 'read' },
    { id: 'products_update', name: 'Editar productos', resource: 'products', action: 'update' },
    { id: 'products_delete', name: 'Eliminar productos', resource: 'products', action: 'delete' },
    { id: 'sales_create', name: 'Crear ventas', resource: 'sales', action: 'create' },
    { id: 'sales_read', name: 'Ver ventas', resource: 'sales', action: 'read' },
    { id: 'sales_update', name: 'Editar ventas', resource: 'sales', action: 'update' },
    { id: 'sales_delete', name: 'Eliminar ventas', resource: 'sales', action: 'delete' },
    { id: 'sales_approve', name: 'Aprobar ventas', resource: 'sales', action: 'approve' },
  ];

  permissions.forEach((perm) => {
    db.exec(
      `INSERT OR IGNORE INTO permissions (id, name, resource, action, description) VALUES (?, ?, ?, ?, ?)`,
      [perm.id, perm.name, perm.resource, perm.action, perm.description || '']
    );
  });

  // Asignar permisos a roles
  db.exec(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id) 
           SELECT 'super_admin', id FROM permissions`);

  // Usuario admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.exec(
    `INSERT OR IGNORE INTO users (id, email, username, password_hash, first_name, last_name, role_id, is_active, is_email_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['1', 'admin@violet-erp.com', 'admin', hashedPassword, 'Super', 'Admin', 'super_admin', 1, 1]
  );

  console.log('Default data seeded successfully');
}

export default initializeDatabase;
