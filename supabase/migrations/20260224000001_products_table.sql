CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) DEFAULT 0.00,
    cost DECIMAL(12, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    unit TEXT DEFAULT 'unidad',
    category TEXT,
    warehouse_id TEXT,
    image_url TEXT,
    cauplas TEXT,
    torflex TEXT,
    indomax TEXT,
    oem TEXT,
    aplicacion TEXT,
    descripcion_manguera TEXT,
    aplicaciones_diesel TEXT,
    is_nuevo BOOLEAN DEFAULT FALSE,
    ventas_history JSONB DEFAULT '{"2023": 0, "2024": 0, "2025": 0}',
    ranking_history JSONB DEFAULT '{"2023": 0, "2024": 0, "2025": 0}',
    precio_fca DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('disponible', 'poco_stock', 'agotado', 'descontinuado')) DEFAULT 'disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
