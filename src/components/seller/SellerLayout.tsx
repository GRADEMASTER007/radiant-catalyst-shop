import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useSellerListing, useSellerProfile } from '@/hooks/use-seller';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Store,
  CreditCard,
  ExternalLink,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/products', label: 'My Products', icon: Package },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { to: '/seller/storefront', label: 'My Storefront', icon: Store },
  { to: '/seller/subscription', label: 'Plan & Billing', icon: CreditCard },
];

function isActivePath(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SellerLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: listing, isLoading: listingLoading } = useSellerListing();
  const { data: profile } = useSellerProfile();
  const location = useLocation();

  if (authLoading) {
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="glass-card mx-auto max-w-md p-8 text-center space-y-4">
            <h1 className="font-display text-2xl">Sign in to sell with us</h1>
            <p className="text-muted-foreground">
              Your seller area lets you manage your storefront, products and orders. Please sign in
              or create an account to continue.
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listingLoading && !listing) {
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="glass-card mx-auto max-w-lg p-8 text-center space-y-4">
            <h1 className="font-display text-2xl">Let's set up your storefront</h1>
            <p className="text-muted-foreground">
              You don't have a seller storefront yet. It only takes a few minutes to get started
              selling your living foods and cultures.
            </p>
            <Button asChild>
              <Link to="/sell/start">Start selling</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const businessName = listing?.business_name ?? 'Your storefront';
  const planName = profile?.planName ?? 'No plan';
  const productCount = profile?.productCount ?? 0;
  const maxProducts = profile?.maxProducts ?? 20;
  const isActive = profile?.isActive ?? false;

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {!isActive && (
          <Link
            to="/seller/subscription"
            className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground"
          >
            <AlertTriangle className="h-4 w-4 text-primary" />
            Your subscription isn't active. Choose a plan to keep your storefront visible to buyers.
          </Link>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl">{businessName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{planName}</Badge>
            <Badge variant="outline">
              {productCount} of {maxProducts} products
            </Badge>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(location.pathname, item.to, item.end);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <aside className="hidden md:block">
            <nav className="glass-card space-y-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(location.pathname, item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-border" />
              {listing?.slug && (
                <Link
                  to={`/vendor/${listing.slug}`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" />
                  View storefront
                </Link>
              )}
              <Link
                to="/products"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse marketplace
              </Link>
            </nav>
          </aside>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default SellerLayout;
