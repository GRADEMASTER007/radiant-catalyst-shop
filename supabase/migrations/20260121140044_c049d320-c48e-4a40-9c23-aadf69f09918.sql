-- Add unique constraint on order_id for payments table to support upsert
ALTER TABLE public.payments 
ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);