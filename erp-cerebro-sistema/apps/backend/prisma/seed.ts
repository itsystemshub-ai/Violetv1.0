import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear rol ADMIN
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador del Sistema',
      color: '#dc2626',
      icon: 'crown',
      isSystem: true,
    },
  });

  // Crear usuario admin por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@zenith.com' },
    update: {},
    create: {
      email: 'admin@zenith.com',
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'Administrador del Sistema',
      firstName: 'Administrador',
      lastName: 'Sistema',
      cedula: '00000000',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);
  console.log('✅ Admin role created:', adminRole.name);

  // Crear otros roles del sistema
  const roles = [
    { name: 'CONTADOR', description: 'Contador', color: '#2563eb', icon: 'calculator' },
    { name: 'VENDEDOR', description: 'Vendedor', color: '#db2777', icon: 'shopping-cart' },
    { name: 'ALMACENISTA', description: 'Almacenista', color: '#16a34a', icon: 'package' },
    { name: 'RRHH', description: 'Recursos Humanos', color: '#c026d3', icon: 'users' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`✅ Role created: ${roleData.name}`);
  }

  // Crear configuración de empresa por defecto
  await prisma.companyConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'EMPRESA DEMO C.A.',
      rif: 'J-12345678-9',
      address: 'Dirección Fiscal, Ciudad, Venezuela',
      phone: '+58 412 1234567',
      email: 'contacto@empresa.com',
      fiscalYear: 'ENERO-DICIEMBRE',
      currency: 'VES',
      taxRate: 0.16,
      invoicePrefix: 'F',
      invoiceControl: '00-00000001',
      invoiceSeries: 'A',
      nextInvoiceNum: 1,
      checkStock: true,
      allowNegativeStock: false,
      commissionRate: 0,
      valuationMethod: 'PROMEDIO',
    },
  });
  console.log('✅ Company config created');

  // Crear configuraciones del sistema por defecto
  const systemConfigs = [
    // Contabilidad
    { key: 'accounting.accounts_receivable', value: '', type: 'string', group: 'accounting', label: 'Cuenta por Cobrar', isPublic: false, isEditable: true },
    { key: 'accounting.accounts_payable', value: '', type: 'string', group: 'accounting', label: 'Cuenta por Pagar', isPublic: false, isEditable: true },
    { key: 'accounting.sales_revenue', value: '', type: 'string', group: 'accounting', label: 'Ingresos por Ventas', isPublic: false, isEditable: true },
    { key: 'accounting.iva_payable', value: '', type: 'string', group: 'accounting', label: 'IVA por Pagar', isPublic: false, isEditable: true },
    { key: 'accounting.inventory', value: '', type: 'string', group: 'accounting', label: 'Cuenta de Inventario', isPublic: false, isEditable: true },
    { key: 'accounting.cost_of_sales', value: '', type: 'string', group: 'accounting', label: 'Costo de Ventas', isPublic: false, isEditable: true },
    
    // RRHH
    { key: 'hr.ivss_rate_employee', value: '0.04', type: 'number', group: 'hr', label: 'Tasa IVSS Empleado', isPublic: false, isEditable: true },
    { key: 'hr.ivss_rate_employer', value: '0.09', type: 'number', group: 'hr', label: 'Tasa IVSS Patrono', isPublic: false, isEditable: true },
    { key: 'hr.faov_rate_employee', value: '0.01', type: 'number', group: 'hr', label: 'Tasa FAOV Empleado', isPublic: false, isEditable: true },
    { key: 'hr.faov_rate_employer', value: '0.02', type: 'number', group: 'hr', label: 'Tasa FAOV Patrono', isPublic: false, isEditable: true },
    { key: 'hr.ince_rate', value: '0.005', type: 'number', group: 'hr', label: 'Tasa INCE', isPublic: false, isEditable: true },
    { key: 'hr.cesta_ticket_amount', value: '1500', type: 'number', group: 'hr', label: 'Monto Cesta Ticket', isPublic: false, isEditable: true },
    
    // Ventas
    { key: 'sales.commission_rate', value: '0.03', type: 'number', group: 'sales', label: 'Tasa de Comisión', isPublic: false, isEditable: true },
    { key: 'sales.check_stock', value: 'true', type: 'boolean', group: 'sales', label: 'Verificar Stock', isPublic: false, isEditable: true },
    { key: 'sales.allow_credit_sales', value: 'true', type: 'boolean', group: 'sales', label: 'Permitir Ventas al Crédito', isPublic: false, isEditable: true },
    { key: 'sales.max_credit_days', value: '30', type: 'number', group: 'sales', label: 'Días Máximo Crédito', isPublic: false, isEditable: true },
    
    // Inventario
    { key: 'inventory.alert_min_stock', value: 'true', type: 'boolean', group: 'inventory', label: 'Alertar Stock Mínimo', isPublic: false, isEditable: true },
    { key: 'inventory.default_warehouse', value: '', type: 'string', group: 'inventory', label: 'Almacén por Defecto', isPublic: false, isEditable: true },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('✅ System configs created');

  // Crear tablas del sistema por defecto
  const tablas = [
    {
      name: 'payment_methods',
      description: 'Métodos de Pago',
      isSystem: true,
      items: [
        { code: 'CASH', name: 'Efectivo', color: '#22c55e', icon: 'banknote' },
        { code: 'CARD', name: 'Tarjeta', color: '#3b82f6', icon: 'credit-card' },
        { code: 'TRANSFER', name: 'Transferencia', color: '#8b5cf6', icon: 'arrow-right-left' },
        { code: 'ZELLE', name: 'Zelle', color: '#0ea5e9', icon: 'send' },
        { code: 'PAYPAL', name: 'PayPal', color: '#2563eb', icon: 'wallet' },
      ],
    },
    {
      name: 'document_types',
      description: 'Tipos de Documento',
      isSystem: true,
      items: [
        { code: 'V', name: 'Venezolano', color: '#22c55e', icon: 'id-card' },
        { code: 'E', name: 'Extranjero', color: '#3b82f6', icon: 'passport' },
        { code: 'J', name: 'Jurídico', color: '#8b5cf6', icon: 'building' },
        { code: 'G', name: 'Gaceta', color: '#f59e0b', icon: 'file-text' },
      ],
    },
    {
      name: 'sale_status',
      description: 'Estatus de Ventas',
      isSystem: true,
      items: [
        { code: 'PENDING', name: 'Pendiente', color: '#f59e0b', icon: 'clock' },
        { code: 'CONFIRMED', name: 'Confirmada', color: '#22c55e', icon: 'check-circle' },
        { code: 'SHIPPED', name: 'Enviada', color: '#3b82f6', icon: 'truck' },
        { code: 'DELIVERED', name: 'Entregada', color: '#8b5cf6', icon: 'package' },
        { code: 'CANCELLED', name: 'Cancelada', color: '#ef4444', icon: 'x-circle' },
      ],
    },
  ];

  for (const tabla of tablas) {
    const created = await prisma.systemTable.create({
      data: {
        name: tabla.name,
        description: tabla.description,
        isSystem: tabla.isSystem,
      },
    });

    for (const item of tabla.items) {
      await prisma.systemTableItem.create({
        data: {
          ...item,
          tableId: created.id,
        },
      });
    }
  }
  console.log('✅ System tables created');

  // Crear plan de cuentas contable básico
  const planCuentas = [
    // ACTIVO (1)
    { codigo: '1', nombre: 'ACTIVO', tipo: 'SINTETICA', naturaleza: 'DEUDORA' },
    { codigo: '1.1', nombre: 'ACTIVO CORRIENTE', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1' },
    { codigo: '1.1.1', nombre: 'CAJA', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1.1' },
    { codigo: '1.1.1.01', nombre: 'Caja Principal', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.1' },
    { codigo: '1.1.1.02', nombre: 'Caja Chica', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.1' },
    { codigo: '1.1.2', nombre: 'BANCOS', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1.1' },
    { codigo: '1.1.2.01', nombre: 'Banco Nacional', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.2' },
    { codigo: '1.1.2.02', nombre: 'Banco Exterior', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.2' },
    { codigo: '1.1.3', nombre: 'CUENTAS POR COBRAR', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1.1' },
    { codigo: '1.1.3.01', nombre: 'Clientes Nacionales', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.3' },
    { codigo: '1.1.3.02', nombre: 'Clientes Extranjeros', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.3' },
    { codigo: '1.1.4', nombre: 'INVENTARIOS', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1.1' },
    { codigo: '1.1.4.01', nombre: 'Mercancías', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.4' },
    { codigo: '1.1.4.02', nombre: 'Materias Primas', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.1.4' },
    
    // ACTIVO NO CORRIENTE (1.2)
    { codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1' },
    { codigo: '1.2.1', nombre: 'PROPIEDAD, PLANTA Y EQUIPO', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '1.2' },
    { codigo: '1.2.1.01', nombre: 'Equipos de Computación', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.2.1' },
    { codigo: '1.2.1.02', nombre: 'Mobiliario y Enseres', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.2.1' },
    { codigo: '1.2.1.03', nombre: 'Vehículos', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '1.2.1' },
    { codigo: '1.2.2', nombre: 'DEPRECIACIÓN ACUMULADA', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '1.2' },
    { codigo: '1.2.2.01', nombre: 'Depreciación Equipos', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '1.2.2' },
    
    // PASIVO (2)
    { codigo: '2', nombre: 'PASIVO', tipo: 'SINTETICA', naturaleza: 'ACREEDORA' },
    { codigo: '2.1', nombre: 'PASIVO CORRIENTE', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '2' },
    { codigo: '2.1.1', nombre: 'CUENTAS POR PAGAR', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '2.1' },
    { codigo: '2.1.1.01', nombre: 'Proveedores Nacionales', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.1' },
    { codigo: '2.1.1.02', nombre: 'Proveedores Extranjeros', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.1' },
    { codigo: '2.1.2', nombre: 'IMPUESTOS POR PAGAR', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '2.1' },
    { codigo: '2.1.2.01', nombre: 'IVA por Pagar', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.2' },
    { codigo: '2.1.2.02', nombre: 'ISLR por Retener', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.2' },
    { codigo: '2.1.3', nombre: 'RETENCIONES POR PAGAR', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '2.1' },
    { codigo: '2.1.3.01', nombre: 'IVSS por Pagar', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.3' },
    { codigo: '2.1.3.02', nombre: 'FAOV por Pagar', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.3' },
    { codigo: '2.1.3.03', nombre: 'INCE por Pagar', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '2.1.3' },
    
    // PATRIMONIO (3)
    { codigo: '3', nombre: 'PATRIMONIO', tipo: 'SINTETICA', naturaleza: 'ACREEDORA' },
    { codigo: '3.1', nombre: 'CAPITAL SOCIAL', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '3' },
    { codigo: '3.1.1', nombre: 'CAPITAL SUSCRITO', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '3.1' },
    { codigo: '3.2', nombre: 'RESULTADOS ACUMULADOS', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '3' },
    { codigo: '3.2.1', nombre: 'Utilidad del Ejercicio', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '3.2' },
    { codigo: '3.2.2', nombre: 'Utilidades de Años Anteriores', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '3.2' },
    
    // INGRESOS (4)
    { codigo: '4', nombre: 'INGRESOS', tipo: 'SINTETICA', naturaleza: 'ACREEDORA' },
    { codigo: '4.1', nombre: 'INGRESOS OPERATIVOS', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '4' },
    { codigo: '4.1.1', nombre: 'VENTAS DE MERCANCÍAS', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '4.1' },
    { codigo: '4.1.2', nombre: 'PRESTACIÓN DE SERVICIOS', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '4.1' },
    { codigo: '4.2', nombre: 'OTROS INGRESOS', tipo: 'SINTETICA', naturaleza: 'ACREEDORA', padreId: '4' },
    { codigo: '4.2.1', nombre: 'INGRESOS FINANCIEROS', tipo: 'MOVIMIENTO', naturaleza: 'ACREEDORA', padreId: '4.2' },
    
    // COSTOS (5)
    { codigo: '5', nombre: 'COSTOS', tipo: 'SINTETICA', naturaleza: 'DEUDORA' },
    { codigo: '5.1', nombre: 'COSTO DE VENTAS', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '5' },
    { codigo: '5.1.1', nombre: 'Costo de Mercancías Vendidas', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '5.1' },
    { codigo: '5.1.2', nombre: 'Costo de Servicios Prestados', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '5.1' },
    
    // GASTOS (6)
    { codigo: '6', nombre: 'GASTOS', tipo: 'SINTETICA', naturaleza: 'DEUDORA' },
    { codigo: '6.1', nombre: 'GASTOS DE PERSONAL', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '6' },
    { codigo: '6.1.1', nombre: 'Sueldos y Salarios', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.1' },
    { codigo: '6.1.2', nombre: 'Carga Patronal', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.1' },
    { codigo: '6.2', nombre: 'GASTOS ADMINISTRATIVOS', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '6' },
    { codigo: '6.2.1', nombre: 'Alquileres', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.2' },
    { codigo: '6.2.2', nombre: 'Servicios Públicos', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.2' },
    { codigo: '6.2.3', nombre: 'Útiles y Materiales', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.2' },
    { codigo: '6.3', nombre: 'GASTOS DE VENTAS', tipo: 'SINTETICA', naturaleza: 'DEUDORA', padreId: '6' },
    { codigo: '6.3.1', nombre: 'Publicidad y Propaganda', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.3' },
    { codigo: '6.3.2', nombre: 'Comisiones', tipo: 'MOVIMIENTO', naturaleza: 'DEUDORA', padreId: '6.3' },
  ];

  for (const cuentaData of planCuentas) {
    await prisma.planCuenta.upsert({
      where: { codigo: cuentaData.codigo },
      update: {},
      create: {
        codigo: cuentaData.codigo,
        nombre: cuentaData.nombre,
        tipo: cuentaData.tipo,
        naturaleza: cuentaData.naturaleza,
        padreId: cuentaData.padreId || null,
        isActive: true,
      },
    });
  }
  console.log('✅ Plan de cuentas created');

  // Crear almacenes por defecto
  const almacenes = [
    { codigo: 'ALM-001', nombre: 'Almacén Principal', direccion: 'Planta Baja', responsable: 'Juan Pérez' },
    { codigo: 'ALM-002', nombre: 'Almacén Secundario', direccion: 'Piso 2', responsable: 'María González' },
    { codigo: 'ALM-003', nombre: 'Depósito', direccion: 'Zona Industrial', responsable: 'Carlos Rodríguez' },
  ];

  for (const almacen of almacenes) {
    await prisma.almacen.upsert({
      where: { codigo: almacen.codigo },
      update: {},
      create: almacen,
    });
  }
  console.log('✅ Almacenes created');

  // Crear productos de ejemplo
  const productos = [
    { codigo: 'PROD-001', nombre: 'Laptop HP ProBook 450', categoria: 'Computación', costoActual: 850.00, precioVenta: 1200.00, existenciaMinima: 5 },
    { codigo: 'PROD-002', nombre: 'Mouse Logitech M185', categoria: 'Accesorios', costoActual: 15.00, precioVenta: 25.00, existenciaMinima: 20 },
    { codigo: 'PROD-003', nombre: 'Teclado Logitech K120', categoria: 'Accesorios', costoActual: 18.00, precioVenta: 30.00, existenciaMinima: 15 },
    { codigo: 'PROD-004', nombre: 'Monitor Samsung 24"', categoria: 'Computación', costoActual: 180.00, precioVenta: 250.00, existenciaMinima: 8 },
    { codigo: 'PROD-005', nombre: 'Silla Ergonómica', categoria: 'Mobiliario', costoActual: 120.00, precioVenta: 180.00, existenciaMinima: 10 },
    { codigo: 'PROD-006', nombre: 'Escritorio Ejecutivo', categoria: 'Mobiliario', costoActual: 200.00, precioVenta: 320.00, existenciaMinima: 5 },
    { codigo: 'PROD-007', nombre: 'Impresora HP LaserJet', categoria: 'Computación', costoActual: 250.00, precioVenta: 350.00, existenciaMinima: 6 },
    { codigo: 'PROD-008', nombre: 'Papel Bond A4 (Resma)', categoria: 'Papelería', costoActual: 4.50, precioVenta: 7.00, existenciaMinima: 50 },
    { codigo: 'PROD-009', nombre: 'Bolígrafo Azul (Caja)', categoria: 'Papelería', costoActual: 3.00, precioVenta: 5.00, existenciaMinima: 30 },
    { codigo: 'PROD-010', nombre: 'Carpetas Archivadoras', categoria: 'Papelería', costoActual: 2.50, precioVenta: 4.00, existenciaMinima: 40 },
  ];

  for (const prod of productos) {
    await prisma.producto.upsert({
      where: { codigo: prod.codigo },
      update: {},
      create: {
        ...prod,
        unidadMedida: 'UND',
        existenciaActual: prod.existenciaMinima * 2,
        isActive: true,
      },
    });
  }
  console.log('✅ Productos created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
