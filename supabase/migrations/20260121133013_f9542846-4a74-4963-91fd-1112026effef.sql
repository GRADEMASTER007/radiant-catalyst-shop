-- Add rooting_status field to orders table for tracking rooting progress
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rooting_status text DEFAULT NULL;

-- Add a comment to explain the field
COMMENT ON COLUMN public.orders.rooting_status IS 'Tracks rooting service status: pending, in_progress, ready, shipped';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_rooting_status ON public.orders(rooting_status) WHERE rooting_status IS NOT NULL;