import Dexie, { type Table } from 'dexie';
import { Product, Invoice, Tenant } from '@/lib/index';

/**
 * VioletLocalDb
 * Base de datos local (IndexedDB) para proporcionar un "Doble Respaldo".
 * Los datos se guardan aquí primero y luego se sincronizan con la nube.
 */
export class VioletLocalDb extends Dexie {
  profiles!: Table<any>;
  employees!: Table<any>;
  financial_accounts!: Table<any>;
  sys_config!: Table<any>;
  products!: Table<Product>;
  invoices!: Table<Invoice>;
  tenants!: Table<Tenant>;
  audit_logs!: Table<any>;
  sync_logs!: Table<any>;
  financial_transactions!: Table<any>;
  payroll_records!: Table<any>;
  requisitions!: Table<any>;
  sellers!: Table<any>;
  salary_history!: Table<any>;
  prestaciones_acumuladas!: Table<any>;
  igtf_records!: Table<any>;
  compras_maestro!: Table<any>;
  compras_detalle!: Table<any>;
  suppliers!: Table<any>;
  notifications!: Table<any>;
  inventory_movements!: Table<any>;
  accounts_receivable!: Table<any>;
  payments!: Table<any>;
  cash_register!: Table<any>;
  libro_ventas!: Table<any>;
  exchange_differences!: Table<any>;
  password_reset_requests!: Table<any>;
  automation_queue!: Table<any>;
  crm_chats!: Table<any>;
  crm_messages!: Table<any>;
  reported_payments!: Table<any>;
  orders!: Table<any>;

