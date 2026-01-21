-- Fix orders table: Replace overly permissive access_token policy with a secure token-based verification
-- The old policy allowed anyone to view orders if access_token IS NOT NULL (always true due to default)
-- New policy requires the access_token to be explicitly provided in a request header/function param

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Guest orders viewable with access token" ON public.orders;

-- Create a new, more secure policy for guest order access
-- Guest orders can only be viewed by the order owner (matching customer_id or via service role)
-- The access_token is now only useful when verified server-side, not for direct RLS bypass
CREATE POLICY "Guest orders viewable by owner or service role"
ON public.orders
FOR SELECT
USING (
  -- Authenticated user viewing their own order
  (auth.uid() = customer_id)
  OR
  -- Service role access (for server-side token verification)
  (auth.role() = 'service_role')
  OR
  -- Admin access
  (public.has_role(auth.uid(), 'admin'))
);

-- Also drop and recreate the order_items policy to be consistent
DROP POLICY IF EXISTS "Guest order items viewable via order token" ON public.order_items;

CREATE POLICY "Order items viewable by order owner or service role"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.customer_id = auth.uid()
      OR auth.role() = 'service_role'
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);

-- Also update payments policy
DROP POLICY IF EXISTS "Guest payments viewable via order token" ON public.payments;

CREATE POLICY "Payments viewable by order owner or service role"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id
    AND (
      orders.customer_id = auth.uid()
      OR auth.role() = 'service_role'
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);