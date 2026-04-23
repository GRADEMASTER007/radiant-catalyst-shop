import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Loader2,
  UserX,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { motion } from 'motion/react';

type GuestOrder = {
  id: string;
  order_number: string;
  guest_email: string | null;
  status: string;
  payment_status: string;
  total_zar: number;
  created_at: string;
  shipping_address: any;
};

type GuestGroup = {
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  orders: GuestOrder[];
  totalSpent: number;
  paidSpent: number;
  firstOrder: string;
  lastOrder: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value || 0);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'paid' || status === 'delivered' || status === 'completed') return 'default';
  if (status === 'cancelled' || status === 'expired' || status === 'failed') return 'destructive';
  if (status === 'pending' || status === 'awaiting_payment') return 'secondary';
  return 'outline';
};

export default function GuestCheckouts() {
  const [search, setSearch] = useState('');

  const { data: guestOrders, isLoading } = useQuery({
    queryKey: ['admin-guest-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, order_number, guest_email, status, payment_status, total_zar, created_at, shipping_address',
        )
        .is('customer_id', null)
        .not('guest_email', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data ?? []) as GuestOrder[];
    },
  });

  const groups = useMemo<GuestGroup[]>(() => {
    if (!guestOrders) return [];

    const map = new Map<string, GuestGroup>();

    for (const order of guestOrders) {
      const rawEmail = (order.guest_email || '').toLowerCase().trim();
      if (!rawEmail) continue;

      const addr = order.shipping_address || {};
      const name =
        addr.name ||
        [addr.first_name, addr.last_name].filter(Boolean).join(' ').trim() ||
        null;

      const existing = map.get(rawEmail);
      if (existing) {
        existing.orders.push(order);
        existing.totalSpent += Number(order.total_zar || 0);
        if (order.payment_status === 'paid') {
          existing.paidSpent += Number(order.total_zar || 0);
        }
        if (order.created_at < existing.firstOrder) existing.firstOrder = order.created_at;
        if (order.created_at > existing.lastOrder) existing.lastOrder = order.created_at;
        if (!existing.name && name) existing.name = name;
        if (!existing.phone && addr.phone) existing.phone = addr.phone;
        if (!existing.city && addr.city) existing.city = addr.city;
        if (!existing.province && addr.province) existing.province = addr.province;
      } else {
        map.set(rawEmail, {
          email: rawEmail,
          name,
          phone: addr.phone || null,
          city: addr.city || null,
          province: addr.province || null,
          orders: [order],
          totalSpent: Number(order.total_zar || 0),
          paidSpent: order.payment_status === 'paid' ? Number(order.total_zar || 0) : 0,
          firstOrder: order.created_at,
          lastOrder: order.created_at,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime(),
    );
  }, [guestOrders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.email.includes(q) ||
        (g.name || '').toLowerCase().includes(q) ||
        (g.phone || '').toLowerCase().includes(q) ||
        g.orders.some((o) => o.order_number.toLowerCase().includes(q)),
    );
  }, [groups, search]);

  const totals = useMemo(
    () => ({
      guests: groups.length,
      orders: groups.reduce((s, g) => s + g.orders.length, 0),
      revenue: groups.reduce((s, g) => s + g.paidSpent, 0),
    }),
    [groups],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <UserX className="h-8 w-8" />
          Guest Checkouts
        </h1>
        <p className="text-muted-foreground">
          Customers who placed orders without creating an account, grouped by email.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Unique guests</p>
          <p className="text-2xl font-semibold">{totals.guests}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Guest orders</p>
          <p className="text-2xl font-semibold">{totals.orders}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Paid revenue</p>
          <p className="text-2xl font-semibold">{formatCurrency(totals.revenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, name, phone or order #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? 'No guests match your search.' : 'No guest checkouts found.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Guest</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Paid spend</TableHead>
                <TableHead>Last order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <GuestRow key={g.email} group={g} />
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}

function GuestRow({ group }: { group: GuestGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <TableCell>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
              {(group.name?.[0] || group.email[0]).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{group.name || 'Guest'}</p>
              <Badge variant="outline" className="text-xs">
                Guest checkout
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="text-foreground">{group.email}</span>
            </div>
            {group.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {group.phone}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {group.city || group.province ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[group.city, group.province].filter(Boolean).join(', ')}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-right font-medium">{group.orders.length}</TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(group.paidSpent)}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDate(group.lastOrder)}
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Order history ({group.orders.length})
              </div>
              <div className="rounded-lg border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(o.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(o.payment_status)}>
                            {o.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(o.total_zar || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link to={`/admin/orders?orderId=${o.id}`}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
