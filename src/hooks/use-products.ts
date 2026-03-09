import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, Category } from '@/types/product';

// Filter out products that should be hidden after promo ends
function filterPromoExpired(products: any[]): Product[] {
  const now = new Date();
  return products.filter((p) => {
    // If hide_after_promo is true and promo has ended, hide the product
    if (p.hide_after_promo && p.promo_ends_at && new Date(p.promo_ends_at) < now) {
      return false;
    }
    return true;
  }).map((p) => {
    // Apply promo price if within promo period
    if (p.promo_price_zar && p.promo_starts_at && p.promo_ends_at) {
      const start = new Date(p.promo_starts_at);
      const end = new Date(p.promo_ends_at);
      if (now >= start && now <= end) {
        return {
          ...p,
          compare_at_price_zar: p.price_zar, // Show original as compare price
          price_zar: p.promo_price_zar,
        };
      }
    }
    return p;
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return filterPromoExpired(data || []);
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return filterPromoExpired(data || []);
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      if (!data) return null;
      
      const filtered = filterPromoExpired([data]);
      return filtered.length > 0 ? filtered[0] : null;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProductsByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async (): Promise<Product[]> => {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (catError) throw catError;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return filterPromoExpired(data || []);
    },
    enabled: !!categorySlug,
  });
}
