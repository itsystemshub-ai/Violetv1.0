-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Tenants (Empresas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    rif TEXT NOT NULL,
    fiscal_name TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#7c3aed',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Usuarios (Enlazada con Auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_super_admin BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla sys_config (El Cerebro)
CREATE TABLE IF NOT EXISTS sys_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- NULL para config global
    module TEXT NOT NULL, -- 'sales', 'inventory', 'finance', etc.
    key TEXT NOT NULL, -- 'tax_rules', 'approval_workflow', 'custom_fields'
    value_type TEXT CHECK (value_type IN ('string', 'number', 'json', 'boolean')),
    value_json JSONB,
    description TEXT,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_sys_config_tenant ON sys_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sys_config_module_key ON sys_config(module, key);

-- 4. Inserción de Config de Ejemplo (Localización Venezuela)
INSERT INTO sys_config (module, key, value_type, value_json, description)
VALUES 
('global', 'venezuela_taxes', 'json', 
 '{
  "iva_general": 16,
  "iva_reducido": 8,
  "iva_lujo": 31,
  "igtf_divisas": 3,
  "rif_mask": "J-00000000-0"
 }', 
 'Reglas de impuestos y validaciones para Venezuela')
ON CONFLICT DO NOTHING;
