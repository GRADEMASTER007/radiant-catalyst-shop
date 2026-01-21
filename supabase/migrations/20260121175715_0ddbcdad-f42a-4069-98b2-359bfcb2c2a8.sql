-- Fix RLS policy for orders to allow both authenticated users and guest checkout
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Create permissive policy for authenticated users creating their own orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  (customer_id = auth.uid()) OR 
  (customer_id IS NULL AND guest_email IS NOT NULL)
);

-- Create permissive policy for anonymous/guest checkout
CREATE POLICY "Anonymous users can create guest orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (
  customer_id IS NULL AND guest_email IS NOT NULL
);