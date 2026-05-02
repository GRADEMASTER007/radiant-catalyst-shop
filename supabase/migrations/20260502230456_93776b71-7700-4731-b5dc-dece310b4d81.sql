
-- Harden orders: ensure guest orders (customer_id IS NULL) are NEVER visible to authenticated/anon roles
-- Only service_role and admins may read guest orders. Guest lookups go through the guest-order-lookup edge function (service role).
CREATE POLICY "Block guest order rows from non-service access"
ON public.orders
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (
  customer_id IS NOT NULL
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Harden api_keys_vault: explicit restrictive deny for non-admins on all operations
CREATE POLICY "Deny non-admins on api_keys_vault"
ON public.api_keys_vault
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Harden customers: explicit restrictive policy ensuring rows only accessible to owner or admin
CREATE POLICY "Restrict customers to owner or admin"
ON public.customers
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));
