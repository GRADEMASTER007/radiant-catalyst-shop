-- Fix CRITICAL: Guest orders policy exposes all guest orders
-- Drop the insecure policy
DROP POLICY IF EXISTS "Guests view own orders by UUID" ON public.orders;

-- Create a secure policy that requires the order to be accessed via a specific lookup
-- Guests can only view orders if they provide the exact order_id AND the order has their email
-- This is handled at the application level - guests must provide order_id to lookup
-- For RLS, we simply don't allow anonymous SELECT on guest orders (they use service role via edge function)

-- Add admin insert policy for edge functions creating orders
CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);