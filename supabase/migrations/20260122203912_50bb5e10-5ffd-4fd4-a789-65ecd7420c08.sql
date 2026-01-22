-- Fix RLS policies for orders table to properly handle payment gateway flows
-- The issue: authenticated users setting customer_id that might not match auth.uid() 
-- or the check logic being too restrictive

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Anonymous users can create guest orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create a unified INSERT policy that handles both authenticated and guest users properly
-- Authenticated users: customer_id must be their own ID (or null for guest checkout)
-- Anonymous users: customer_id must be null and guest_email required
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Case 1: Authenticated user placing their own order
  (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  OR
  -- Case 2: Guest checkout (both anon and authenticated can do guest checkout)
  (customer_id IS NULL AND guest_email IS NOT NULL)
  OR
  -- Case 3: Authenticated user explicitly doing guest checkout 
  (auth.uid() IS NOT NULL AND customer_id IS NULL AND guest_email IS NOT NULL)
);

-- Also ensure order_items INSERT works for these orders
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;

CREATE POLICY "Users can insert order items for their orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.customer_id = auth.uid()
      OR (orders.customer_id IS NULL AND orders.guest_email IS NOT NULL)
    )
  )
);