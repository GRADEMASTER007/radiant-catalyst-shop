-- Fix payments table RLS - should only allow service role, not public
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create proper policies for payments
CREATE POLICY "Service role full access" 
ON public.payments 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own payments via order relationship
CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders guest access - require order_number for guest lookups
DROP POLICY IF EXISTS "Guests can view their orders by ID" ON public.orders;

-- Guests need order number to view their order (more secure)
CREATE POLICY "Guests can view orders with order number" 
ON public.orders 
FOR SELECT 
USING (
  guest_email IS NOT NULL 
  AND customer_id IS NULL 
  AND order_number IS NOT NULL
);