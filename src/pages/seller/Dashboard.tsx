import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/lib/auth-context';
import { useSellerListing, useSellerProfile, useSellerStats } from '@/hooks/use-seller';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Package, ClipboardList, Wallet, Clock, ExternalLink } from 'lucide-react';

const currency = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

export default function SellerDashboard() {
  const { profile } = useAuth();
  const { data: listing } = useSellerListing();
  const { data: sellerProfile, isLoading: profileLoading } = useSellerProfile();
  const { data: stats, isLoading: statsLoading } = useSellerStats();

  const greetingName = profile?.full_name || listing?.business_name || 'there';

  const productCount = sellerProfile?.productCount ?? 0;
  const maxProducts = sellerProfile?.maxProducts ?? 20;

  const statCards = [
    {
      label: 'Products listed',
      value: `${productCount} of ${maxProducts} allowed`,
      icon: Package,
    },
    {
      label: 'Orders',
      value: stats?.orderCount ?? 0,
      icon: ClipboardList,
    },
    {
      label: 'Revenue',
      value: currency(stats?.revenue ?? 0),
      icon: Wallet,
    },
    {
      label: 'Awaiting fulfilment',
      value: stats?.pendingCount ?? 0,
      icon: Clock,
    },
  ];

  const checklist = [
    { label: 'Set up your storefront', done: !!listing },
    { label: 'List your first product', done: productCount > 0 },
    { label: 'Choose a subscription plan', done: sellerProfile?.isActive ?? false },
    { label: 'Share your storefront link', done: false },
  ];

  const showChecklist = productCount < 3;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl">Welcome back, {greetingName}</h2>
        <p className="text-muted-foreground">Here's how your storefront is doing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {statsLoading || profileLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="font-display text-2xl">{card.value}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {showChecklist && (
        <div className="glass-card p-6">
          <h3 className="mb-4 font-display text-lg">Getting started</h3>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="mb-4 font-display text-lg">Recent orders</h3>
          {statsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : stats && stats.recentOrders.length > 0 ? (
            <ul className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <li key={order.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-ZA')} · {order.guest_email ?? 'Registered buyer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{currency(order.total_zar ?? 0)}</p>
                    <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">No orders yet. Once you list products, orders will show up here.</p>
              <Button asChild size="sm">
                <Link to="/seller/products">List a product</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 font-display text-lg">Storefront snapshot</h3>
          <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
            {listing?.cover_image_url || listing?.logo_url ? (
              <img
                src={listing.cover_image_url ?? listing.logo_url ?? ''}
                alt={listing?.business_name ?? 'Storefront'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No cover image yet
              </div>
            )}
          </div>
          <div className="mb-4 space-y-1 text-sm">
            <p>
              Plan: <span className="font-medium">{sellerProfile?.planName ?? 'No active plan'}</span>
            </p>
            {sellerProfile?.expiresAt && (
              <p className="text-muted-foreground">
                Renews: {new Date(sellerProfile.expiresAt).toLocaleDateString('en-ZA')}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/storefront">Edit storefront</Link>
            </Button>
            {listing?.slug && (
              <Button asChild size="sm" variant="ghost">
                <Link to={`/vendor/${listing.slug}`}>
                  View live <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
