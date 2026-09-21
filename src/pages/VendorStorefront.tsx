import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/types/product';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  BadgeCheck,
  Store,
  Share2,
  Link as LinkIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function whatsappLink(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default function VendorStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['seller-vendor-listing', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const visible = listing && listing.is_active;

  useEffect(() => {
    if (listing?.id) {
      supabase
        .from('business_listings')
        .update({ view_count: (listing.view_count || 0) + 1 })
        .eq('id', listing.id)
        .then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-vendor-products', listing?.id, listing?.user_id],
    queryFn: async () => {
      if (!listing) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(
          listing.user_id
            ? `business_id.eq.${listing.id},vendor_id.eq.${listing.user_id}`
            : `business_id.eq.${listing.id}`
        )
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as unknown as Product[];
    },
    enabled: !!visible && !!listing,
  });

  const canonical = useMemo(
    () => (typeof window !== 'undefined' && slug ? `${window.location.origin}/vendor/${slug}` : ''),
    [slug]
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(canonical);
    toast({ title: 'Link copied', description: 'Share it with your customers.' });
  };

  if (listingLoading) {
    return <div className="min-h-screen" />;
  }

  if (!listing || !visible) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <Store className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Shop not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This shop doesn't exist or isn't available right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="btn-sunset">
              <Link to="/directory">Browse the directory</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/products">Browse products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const wa = whatsappLink(listing.phone);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${listing.business_name} - Living Culture Health`}
        description={listing.description?.slice(0, 155) || `${listing.business_name}'s storefront on Living Culture Health.`}
        canonical={canonical}
      />

      {/* Header */}
      <div className="relative h-56 md:h-72 w-full overflow-hidden">
        {listing.cover_image_url ? (
          <img src={listing.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="glass-card rounded-2xl p-6 md:p-8 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border">
              {listing.logo_url ? (
                <img src={listing.logo_url} alt={listing.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold">{listing.business_name}</h1>
                {listing.is_verified && (
                  <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
                <Badge variant="outline">{listing.category}</Badge>
              </div>
              {listing.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl whitespace-pre-line">
                  {listing.description}
                </p>
              )}
              {listing.address && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {listing.address}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {wa && (
              <Button asChild size="sm" className="btn-sunset">
                <a href={wa} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </Button>
            )}
            {listing.phone && (
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${listing.phone}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </a>
              </Button>
            )}
            {listing.email && (
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${listing.email}`}>
                  <Mail className="h-4 w-4 mr-2" /> Email
                </a>
              </Button>
            )}
            {listing.website && (
              <Button asChild size="sm" variant="outline">
                <a href={listing.website} target="_blank" rel="noreferrer">
                  <Globe className="h-4 w-4 mr-2" /> Website
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Share strip */}
        <div className="glass-card rounded-xl p-4 mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Share this shop
          </span>
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            <LinkIcon className="h-4 w-4 mr-2" /> Copy link
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${listing.business_name}: ${canonical}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`}
              target="_blank"
              rel="noreferrer"
            >
              Facebook
            </a>
          </Button>
        </div>

        {/* Products */}
        <div className="py-10">
          <h2 className="font-display text-2xl font-bold mb-6">Products</h2>
          {productsLoading ? (
            <p className="text-muted-foreground">Loading products…</p>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center">
              <p className="text-muted-foreground">
                This seller hasn't listed any products just yet — check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
