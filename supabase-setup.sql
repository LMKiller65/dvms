-- ====================================================================
-- DIEU VA ME SAUVER (DVMS) - Database Setup (Gabon Edition)
-- Run this in your Supabase SQL Editor to create tables & seed products.
-- ====================================================================

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image_url TEXT,
    sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    colors TEXT[] DEFAULT ARRAY['Noir'],
    category TEXT DEFAULT 'T-Shirt',
    status TEXT DEFAULT 'active', -- 'active', 'sold_out', 'draft'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Create the settings table (Used for dynamic config like WhatsApp number)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Products
CREATE POLICY "Allow public read access to products" 
ON public.products FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to products" 
ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. RLS Policies for Settings
CREATE POLICY "Allow public read access to settings" 
ON public.settings FOR SELECT TO public USING (true);

CREATE POLICY "Allow public write access to settings" 
ON public.settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Seed the database with initial settings (Default Gabon WhatsApp number)
INSERT INTO public.settings (key, value)
VALUES ('whatsapp_number', '24106200000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. Seed the database with premium Gabon streetwear collection (Prices in FCFA)
INSERT INTO public.products (title, description, price, image_url, sizes, colors, category, status)
VALUES 
(
    'T-SHIRT OVERSIZED "DIEU VA"', 
    'T-shirt coupe ultra oversized en coton lourd 240 GSM. Logo imprimé sérigraphie face haute densité. Col haut côtelé épais. Noir délavé industriel.', 
    25000, 
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['S', 'M', 'L', 'XL'], 
    ARRAY['Noir', 'Gris Délavé'],
    'T-Shirt', 
    'active'
),
(
    'T-SHIRT OUTLINE "ME SAUVER"', 
    'T-shirt coupe boxy en coton blanc craie 220 GSM. Motif signature avec lettrage contour brodé noir sur la poitrine. Coutures contrastées apparentes.', 
    25000, 
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['M', 'L', 'XL'], 
    ARRAY['Blanc Craie', 'Noir'],
    'T-Shirt', 
    'active'
),
(
    'HOODIE LOURD "SIGNATURE"', 
    'Sweat à capuche en molleton ultra-épais 450 GSM. Coupe courte et boxy (boxy cropped). Capuche double épaisseur sans cordon. Broderie DVMS ton sur ton sur la manche droite.', 
    50000, 
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['S', 'M', 'L'], 
    ARRAY['Noir Noir', 'Charbon'],
    'Sweatshirt', 
    'active'
),
(
    'CASQUETTE COMPRESSION "DVMS DUST"', 
    'Casquette déstructurée 6 panels en sergé de coton délavé à l''acide. Logo DVMS brodé en relief sur l''avant. Boucle métallique de serrage style industriel.', 
    18000, 
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['Unique'], 
    ARRAY['Noir Acide'],
    'Accessoire', 
    'active'
),
(
    'CARGO WIDE-LEG "BRUTAL"', 
    'Pantalon cargo coupe large à pinces en nylon ripstop technique durable. Poches 3D asymétriques avec sangles de serrage contrastées. Ourlet ajustable par cordon élastique.', 
    55000, 
    'https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['S', 'M', 'L', 'XL'], 
    ARRAY['Nylon Noir', 'Kaki Brutal'],
    'Pantalon', 
    'active'
),
(
    'BONNET TRICOT "NOISE"', 
    'Bonnet court style docker tricoté en maille côtelée acrylique de haute qualite. Étiquette tissée DVMS noire cousue sur le revers.', 
    15000, 
    'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop', 
    ARRAY['Unique'], 
    ARRAY['Noir Tactique', 'Orange Vif'],
    'Accessoire', 
    'sold_out'
);
