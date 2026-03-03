-- 1. Tabla de Cuentas Financieras (Plan de Cuentas)
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso')) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 2. Tabla de Transacciones Financieras (Libro Mayor)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('debe', 'haber')) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reference_id TEXT, -- Para enlazar con invoices o nómina
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Empleados
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dni TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    salary DECIMAL(12, 2) DEFAULT 0.00,
    join_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('activo', 'suspendido', 'retirado')) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, dni)
);

-- 4. Tabla de Proveedores (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rif TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    category TEXT DEFAULT 'Estratégico',
    status TEXT DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, rif)
);

-- 5. Actualización de Invoices (Ventas vs Compras)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='type') THEN
        ALTER TABLE invoices ADD COLUMN type TEXT CHECK (type IN ('venta', 'compra')) DEFAULT 'venta';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='supplier_id') THEN
        ALTER TABLE invoices ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
    END IF;
END $$;

-- 6. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tenant ON financial_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account ON financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
