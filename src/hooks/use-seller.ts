import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

export interface SellerListing {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  cover_image_url: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
  is_active: boolean | null;
  view_count: number | null;
  created_at: string;
}

export function useSellerListing() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller-listing', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SellerListing | null;
    },
  });
}

export function useSellerProfile() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['seller-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const empty = {
        listing: null as SellerListing | null,
        hasListing: false,
        isActive: false,
        maxProducts: 20,
        productCount: 0,
        productsRemaining: 20,
        atLimit: false,
        planName: null as string | null,
        planPrice: null as number | null,
        expiresAt: null as string | null,
      };

      if (!user) return empty;

      const { data: listing } = await supabase
        .from('business_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!listing) return empty;

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      let maxProducts = 20;
      let planName: string | null = null;
      let planPrice: number | null = null;

      const isActive = listing.subscription_status === 'active';

      if (isActive) {
        const { data: sub } = await supabase
          .from('business_subscriptions')
          .select('plan_id, subscription_plans(name, price_zar, features)')
          .eq('business_id', listing.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const rawPlan = (sub as any)?.subscription_plans;
        const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
        if (plan) {
          planName = plan.name ?? null;
          planPrice = plan.price_zar ?? null;
          const features = (plan.features ?? {}) as any;
          maxProducts = typeof features.max_products === 'number' ? features.max_products : 20;
        }
      }

      const count = productCount ?? 0;
      const productsRemaining = Math.max(maxProducts - count, 0);

      return {
        listing: listing as SellerListing,
        hasListing: true,
        isActive,
        maxProducts,
        productCount: count,
        productsRemaining,
        atLimit: count >= maxProducts,
        planName,
        planPrice,
        expiresAt: listing.subscription_expires_at,
      };
    },
  });
}

export function useSellerPlans() {
  return useQuery({
    queryKey: ['seller-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_zar', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSellerSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller-subscriptions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_subscriptions')
        .select('*, subscription_plans(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSellerStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const empty = {
        productCount: 0,
        activeProductCount: 0,
        orderCount: 0,
        revenue: 0,
        pendingCount: 0,
        recentOrders: [] as any[],
      };
      if (!user) return empty;

      const { data: products } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('vendor_id', user.id);

      const productIds = (products ?? []).map((p) => p.id);
      const productCount = products?.length ?? 0;
      const activeProductCount = (products ?? []).filter((p) => p.is_active).length;

      if (productIds.length === 0) {
        return { ...empty, productCount, activeProductCount };
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, total_price_zar, orders(id, order_number, status, payment_status, total_zar, guest_email, customer_id, created_at)')
        .in('product_id', productIds);

      const orderMap = new Map<string, any>();
      let revenue = 0;
      let pendingCount = 0;

      for (const item of items ?? []) {
        const order = (item as any).orders;
        if (!order) continue;
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, order);
          if (order.status === 'pending' || order.status === 'processing') pendingCount += 1;
        }
        // A seller earns their own line total, never the whole order, because
        // one basket can contain several sellers' products.
        if (order.payment_status === 'paid') revenue += item.total_price_zar ?? 0;
      }

      const recentOrders = Array.from(orderMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return {
        productCount,
        activeProductCount,
        orderCount: orderMap.size,
        revenue,
        pendingCount,
        recentOrders,
      };
    },
  });
}
