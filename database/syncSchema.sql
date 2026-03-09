-- Esquema de Sincronización para el Maestro Local (Computador A)

-- 1. Tabla de Logs de Sincronización
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    payload JSONB,
    sync_status TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Función para registrar cambios automáticamente (CDC - Change Data Capture)
CREATE OR REPLACE FUNCTION fn_log_sync_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sync_logs (table_name, record_id, action, payload)
    VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicación a tablas clave

-- Tabla: Tenants (Empresas)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    fiscal_name TEXT,
    rif TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#7c3aed',
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_sync_tenants ON tenants;
CREATE TRIGGER trg_sync_tenants
AFTER INSERT OR UPDATE OR DELETE ON tenants
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();

-- Otras tablas...
DROP TRIGGER IF EXISTS trg_sync_products ON products;
-- ... (rest of triggers)
CREATE TRIGGER trg_sync_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();

DROP TRIGGER IF EXISTS trg_sync_invoices ON invoices;
CREATE TRIGGER trg_sync_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();

DROP TRIGGER IF EXISTS trg_sync_transactions ON financial_transactions;
CREATE TRIGGER trg_sync_transactions
AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();

DROP TRIGGER IF EXISTS trg_sync_employees ON employees;
CREATE TRIGGER trg_sync_employees
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();

DROP TRIGGER IF EXISTS trg_sync_suppliers ON suppliers;
CREATE TRIGGER trg_sync_suppliers
AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION fn_log_sync_change();
