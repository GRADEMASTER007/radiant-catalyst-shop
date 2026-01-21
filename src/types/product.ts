import { Json } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  price_zar: number;
  compare_at_price_zar: number | null;
  cost_price_zar: number | null;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  allow_backorder: boolean;
  images: Json;
  primary_image_url: string | null;
  brand: string | null;
  barcode: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_email: string | null;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method: string | null;
  payment_reference: string | null;
  subtotal_zar: number;
  shipping_cost_zar: number;
  discount_zar: number;
  tax_zar: number;
  total_zar: number;
  currency: string;
  shipping_method: string | null;
  shipping_address: ShippingAddress | null;
  billing_address: ShippingAddress | null;
  notes: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}