  constructor() {
    super('VioletERP_LocalDB');
    
    // Esquema de la base de datos
    // El primer campo es la llave primaria (id)
    // Los campos siguientes son los que queremos indexar para búsquedas rápidas
      this.version(2).stores({
        products: 'id, name, category, tenant_id, updated_at, cauplas, components',
        invoices: 'id, number, customerName, date, tenant_id',
        tenants: 'id, name, slug',
        profiles: 'id, username, email, rif, tenant_id, loyalty_points',
        employees: 'id, dni, tenant_id',
        financial_accounts: 'id, code, tenant_id',
        financial_transactions: 'id, account_id, tenant_id, created_at',
        payroll_records: 'id, employee_id, tenant_id, period_date',
        requisitions: 'id, tenant_id, status, created_at',
        sys_config: 'id, key, tenant_id',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id'
      });

      // v3: RRHH LOTTT Venezuela - Historial de sueldos y prestaciones
      this.version(3).stores({
        products: 'id, name, category, tenant_id, updated_at, cauplas, components',
        invoices: 'id, number, customerName, date, tenant_id',
        tenants: 'id, name, slug',
        profiles: 'id, username, email, rif, tenant_id, loyalty_points',
        employees: 'id, dni, rif, tenant_id',
        financial_accounts: 'id, code, tenant_id',
        financial_transactions: 'id, account_id, tenant_id, created_at',
        payroll_records: 'id, employee_id, tenant_id, period_date',
        requisitions: 'id, tenant_id, status, created_at',
        sys_config: 'id, key, tenant_id',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id',
        salary_history: 'id, employee_id, tenant_id, fecha_desde',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, trimestre'
      });

      // v4: Finanzas SENIAT Venezuela - IGTF y moneda dual
      this.version(4).stores({
        products: 'id, name, category, tenant_id, updated_at, cauplas, components',
        invoices: 'id, number, customerName, date, tenant_id',
        tenants: 'id, name, slug',
        profiles: 'id, username, email, rif, tenant_id, loyalty_points',
        employees: 'id, dni, rif, tenant_id',
        financial_accounts: 'id, code, tenant_id',
        financial_transactions: 'id, account_id, tenant_id, created_at',
        payroll_records: 'id, employee_id, tenant_id, period_date',
        requisitions: 'id, tenant_id, status, created_at',
        sys_config: 'id, key, tenant_id',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id',
        salary_history: 'id, employee_id, tenant_id, fecha_desde',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, trimestre',
        igtf_records: 'id, invoice_id, tenant_id, created_at'
      });

      // v5: Cloud Ready - Metadata de sincronización
      this.version(5).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type',
        tenants: 'id, name, slug, is_dirty',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty',
        financial_accounts: 'id, code, tenant_id, is_dirty',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty',
        requisitions: 'id, tenant_id, status, created_at, is_dirty',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty'
      });

      // v6: Robust Cloud Architecture - Soft deletes y Versiones
      this.version(6).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty'
      });

      // v7: Centro de Compras Venezuela - UUID, Moneda Dual y Proveedores
      this.version(7).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at'
      });

      // v8: Sistema de Notificaciones Broadcast
      this.version(8).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read'
      });

      // v9: Gestión de Inventario - Movimientos de Stock
      this.version(9).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at'
      });

      // v10: Cuentas por Cobrar y Tesorería
      this.version(10).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at'
      });

      // v11: Libro de Ventas SENIAT
      this.version(11).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
        libro_ventas: 'id, tenant_id, numero_factura, fecha_factura, periodo_fiscal, rif_cliente, created_at'
      });

      // v12: Diferencial Cambiario Venezuela
      this.version(12).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
      });

      // v13: Gestión de Cambio de Contraseña con Aprobación
      this.version(13).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
        libro_ventas: 'id, tenant_id, numero_factura, fecha_factura, periodo_fiscal, rif_cliente, created_at',
        exchange_differences: 'id, invoice_id, payment_id, tenant_id, type, created_at, is_dirty',
        password_reset_requests: 'id, user_id, username, status, tenant_id, created_at'
      });

      // v14: Automation Hub - Cola de eventos n8n
      this.version(14).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
        libro_ventas: 'id, tenant_id, numero_factura, fecha_factura, periodo_fiscal, rif_cliente, created_at',
        exchange_differences: 'id, invoice_id, payment_id, tenant_id, type, created_at, is_dirty',
        password_reset_requests: 'id, user_id, username, status, tenant_id, created_at',
        automation_queue: '++id, status, timestamp'
      });

      // v15: Interconexión Total - CRM y Pagos Reportados Reales
      this.version(15).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
        libro_ventas: 'id, tenant_id, numero_factura, fecha_factura, periodo_fiscal, rif_cliente, created_at',
        exchange_differences: 'id, invoice_id, payment_id, tenant_id, type, created_at, is_dirty',
        password_reset_requests: 'id, user_id, username, status, tenant_id, created_at',
        automation_queue: '++id, status, timestamp',
        crm_chats: 'id, customer_id, tenant_id, status',
        crm_messages: 'id, chat_id, sender, tenant_id',
        reported_payments: 'id, invoice_number, tenant_id, status'
      });

      // v16: Gestión de Pedidos y Seguridad
      this.version(16).stores({
        products: 'id, name, category, tenant_id, updated_at, is_dirty, last_sync, deleted_at, version',
        invoices: 'id, number, customerName, date, tenant_id, is_dirty, last_sync, type, deleted_at, payment_type, payment_status',
        tenants: 'id, name, slug, is_dirty, deleted_at',
        profiles: 'id, username, email, rif, tenant_id, is_dirty',
        employees: 'id, dni, rif, tenant_id, status, is_dirty, deleted_at',
        financial_accounts: 'id, code, tenant_id, is_dirty, deleted_at',
        financial_transactions: 'id, account_id, tenant_id, created_at, is_dirty, deleted_at',
        payroll_records: 'id, employee_id, tenant_id, period_date, is_dirty, deleted_at',
        requisitions: 'id, tenant_id, status, created_at, is_dirty, deleted_at',
        sys_config: 'id, key, tenant_id, is_dirty',
        audit_logs: 'id, table_name, record_id, changed_by, created_at',
        sync_logs: 'id, table_name, action, sync_status, created_at',
        sellers: 'id, name, tenant_id, is_dirty, deleted_at',
        salary_history: 'id, employee_id, tenant_id, is_dirty',
        prestaciones_acumuladas: 'id, employee_id, tenant_id, is_dirty',
        igtf_records: 'id, invoice_id, tenant_id, created_at, is_dirty',
        compras_maestro: 'id, num_factura, proveedor_id, tenant_id, is_dirty, deleted_at',
        compras_detalle: 'id, compra_id, producto_id, tenant_id',
        suppliers: 'id, rif, name, tenant_id, is_dirty, deleted_at',
        notifications: 'id, type, timestamp, userId, tenantId, read',
        inventory_movements: 'id, product_id, tenant_id, type, reference_id, created_at',
        accounts_receivable: 'id, invoice_id, customer_rif, tenant_id, status, due_date, created_at',
        payments: 'id, receivable_id, tenant_id, payment_method, created_at',
        cash_register: 'id, tenant_id, type, reference_id, created_at',
        libro_ventas: 'id, tenant_id, numero_factura, fecha_factura, periodo_fiscal, rif_cliente, created_at',
        exchange_differences: 'id, invoice_id, payment_id, tenant_id, type, created_at, is_dirty',
        password_reset_requests: 'id, user_id, username, status, tenant_id, created_at',
        automation_queue: '++id, status, timestamp',
        crm_chats: 'id, customer_id, tenant_id, status',
        crm_messages: 'id, chat_id, sender, tenant_id',
        reported_payments: 'id, invoice_number, tenant_id, status',
        orders: 'id, client, clientId, date, status, tenant_id, created_at, updated_at'
      });
  }

  /**
   * Limpia datos específicos de un tenant (útil para seguridad al cerrar sesión)
   */
  async clearTenantData(tenantId: string) {
    await this.products.where('tenant_id').equals(tenantId).delete();
    await this.invoices.where('tenant_id').equals(tenantId).delete();
    await this.profiles.where('tenant_id').equals(tenantId).delete();
    await this.employees.where('tenant_id').equals(tenantId).delete();
    await this.financial_accounts.where('tenant_id').equals(tenantId).delete();
    await this.sys_config.where('tenant_id').equals(tenantId).delete();
    await this.requisitions.where('tenant_id').equals(tenantId).delete();
    await this.compras_maestro.where('tenant_id').equals(tenantId).delete();
    await this.suppliers.where('tenant_id').equals(tenantId).delete();
  }
}

export const localDb = new VioletLocalDb();
