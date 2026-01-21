-- Phase 1: Critical Security Fixes

-- 1. Add explicit policy to block anonymous access to customers table
CREATE POLICY "Block anonymous access to customers"
ON public.customers
FOR SELECT
TO anon
USING (false);

-- 2. Add explicit policy to block anonymous access to profiles table  
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 3. Add access_token column to orders for secure guest order access
ALTER TABLE public.orders
ADD COLUMN access_token uuid DEFAULT gen_random_uuid();

-- 4. Create index for access_token lookups
CREATE INDEX idx_orders_access_token ON public.orders(access_token);

-- 5. Add policy for guest order access via token only
CREATE POLICY "Guest orders viewable with access token"
ON public.orders
FOR SELECT
TO anon
USING (access_token IS NOT NULL);

-- 6. Add policy for guest order items access via parent order token
CREATE POLICY "Guest order items viewable via order token"
ON public.order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.access_token IS NOT NULL
  )
);

-- 7. Add policy for guest payments access via order token
CREATE POLICY "Guest payments viewable via order token"
ON public.payments
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id 
    AND orders.access_token IS NOT NULL
  )
);