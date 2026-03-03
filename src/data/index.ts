import {
  Tenant,
  FinancialAccount,
  Product,
  Invoice,
  Employee,
  DashboardMetric,
  ChartDataPoint
} from "@/lib/index";

export const mockTenants: Tenant[] = [
  {
    id: "3e4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d", // Cauplas Global
    name: "Cauplas Venezuela",
    slug: "cauplas-ve",
    rif: "J-30456123-0",
    fiscalName: "Cauplas de Venezuela, C.A.",
    address: "Zona Industrial San Vicente II, Maracay, Aragua",
    phone: "+58 243 233 4455",
    logoUrl: "https://cauplas.com/wp-content/uploads/2021/04/Logo-Cauplas-Header.png",
    primaryColor: "#7c3aed",
    currency: "USD",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d", // La Cima
    name: "Distribuidora La Cima",
    slug: "la-cima",
    rif: "J-40556789-1",
    fiscalName: "Inversiones La Cima 2024, J.J.",
    address: "Av. Las Delicias, C.C. La Cima, Maracay",
    phone: "+58 243 555 0122",
    logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=cima",
    primaryColor: "#0ea5e9",
    currency: "USD",
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "f9e8d7c6-b5a4-4321-8765-43210fedcba9", // Milwaukee
    name: "Milwaukee Tools VE",
    slug: "milwaukee-ve",
    rif: "J-50667890-2",
    fiscalName: "Representaciones Milwaukee Venezuela",
    address: "CCCT, Torre A, Piso 2, Caracas",
    phone: "+58 212 999 8877",
    logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=milwaukee",
    primaryColor: "#ef4444",
    currency: "USD",
    createdAt: "2026-02-01T10:00:00Z",
  },
];

export const mockFinancialAccounts: FinancialAccount[] = [
  { id: "acc-001", code: "1.1.01", name: "Caja Principal", type: "activo", balance: 12500.50, currency: "USD" },
  { id: "acc-002", code: "1.1.02", name: "Banco Nacional de Crédito", type: "activo", balance: 458000.75, currency: "USD" },
  { id: "acc-003", code: "1.2.01", name: "Cuentas por Cobrar Clientes", type: "activo", balance: 85400.00, currency: "USD" },
  { id: "acc-004", code: "2.1.01", name: "Cuentas por Pagar Proveedores", type: "pasivo", balance: 32000.00, currency: "USD" },
  { id: "acc-005", code: "3.1.01", name: "Capital Social", type: "patrimonio", balance: 500000.00, currency: "USD" },
  { id: "acc-006", code: "4.1.01", name: "Ventas de Servicios AI", type: "ingreso", balance: 152000.00, currency: "USD" },
  { id: "acc-007", code: "5.1.01", name: "Gastos de Servidores Cloud", type: "egreso", balance: 12400.00, currency: "USD" },
];

