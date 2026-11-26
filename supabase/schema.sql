-- ============================================================================
-- ROOZNAM KIDSWEAR — COMPLETE ALL-IN-ONE SUPABASE SQL SETUP
-- Paste this entire file once in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- 2a. User Profiles (Linked 1:1 with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Lahore',
  address TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  count_label TEXT NOT NULL DEFAULT '0 styles',
  image TEXT NOT NULL,
  group_name TEXT NOT NULL CHECK (group_name IN ('girls', 'boys', 'branded', 'customized')),
  row_num INTEGER NOT NULL DEFAULT 1 CHECK (row_num IN (1, 2)),
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2c. Products (Supports Front + Matching Back Photo)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('prd-' || substr(md5(random()::text), 1, 10)),
  title TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 100 AND price <= 250000),
  image TEXT NOT NULL,
  back_image TEXT,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON UPDATE CASCADE,
  category_name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'catalog' CHECK (section IN ('new-arrivals', 'branded-ready-to-wear', 'catalog')),
  fabric TEXT NOT NULL DEFAULT 'Soft Cotton',
  fit TEXT NOT NULL DEFAULT 'Regular Fit',
  color TEXT NOT NULL DEFAULT 'Assorted',
  description TEXT NOT NULL DEFAULT '',
  sizes JSONB NOT NULL DEFAULT '["2-3 Yrs","3-4 Yrs","4-5 Yrs","5-6 Yrs","6-7 Yrs","7-8 Yrs"]'::jsonb,
  badge TEXT,
  stock INTEGER NOT NULL DEFAULT 20 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2d. Orders (Supports Guest COD + Logged-in Customer Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  order_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'WhatsAppTransfer')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Packing', 'Dispatched', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2e. Customer Wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- 2f. Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Replied', 'Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2g. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_section_active ON public.products(section, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- 4. HELPER FUNCTIONS & TRIGGERS

