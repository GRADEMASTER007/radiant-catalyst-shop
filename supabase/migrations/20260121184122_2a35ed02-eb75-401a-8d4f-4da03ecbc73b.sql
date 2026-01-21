-- Create shipping rates table for admin-editable rates
CREATE TABLE public.shipping_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- 'pudo', 'courier_guy', 'custom'
  service_name TEXT NOT NULL, -- 'Extra Small', 'Small', 'Medium', etc.
  service_code TEXT, -- optional code for API matching
  max_weight_kg DECIMAL(10,2) NOT NULL,
  max_length_cm DECIMAL(10,2),
  max_width_cm DECIMAL(10,2),
  max_height_cm DECIMAL(10,2),
  price_zar DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Public read access (customers need to see rates)
CREATE POLICY "Anyone can view active shipping rates" 
ON public.shipping_rates 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all rates
CREATE POLICY "Admins can manage shipping rates" 
ON public.shipping_rates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_shipping_rates_updated_at
BEFORE UPDATE ON public.shipping_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert PUDO default rates from your rate card
INSERT INTO public.shipping_rates (provider, service_name, max_weight_kg, max_length_cm, max_width_cm, max_height_cm, price_zar, description, sort_order) VALUES
('pudo', 'Extra Small', 2, 60, 17, 8, 50, 'Door to Locker / Locker to Door - Max 2kg', 1),
('pudo', 'Small', 5, 60, 41, 8, 60, 'Door to Locker / Locker to Door - Max 5kg', 2),
('pudo', 'Medium', 10, 60, 41, 19, 100, 'Door to Locker / Locker to Door - Max 10kg', 3),
('pudo', 'Large', 15, 60, 41, 41, 150, 'Door to Locker / Locker to Door - Max 15kg', 4),
('pudo', 'Extra Large', 20, 60, 41, 69, 200, 'Door to Locker / Locker to Door - Max 20kg', 5),
('pudo_locker', 'Locker to Locker XS', 2, 60, 17, 8, 40, 'Locker to Locker Only - Extra Small', 6),
('pudo_locker', 'Locker to Locker S/M/L/XL', 20, 60, 41, 69, 50, 'Locker to Locker Only - Small to Extra Large', 7);