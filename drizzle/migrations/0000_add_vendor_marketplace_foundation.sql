-- =============================================================================
-- Multi-vendor marketplace foundation for Living Culture Health
-- Sellers list their own products (capped by plan), see their own orders,
-- and buyers keep seeing every active product.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Link products to the seller who owns them.
--    Nullable on purpose: existing platform-owned products stay NULL and keep
--    working exactly as before.
--    No FK to auth.users (managed by the platform); vendor_id stores a user id.
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE INDEX IF NOT EXISTS products_vendor_id_idx ON public.products (vendor_id);
CREATE INDEX IF NOT EXISTS products_business_id_idx ON public.products (business_id);
CREATE INDEX IF NOT EXISTS business_listings_user_id_idx ON public.business_listings (user_id);

DO $$ BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.business_listings (id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. Seller helpers.
--    SECURITY DEFINER so RLS policies and triggers can read subscription data
--    without recursing into their own policies. Execution is restricted below.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vendor_has_active_listing(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_listings b
    WHERE b.user_id = _user_id AND b.is_active = true
  );
$$;

-- Product ceiling comes from the seller's active plan (features.max_products),
-- falling back to the platform default of 20 so a seller can never be unlimited.
CREATE OR REPLACE FUNCTION public.vendor_max_products(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT NULLIF(sp.features ->> 'max_products', '')::integer
      FROM public.business_listings b
      JOIN public.business_subscriptions s ON s.business_id = b.id
      JOIN public.subscription_plans sp ON sp.id = s.plan_id
     WHERE b.user_id = _user_id
       AND b.is_active = true
       AND s.status = 'active'
       AND (s.expires_at IS NULL OR s.expires_at > now())
     ORDER BY s.expires_at DESC NULLS LAST
     LIMIT 1
  ), 20);
$$;

-- -----------------------------------------------------------------------------
-- 3. Seller product rules on create:
--    must have a seller account, gets stamped with their storefront, and the
--    plan's product ceiling is enforced here (a trigger, not a CHECK, because
--    the limit depends on live subscription state).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_vendor_product_rules()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_max  integer;
  v_have integer;
  v_biz  uuid;
BEGIN
  -- Platform-owned products (admin listings) are exempt from seller rules.
  IF NEW.vendor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.vendor_has_active_listing(NEW.vendor_id) THEN
    RAISE EXCEPTION 'You need an active seller account before you can list products.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.business_id IS NULL THEN
    SELECT b.id INTO v_biz
      FROM public.business_listings b
     WHERE b.user_id = NEW.vendor_id AND b.is_active = true
     ORDER BY b.created_at
     LIMIT 1;
    NEW.business_id := v_biz;
  END IF;

  v_max  := public.vendor_max_products(NEW.vendor_id);
  v_have := 0;
  SELECT count(*) INTO v_have FROM public.products WHERE vendor_id = NEW.vendor_id;

  IF v_have >= v_max THEN
    RAISE EXCEPTION 'Your plan allows % products. Remove one or upgrade your plan to list more.', v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_vendor_product_rules ON public.products;
CREATE TRIGGER trg_vendor_product_rules
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_product_rules();

-- -----------------------------------------------------------------------------
-- 4. Sellers do not need to invent SKUs or URLs: fill them in when the form
--    leaves them blank (both columns are NOT NULL today).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalise_product_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := trim(both '-' from
      regexp_replace(lower(coalesce(NEW.name, 'product')), '[^a-z0-9]+', '-', 'g'));
    IF length(NEW.slug) < 2 THEN
      NEW.slug := 'product';
    END IF;
    IF EXISTS (SELECT 1 FROM public.products p WHERE p.slug = NEW.slug) THEN
      NEW.slug := NEW.slug || '-' || lower(substr(md5(random()::text), 1, 6));
    END IF;
  END IF;

  IF NEW.sku IS NULL OR btrim(NEW.sku) = '' THEN
    NEW.sku := 'LC-' || upper(substr(md5(coalesce(NEW.name, '') || clock_timestamp()::text), 1, 8));
    WHILE EXISTS (SELECT 1 FROM public.products p WHERE p.sku = NEW.sku) LOOP
      NEW.sku := 'LC-' || upper(substr(md5(clock_timestamp()::text), 1, 8));
    END LOOP;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_normalise_product_fields ON public.products;
CREATE TRIGGER trg_normalise_product_fields
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.normalise_product_fields();

-- -----------------------------------------------------------------------------
-- 5. Order visibility for sellers, resolved without RLS recursion.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vendor_order_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT oi.order_id
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
   WHERE p.vendor_id = _user_id;
$$;

-- -----------------------------------------------------------------------------
-- 6. Grants (the Data API needs these explicitly; RLS alone is not enough).
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT ON public.business_listings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.business_listings TO authenticated;
GRANT ALL ON public.business_listings TO service_role;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.business_subscriptions TO authenticated;
GRANT ALL ON public.business_subscriptions TO service_role;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

-- -----------------------------------------------------------------------------
-- 7. Row level security. Existing policies stay; these are additive (OR).
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view their own products" ON public.products;
CREATE POLICY "Vendors can view their own products" ON public.products
  FOR SELECT TO authenticated
  USING (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Vendors can create their own products" ON public.products;
CREATE POLICY "Vendors can create their own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
CREATE POLICY "Vendors can update their own products" ON public.products
  FOR UPDATE TO authenticated
  USING (vendor_id = (SELECT auth.uid()))
  WITH CHECK (vendor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;
CREATE POLICY "Vendors can delete their own products" ON public.products
  FOR DELETE TO authenticated
  USING (vendor_id = (SELECT auth.uid()));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors can view orders containing their products" ON public.orders;
CREATE POLICY "Vendors can view orders containing their products" ON public.orders
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.vendor_order_ids((SELECT auth.uid()))));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;
CREATE POLICY "Vendors can view their order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT public.vendor_order_ids((SELECT auth.uid()))));

-- -----------------------------------------------------------------------------
-- 8. Keep the new SECURITY DEFINER helpers off limits to anonymous callers.
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.vendor_has_active_listing(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.vendor_max_products(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_vendor_product_rules() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.normalise_product_fields() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.vendor_order_ids(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.vendor_has_active_listing(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vendor_max_products(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vendor_order_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_vendor_product_rules() TO service_role;
GRANT EXECUTE ON FUNCTION public.normalise_product_fields() TO service_role;