-- 4a. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4b. Auto-create profile row whenever a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, city, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'city', 'Lahore'),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4c. Admin Role Check Helper (Security Definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4d. Safe Public Order Tracking RPC (Exposes only non-sensitive status summary)
CREATE OR REPLACE FUNCTION public.track_order_public(p_order_id TEXT)
RETURNS TABLE (
  order_id TEXT,
  customer_first_name TEXT,
  city TEXT,
  payment_method TEXT,
  items JSONB,
  subtotal INTEGER,
  shipping_fee INTEGER,
  total INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_id,
    split_part(o.customer_name, ' ', 1) AS customer_first_name,
    o.city,
    o.payment_method,
    o.items,
    o.subtotal,
    o.shipping_fee,
    o.total,
    o.status,
    o.created_at
  FROM public.orders o
  WHERE LOWER(o.order_id) = LOWER(TRIM(p_order_id))
  LIMIT 1;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users read own profile or admin reads all" ON public.profiles;
CREATE POLICY "Users read own profile or admin reads all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own non-role profile fields" ON public.profiles;
CREATE POLICY "Users update own non-role profile fields" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Categories Policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own orders or admin reads all" ON public.orders;
CREATE POLICY "Users read own orders or admin reads all" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins update and delete orders" ON public.orders;
CREATE POLICY "Admins update and delete orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Wishlists Policies
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contact Messages Policies
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message" ON public.contact_messages
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins manage contact messages" ON public.contact_messages
  FOR ALL USING (public.is_admin());

-- Newsletter Policies
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin());

-- 6. SEED CATEGORIES
INSERT INTO public.categories (id, title, count_label, image, group_name, row_num, description, sort_order)
VALUES
  ('girls-eastern', 'Girls Eastern Wear', '6 styles', '/src/assets/images/cat-girls-eastern.jpg', 'girls', 1, 'Festive frocks, embroidered kurtis, and breathable lawn sets stitched for little celebrations.', 1),
  ('girls-western', 'Girls Western Wear', '12 styles', '/src/assets/images/cat-girls-western.jpg', 'girls', 1, 'Playful floral co-ord sets, soft denim overalls, and everyday cotton outfits for girls.', 2),
  ('boys-eastern', 'Boys Eastern Wear', '2 styles', '/src/assets/images/cat-boys-eastern.jpg', 'boys', 1, 'Classic wash-and-wear shalwar kameez, embroidered kurtas, and festive waistcoats for boys.', 3),
  ('boys-western', 'Boys Western Wear', '5 styles', '/src/assets/images/cat-boys-western.jpg', 'boys', 1, 'Smart textured shirts, comfort chinos, and soft stretchable denim built for active play.', 4),
  ('branded-rtw', 'Branded Ready To Wear', '7 styles', '/src/assets/images/cat-branded-rtw.jpg', 'branded', 2, 'Original branded kidswear from Outfitters, Edenrobe, and Ethnic—ready to wear out of the box.', 5),
  ('branded-rts', 'Branded Ready To Stitch', '5 styles', '/src/assets/images/cat-branded-rts.jpg', 'branded', 2, 'Premium unstitched branded lawn and khaddar fabrics tailored to your child''s exact age size.', 6),
  ('customized-suits', 'Customized Suits', '3 styles', '/src/assets/images/cat-customized-suits.jpg', 'customized', 2, 'Made-to-order cutwork, Sindhi embroidery, and festive celebration suits stitched in ages 2 to 8.', 7)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  count_label = EXCLUDED.count_label,
  image = EXCLUDED.image,
  description = EXCLUDED.description;

-- 7. SEED INITIAL PRODUCTS (Unique Front + Matching Back Images)
INSERT INTO public.products (id, title, price, image, back_image, category_id, category_name, section, fabric, fit, color, description, badge, stock)
VALUES
  ('na-1', 'Girls Floral Khaddar Suit | Maroon Printed', 1365, '/src/assets/images/na-maroon-front.jpg', '/src/assets/images/na_maroon_back_1795689324843.jpg', 'girls-eastern', 'Girls Eastern Wear', 'new-arrivals', 'Soft Printed Khaddar', 'Relaxed Eastern Suit', 'Maroon Floral', 'Warm, ultra-soft printed khaddar 2-piece kurta and tulip trouser set with tassel neckline.', 'New Arrival', 24),
  ('na-2', 'Girls A-Line Suit | Mustard Yellow Geometric Wide-Leg', 1365, '/src/assets/images/na-mustard-front.jpg', '/src/assets/images/na-mustard-back.jpg', 'girls-eastern', 'Girls Eastern Wear', 'new-arrivals', 'Breathable Printed Khaddar', 'A-Line Shirt with Wide-Leg Trousers', 'Mustard Yellow Geometric', 'Cheerful geometric A-line kurta paired with easy wide-leg trousers in child-friendly woven fabric.', 'Bestseller', 18),
  ('na-3', 'Outfitters Boys Textured Shirt & Cargo Set | Caramel Brown', 2890, '/src/assets/images/na-boy-caramel-front.jpg', '/src/assets/images/na_boy_caramel_back_1795689288649.jpg', 'boys-western', 'Boys Western Wear', 'new-arrivals', 'Breathable Textured Cotton', 'Regular Fit', 'Caramel Brown', 'Soft woven button-down half-sleeve shirt paired effortlessly with chocolate cargo trousers.', NULL, 20),
  ('na-4', 'Edenrobe Boys Cotton Pants | Navy Blue Chinos Regular Fit', 2190, '/src/assets/images/prod-na2-front.jpg', '/src/assets/images/prod_na2_back_1795689289133.jpg', 'boys-western', 'Boys Western Wear', 'new-arrivals', 'Soft Twill Cotton', 'Regular Fit', 'Navy Blue', 'Everyday structured cotton chinos with an adjustable interior waistband and clean back welt pockets.', NULL, 25),
  ('na-5', 'Edenrobe Boys Tailored Chinos | Midnight Navy Regular Fit', 2190, '/src/assets/images/prod-na3-front.jpg', '/src/assets/images/prod_na3_back_1795689292253.jpg', 'boys-western', 'Boys Western Wear', 'catalog', 'Stretch Cotton Chino', 'Regular Fit', 'Midnight Navy', 'Smart casual boys chinos designed for family dinners and effortless movement.', NULL, 22),
  ('na-6', 'Edenrobe Boys Ripped Jeans | Denim Light Blue Regular Fit', 2190, '/src/assets/images/prod-na4-front.jpg', '/src/assets/images/prod_na4_back_1795689289566.jpg', 'boys-western', 'Boys Western Wear', 'catalog', 'Soft Wash Comfort Denim', 'Regular Fit', 'Light Blue Denim', 'Pre-washed lightweight denim with gentle distressing and soft inner lining.', NULL, 16),
  ('na-7', 'Edenrobe Boys Jeans | Mid-Wash Denim Stretchable', 2290, '/src/assets/images/prod-na5-front.jpg', '/src/assets/images/prod_na5_back_1795689290538.jpg', 'boys-western', 'Boys Western Wear', 'catalog', 'Flex-Stretch Denim', 'Comfort Tapered', 'Mid-Wash Denim', 'Four-way comfort stretch jeans with reinforced knees and classic stitched back pockets.', NULL, 19),
  ('br-1', 'Outfitters Boys Textured Shirt | Dusty Blue Regular Fit', 2890, '/src/assets/images/prod-br1-front.jpg', '/src/assets/images/prod_br1_back_1795689291941.jpg', 'branded-rtw', 'Branded Ready To Wear', 'branded-ready-to-wear', 'Premium Waffle-Weave Cotton', 'Regular Fit', 'Dusty Blue', 'Signature branded half-sleeve collared shirt crafted in breathable textured cotton.', NULL, 15),
  ('br-2', 'Edenrobe Boys Cotton Pants | Sand Beige Chinos Regular Fit', 2190, '/src/assets/images/prod-br2-front.jpg', '/src/assets/images/prod_br2_back_1795689292151.jpg', 'branded-rtw', 'Branded Ready To Wear', 'branded-ready-to-wear', 'Breathable Cotton Chino', 'Regular Fit', 'Sand Beige', 'Tailored branded boys cotton trousers paired easily with polos, shirts, or kurtas.', NULL, 20),
  ('br-3', 'Edenrobe Boys Twill Chinos | Warm Khaki Regular Fit', 2190, '/src/assets/images/prod-br3-front.jpg', '/src/assets/images/prod_br3_back_1795689293126.jpg', 'branded-rtw', 'Branded Ready To Wear', 'branded-ready-to-wear', 'Brushed Cotton Twill', 'Regular Fit', 'Warm Khaki', 'Soft-touch branded twill pants with durable stitching and clean folded cuff detailing.', NULL, 18),
  ('br-4', 'Edenrobe Boys Comfort Jeans | Classic Blue Denim', 2190, '/src/assets/images/prod-br4-front.jpg', '/src/assets/images/prod_br4_back_1795689295375.jpg', 'branded-rtw', 'Branded Ready To Wear', 'branded-ready-to-wear', 'Soft Comfort Denim', 'Regular Fit', 'Classic Blue Denim', 'Branded boys comfort-fit jeans designed to hold shape wash after wash.', NULL, 21)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  image = EXCLUDED.image,
  back_image = EXCLUDED.back_image,
  section = EXCLUDED.section;

-- 8. STORAGE BUCKET FOR PRODUCT PHOTOS (Optional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
CREATE POLICY "Public view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
CREATE POLICY "Admins upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- ============================================================================
-- HOW TO PROMOTE YOUR ACCOUNT TO ADMIN AFTER SIGNING UP:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- ============================================================================
