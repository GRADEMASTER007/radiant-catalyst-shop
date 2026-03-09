
-- Promo codes table
CREATE TABLE public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  starts_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for coupon_codes
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons" ON public.coupon_codes
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupon_codes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add promo scheduling fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_starts_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_ends_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_price_zar numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hide_after_promo boolean NOT NULL DEFAULT false;

-- Add discount columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coupon_discount_zar numeric DEFAULT 0;
