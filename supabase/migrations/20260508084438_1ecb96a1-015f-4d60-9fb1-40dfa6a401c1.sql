
-- Fix 1: Tighten carts RLS to authenticated owners only
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can delete their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can create carts" ON public.carts;

CREATE POLICY "Owners can view their cart"
  ON public.carts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Owners can insert their cart"
  ON public.carts FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Owners can update their cart"
  ON public.carts FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Owners can delete their cart"
  ON public.carts FOR DELETE TO authenticated
  USING (customer_id = auth.uid());

-- Fix 2: Hide cost_price_zar from public/auth users (admins/service_role still see via bypass)
REVOKE SELECT (cost_price_zar) ON public.products FROM anon, authenticated;