export const mockProducts: Product[] = [
  {
    id: "prod-001",
    images: ["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200"],
    name: "Manguera Radiador Superior",
    description: "Manguera de alta resistencia para sistemas de enfriamiento.",
    price: 45.50,
    cost: 15.20,
    stock: 125,
    minStock: 20,
    unit: "Unidad",
    category: "Mangueras",
    warehouseId: "wh-01",
    cauplas: "1025",
    torflex: "TF-882",
    indomax: "IM-991",
    oem: "96440232",
    aplicacion: "Chevrolet Aveo 1.6",
    descripcionManguera: "Radiador Sup. 32x450mm",
    aplicacionesDiesel: "No aplica",
    isNuevo: false,
    ventasHistory: { 2023: 150, 2024: 185, 2025: 42 },
    rankingHistory: { 2023: 12, 2024: 8, 2025: 5 },
    precioFCA: 12.50,
    status: "disponible"
  },
  {
    id: "prod-002",
    images: ["https://images.unsplash.com/photo-1486006920555-c77dcf18193b?auto=format&fit=crop&q=80&w=200"],
    name: "Manguera Intercooler Turbo",
    description: "Reforzada con aramida para alta presión.",
    price: 85.00,
    cost: 32.00,
    stock: 12,
    minStock: 15,
    unit: "Unidad",
    category: "Turbo",
    warehouseId: "wh-01",
    cauplas: "3342",
    torflex: "TF-112",
    indomax: "IM-445",
    oem: "13242352",
    aplicacion: "Ford Ranger 2.2 Diesel",
    descripcionManguera: "Salida Turbo",
    aplicacionesDiesel: "Ford Duratorq",
    isNuevo: true,
    ventasHistory: { 2023: 80, 2024: 120, 2025: 35 },
    rankingHistory: { 2023: 45, 2024: 30, 2025: 15 },
    precioFCA: 28.00,
    status: "poco_stock"
  },
  {
    id: "prod-003",
    images: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=200"],
    name: "Manguera Calefacción Inf.",
    description: "Resistente a temperaturas extremas.",
    price: 25.00,
    cost: 8.50,
    stock: 0,
    minStock: 25,
    unit: "Unidad",
    category: "Calefacción",
    warehouseId: "wh-02",
    cauplas: "4410",
    torflex: "TF-551",
    indomax: "IM-223",
    oem: "55566677",
    aplicacion: "Toyota Hilux",
    descripcionManguera: "Calefacción Retorno",
    aplicacionesDiesel: "Toyota 1KD/2KD",
    isNuevo: false,
    ventasHistory: { 2023: 250, 2024: 210, 2025: 0 },
    rankingHistory: { 2023: 1, 2024: 3, 2025: 99 },
    precioFCA: 6.80,
    status: "agotado"
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv-2026-001",
    number: "FAC-000125",
    customerId: "cust-001",
    customerName: "Tecnologías Avanzadas S.A.",
    date: "2026-02-10",
    dueDate: "2026-03-10",
    subtotal: 3000.00,
    taxTotal: 480.00,
    total: 3480.00,
    status: "pagada",
    type: "venta",
    items: [
      { productId: "prod-001", name: "Licencia API Llama 3 Enterprise", quantity: 2, price: 1500.00, tax: 240.00, total: 1740.00 }
    ]
  },
  {
    id: "inv-2026-002",
    number: "FAC-000126",
    customerId: "cust-005",
    customerName: "Corporación Delta",
    date: "2026-02-12",
    dueDate: "2026-02-26",
    subtotal: 4500.00,
    taxTotal: 720.00,
    total: 5220.00,
    status: "pendiente",
    type: "venta",
    items: [
      { productId: "prod-002", name: "Servidor Edge Violet X1", quantity: 1, price: 4500.00, tax: 720.00, total: 5220.00 }
    ]
  },
  {
    id: "inv-2026-003",
    number: "ORD-PROV-552",
    customerId: "prov-010",
    customerName: "Amazon Web Services",
    date: "2026-02-01",
    dueDate: "2026-02-15",
    subtotal: 12000.00,
    taxTotal: 0,
    total: 12000.00,
    status: "pagada",
    type: "compra",
    items: [
      { productId: "ext-001", name: "Infraestructura Cloud Mensual", quantity: 1, price: 12000.00, tax: 0, total: 12000.00 }
    ]
  }
];

export const mockEmployees: Employee[] = [
  {
    id: "emp-001",
    firstName: "Alejandro",
    lastName: "Martínez",
    dni: "V-15.882.334",
    email: "amartinez@violet.erp",
    phone: "+58 412 111 2233",
    position: "Arquitecto de IA",
    department: "Tecnología",
    salary: 4500.00,
    joinDate: "2025-05-15",
    status: "activo",
  },
  {
    id: "emp-002",
    firstName: "Elena",
    lastName: "García",
    dni: "V-20.112.445",
    email: "egarcia@violet.erp",
    phone: "+58 414 444 5566",
    position: "Gerente de Operaciones",
    department: "Administración",
    salary: 3200.00,
    joinDate: "2025-08-01",
    status: "activo",
  },
  {
    id: "emp-003",
    firstName: "Ricardo",
    lastName: "López",
    dni: "V-18.556.778",
    email: "rlopez@violet.erp",
    phone: "+58 424 777 8899",
    position: "Contador Senior",
    department: "Finanzas",
    salary: 2800.00,
    joinDate: "2026-01-10",
    status: "activo",
  },
];

export const mockDashboardData = {
  metrics: [
    {
      label: "Ventas Totales",
      value: "152.400,00 $",
      change: 12.5,
      trend: "up",
      icon: "TrendingUp",
    },
    {
      label: "Facturas Pendientes",
      value: "18",
      change: -5.0,
      trend: "down",
      icon: "FileText",
    },
    {
      label: "Ticket Promedio",
      value: "1450,00 $",
      change: 2.1,
      trend: "up",
      icon: "Landmark",
    },
    {
      label: "Conversión",
      value: "68.5%",
      change: 4.2,
      trend: "up",
      icon: "Zap",
    },
  ] as DashboardMetric[],
  revenueChart: [
    { name: "Ene", value: 125000, secondary: 85000 },
    { name: "Feb", value: 152400, secondary: 92000 },
    { name: "Mar", value: 148000, secondary: 90000 },
    { name: "Abr", value: 165000, secondary: 95000 },
    { name: "May", value: 182000, secondary: 110000 },
    { name: "Jun", value: 195000, secondary: 115000 },
  ] as ChartDataPoint[],
  expenseCategories: [
    { name: "Nómina", value: 45 },
    { name: "Infraestructura", value: 30 },
    { name: "Marketing", value: 15 },
    { name: "Otros", value: 10 },
  ] as ChartDataPoint[],
};