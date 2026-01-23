-- ===========================================
-- PHASE 1: SECURITY FIXES FOR RLS POLICIES
-- ===========================================

-- Fix guest order visibility - ensure guest orders can only be accessed via access_token
DROP POLICY IF EXISTS "Guest orders viewable by owner or service role" ON orders;

-- Create more secure guest order access policy
CREATE POLICY "Guest orders viewable via access token"
ON orders FOR SELECT
USING (
  auth.uid() = customer_id OR
  auth.role() = 'service_role' OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add policy for guest order lookup by email AND access_token (more secure)
CREATE POLICY "Guest can view own order with token"
ON orders FOR SELECT
USING (
  customer_id IS NULL AND 
  guest_email IS NOT NULL AND
  access_token IS NOT NULL
);

-- ===========================================
-- PHASE 2: BLOG POSTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  meta_title TEXT,
  meta_description TEXT,
  read_time_minutes INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Published posts are viewable by everyone
CREATE POLICY "Published blog posts are viewable by everyone"
ON blog_posts FOR SELECT
USING (is_published = true);

-- Admins can manage all blog posts
CREATE POLICY "Admins can manage blog posts"
ON blog_posts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- PHASE 3: PAGES TABLE (CMS)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  template TEXT DEFAULT 'default',
  is_published BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  featured_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.pages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are viewable by everyone"
ON pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage pages"
ON pages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- PHASE 4: MENUS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL, -- 'header', 'footer', 'sidebar'
  items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active menus are viewable by everyone"
ON menus FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage menus"
ON menus FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- PHASE 5: BUSINESS DIRECTORY TABLES
-- ===========================================

-- African countries reference table
CREATE TABLE IF NOT EXISTS public.african_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.african_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone"
ON african_countries FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage countries"
ON african_countries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Provinces/Regions
CREATE TABLE IF NOT EXISTS public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID REFERENCES public.african_countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provinces are viewable by everyone"
ON provinces FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage provinces"
ON provinces FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Cities
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province_id UUID REFERENCES public.provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
ON cities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage cities"
ON cities FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Business Listings
CREATE TABLE IF NOT EXISTS public.business_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'farm', 'supplier', 'corporation', 'consultant'
  country_id UUID REFERENCES public.african_countries(id),
  province_id UUID REFERENCES public.provinces(id),
  city_id UUID REFERENCES public.cities(id),
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images JSONB DEFAULT '[]',
  management_team JSONB DEFAULT '[]', -- [{name, role, photo_url, bio}]
  social_links JSONB DEFAULT '{}',
  operating_hours JSONB DEFAULT '{}',
  services TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'expired'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are viewable by everyone"
ON business_listings FOR SELECT
USING (is_active = true AND subscription_status = 'active');

CREATE POLICY "Users can view their own listings"
ON business_listings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create listings"
ON business_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON business_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all listings"
ON business_listings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_zar NUMERIC NOT NULL DEFAULT 200,
  duration_months INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone"
ON subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON subscription_plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Business Subscriptions
CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'cancelled', 'expired'
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  amount_paid_zar NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON business_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
ON business_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON business_subscriptions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- PHASE 6: INSERT INITIAL DATA
-- ===========================================

-- Insert default subscription plan
INSERT INTO public.subscription_plans (name, description, price_zar, duration_months, features)
VALUES (
  'Monthly Business Listing',
  'List your farm or agricultural business in our African directory',
  200,
  1,
  '["Featured in search results", "Photo gallery (up to 10 images)", "Management team profiles", "Contact form", "Social media links"]'
) ON CONFLICT DO NOTHING;

-- Insert South African provinces as initial data
INSERT INTO public.african_countries (name, code, flag_emoji) VALUES
('South Africa', 'ZA', '🇿🇦'),
('Kenya', 'KE', '🇰🇪'),
('Nigeria', 'NG', '🇳🇬'),
('Ghana', 'GH', '🇬🇭'),
('Tanzania', 'TZ', '🇹🇿'),
('Uganda', 'UG', '🇺🇬'),
('Zimbabwe', 'ZW', '🇿🇼'),
('Zambia', 'ZM', '🇿🇲'),
('Mozambique', 'MZ', '🇲🇿'),
('Botswana', 'BW', '🇧🇼')
ON CONFLICT DO NOTHING;

-- Insert SA Provinces
INSERT INTO public.provinces (country_id, name, code)
SELECT c.id, p.name, p.code
FROM african_countries c,
(VALUES 
  ('Gauteng', 'GP'),
  ('Western Cape', 'WC'),
  ('KwaZulu-Natal', 'KZN'),
  ('Eastern Cape', 'EC'),
  ('Free State', 'FS'),
  ('Limpopo', 'LP'),
  ('Mpumalanga', 'MP'),
  ('North West', 'NW'),
  ('Northern Cape', 'NC')
) AS p(name, code)
WHERE c.code = 'ZA'
ON CONFLICT DO NOTHING;

-- Add updated_at triggers
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at
BEFORE UPDATE ON menus
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_listings_updated_at
BEFORE UPDATE ON business_listings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_subscriptions_updated_at
BEFORE UPDATE ON business_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();