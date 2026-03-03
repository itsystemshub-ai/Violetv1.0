-- Tabla de Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_rif TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_iva DECIMAL(12, 2) NOT NULL,
    tax_igtf DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    status TEXT CHECK (status IN ('pagada', 'pendiente', 'vencida', 'anulada')) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, number)
);

-- Tabla de Ítems de Factura
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    name TEXT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);

-- FUNCIÓN ATÓMICA: Procesar Venta
CREATE OR REPLACE FUNCTION process_sale(
    p_tenant_id UUID,
    p_customer_name TEXT,
    p_customer_rif TEXT,
    p_items JSONB,
    p_subtotal DECIMAL,
    p_tax_iva DECIMAL,
    p_tax_igtf DECIMAL,
    p_total DECIMAL
) RETURNS UUID AS $$
DECLARE
    v_invoice_id UUID;
    v_item RECORD;
    v_next_val INT;
    v_invoice_number TEXT;
BEGIN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_next_val FROM invoices WHERE tenant_id = p_tenant_id;
    v_invoice_number := 'FAC-' || LPAD(v_next_val::TEXT, 6, '0');

    INSERT INTO invoices (
        tenant_id, number, customer_name, customer_rif, 
        subtotal, tax_iva, tax_igtf, total, status
    ) VALUES (
        p_tenant_id, v_invoice_number, p_customer_name, p_customer_rif,
        p_subtotal, p_tax_iva, p_tax_igtf, p_total, 'pagada'
    ) RETURNING id INTO v_invoice_id;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, name TEXT, quantity INT, price DECIMAL, tax DECIMAL) LOOP
        UPDATE products SET stock = stock - v_item.quantity WHERE id = v_item.product_id;
        INSERT INTO invoice_items (invoice_id, product_id, name, quantity, price, tax)
        VALUES (v_invoice_id, v_item.product_id, v_item.name, v_item.quantity, v_item.price, v_item.tax);
    END LOOP;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
