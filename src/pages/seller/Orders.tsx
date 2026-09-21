import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

const formatZAR = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

type FilterTab = 'all' | 'awaiting' | 'completed';

const AWAITING_STATUSES = ['pending', 'paid'];
const COMPLETED_STATUSES = ['delivered', 'completed'];

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (COMPLETED_STATUSES.includes(status)) return 'default';
  if (AWAITING_STATUSES.includes(status)) return 'secondary';
  return 'outline';
}

export default function SellerOrders() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: myOrderItems } = useQuery({
    queryKey: ['seller-order-item-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: myProducts, error: prodErr } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', user.id);
      if (prodErr) throw prodErr;
      const productIds = (myProducts ?? []).map((p) => p.id);
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, product_id, product_name, quantity, unit_price_zar, total_price_zar')
        .in('product_id', productIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const orderIds = useMemo(() => {
    if (!myOrderItems) return [];
    return Array.from(new Set(myOrderItems.map((i) => i.order_id)));
  }, [myOrderItems]);

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['seller-orders', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: orderIds.length > 0,
  });

  const enrichedOrders = useMemo(() => {
    if (!orders || !myOrderItems) return [];
    return orders.map((order) => {
      const items = myOrderItems.filter((i) => i.order_id === order.id);
      const sellerTotal = items.reduce((sum, i) => sum + Number(i.total_price_zar), 0);
      const address = (order.shipping_address as any) || {};
      return { order, items, sellerTotal, address };
    });
  }, [orders, myOrderItems]);

  const filtered = useMemo(() => {
    return enrichedOrders.filter(({ order }) => {
      if (tab === 'awaiting') return AWAITING_STATUSES.includes(order.status);
      if (tab === 'completed') return COMPLETED_STATUSES.includes(order.status);
      return true;
    });
  }, [enrichedOrders, tab]);

  const totals = useMemo(() => {
    const revenue = enrichedOrders.reduce((sum, o) => sum + o.sellerTotal, 0);
    const awaiting = enrichedOrders.filter((o) => AWAITING_STATUSES.includes(o.order.status)).length;
    return { count: enrichedOrders.length, revenue, awaiting };
  }, [enrichedOrders]);

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card className="glass-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            We couldn't load your orders right now. Please try again shortly.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gradient-probiotic">My orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Order status is updated by the Living Culture team — this list is read-only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-2xl font-display">{totals.count}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-display">{formatZAR(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Awaiting fulfilment</p>
            <p className="text-2xl font-display">{totals.awaiting}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="awaiting">Awaiting fulfilment</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-10 text-center space-y-3">
            <Package className="h-10 w-10 mx-auto text-primary" />
            <h2 className="font-display text-xl">No orders yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once buyers start purchasing your products, orders will show up here.
            </p>
            <Button asChild>
              <Link to="/seller/products">Manage my products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ order, items, sellerTotal, address }) => {
            const isOpen = expanded === order.id;
            return (
              <Card key={order.id} className="glass-card">
                <CardHeader
                  className="cursor-pointer flex flex-row items-center justify-between gap-4"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div>
                    <CardTitle className="text-base font-display">#{order.order_number}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-ZA')} · {address.city || 'Unknown city'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatZAR(sellerTotal)}</span>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <p className="text-sm font-medium mb-1">Items to pack</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {items.map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span>{formatZAR(Number(item.total_price_zar))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Buyer</p>
                      <p className="text-sm text-muted-foreground">
                        {order.guest_email || address.full_name || 'Living Culture buyer'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Delivery address</p>
                      <p className="text-sm text-muted-foreground">
                        {[address.line1, address.line2, address.city, address.province, address.postal_code]
                          .filter(Boolean)
                          .join(', ') || 'No address provided'}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
