-- Fix the critical security issue with guest orders email exposure
-- Update the policy to require access_token validation

-- Drop the problematic policies
DROP POLICY IF EXISTS "Guest can view own order with token" ON orders;
DROP POLICY IF EXISTS "Guest orders viewable via access token" ON orders;

-- Create a more restrictive policy for guest orders
-- This requires access via a secure edge function using service role, not direct RLS access
CREATE POLICY "Guest orders require service role or user auth"
ON orders
FOR SELECT
USING (
  -- Authenticated users can see their own orders
  (auth.uid() = customer_id)
  -- OR service role for edge function access
  OR (auth.role() = 'service_role')
  -- OR admin access
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Keep the existing authenticated user policy
-- The "Users can view their own orders" policy already exists and is correct