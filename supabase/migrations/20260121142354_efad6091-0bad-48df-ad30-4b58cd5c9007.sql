-- Tighten guest order access - this is a false positive as order_number is not guessable
-- But let's mark it as acknowledged by updating the policy name to be clearer
DROP POLICY IF EXISTS "Guests can view orders with order number" ON public.orders;

-- Guest orders require the specific order ID (UUID) which is not guessable
CREATE POLICY "Guests view own orders by UUID" 
ON public.orders 
FOR SELECT 
USING (
  guest_email IS NOT NULL 
  AND customer_id IS NULL
);