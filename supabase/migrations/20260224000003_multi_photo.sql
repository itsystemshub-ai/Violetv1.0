-- Migración para soportar múltiples fotos en el inventario
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
UPDATE products SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_urls = '{}';

-- Tabla de Todos para pruebas
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar tareas de ejemplo
INSERT INTO todos (title, completed) VALUES 
('Configurar Supabase', true),
('Importar catálogo de mangueras', false),
('Personalizar branding de Cauplas', false)
ON CONFLICT DO NOTHING;
