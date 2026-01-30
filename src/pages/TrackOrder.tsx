import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Sprout,
  Loader2,
  Search,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
  Home,
  ArrowRight,
  ExternalLink,
  Leaf,
  PackageCheck,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price_zar: number;
  total_price_zar: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal_zar: number;
  shipping_cost_zar: number;
  total_zar: number;
  created_at: string;
  shipped_at: string | null;
  delivered_at?: string | null;
  tracking_number: string | null;
  shipping_method: string | null;
  rooting_status?: string | null;
  notes?: string | null;
  shipping_address?: Record<string, any>;
  order_items: OrderItem[];
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', icon: CreditCard },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStatusIndex = (status: string): number => {
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const rootingStatusConfig: Record<string, { label: string; color: string; progress: number }> = {
  pending: { label: 'Awaiting Start', color: 'bg-primary/60', progress: 10 },
  in_progress: { label: 'Rooting in Progress', color: 'bg-primary', progress: 50 },
  ready: { label: 'Ready for Pickup/Shipping', color: 'bg-green-500', progress: 100 },
  shipped: { label: 'Shipped', color: 'bg-green-600', progress: 100 },
};

export default function TrackOrder() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  
  // Track with access token from URL (from confirmation emails)
  const accessToken = searchParams.get('token');

  // Guest order lookup via edge function
  const { data: guestResult, isLoading: guestLoading, error: guestError, refetch } = useQuery({
    queryKey: ['track-order', email, orderNumber, accessToken],
    enabled: searchSubmitted && !user && (!!email && (!!orderNumber || !!accessToken)),
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/guest-order-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          orderNumber: orderNumber.trim() || undefined,
          accessToken: accessToken || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to lookup order');
      }
      
      return response.json();
    },
  });

  // Authenticated user order lookup
  const { data: userOrders, isLoading: userLoading } = useQuery({
    queryKey: ['user-orders-track', user?.id, orderNumber],
    enabled: !!user && searchSubmitted && !!orderNumber,
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('customer_id', user!.id);
      
      if (orderNumber) {
        query = query.eq('order_number', orderNumber.trim());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSubmitted(true);
  };

  const orders: Order[] = user ? (userOrders || []) : (guestResult?.orders || []);
  const isLoading = guestLoading || userLoading;
  const hasSearched = searchSubmitted && (user ? !!orderNumber : (!!email && (!!orderNumber || !!accessToken)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasRootingService = (order: Order) => {
    return order.notes && order.notes.includes('Rooting Service:');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Enter your order details to see real-time status and tracking information
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Order Lookup
              </CardTitle>
              <CardDescription>
                {user 
                  ? 'Enter your order number to track your shipment'
                  : 'Enter the email and order number from your confirmation email'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="ORD-20240130-ABC123"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required={!accessToken}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in your order confirmation email
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>

              {!user && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  for faster access to all your orders, or view your{' '}
                  <Link to="/my-orders" className="text-primary hover:underline">
                    order history
                  </Link>.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <AnimatePresence mode="wait">
            {/* Loading */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            )}

            {/* No Results */}
            {!isLoading && hasSearched && orders.length === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      We couldn't find an order matching those details. Please check your email and order number and try again.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={() => setSearchSubmitted(false)}>
                        Try Again
                      </Button>
                      <Button asChild>
                        <Link to="/contact">Contact Support</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Order Found */}
            {!isLoading && orders.length > 0 && orders.map((order, idx) => {
              const currentStatusIndex = getStatusIndex(order.status);
              const hasRooting = hasRootingService(order);
              const rootingStatus = order.rooting_status 
                ? rootingStatusConfig[order.rooting_status] 
                : rootingStatusConfig.pending;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-6"
                >
                  {/* Order Header */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">Order {order.order_number}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                          className="w-fit"
                        >
                          {order.payment_status === 'paid' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Payment Confirmed</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> {order.payment_status}</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Status Timeline */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-4">Order Progress</h4>
                        <div className="relative">
                          {/* Progress Line */}
                          <div className="absolute left-0 top-4 w-full h-0.5 bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className="h-full bg-primary"
                            />
                          </div>
                          
                          {/* Status Steps */}
                          <div className="relative flex justify-between">
                            {statusSteps.map((step, index) => {
                              const isComplete = index <= currentStatusIndex;
                              const isCurrent = index === currentStatusIndex;
                              const Icon = step.icon;
                              
                              return (
                                <div key={step.key} className="flex flex-col items-center">
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`
                                      w-8 h-8 rounded-full flex items-center justify-center z-10
                                      ${isComplete 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-muted text-muted-foreground'}
                                      ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                                    `}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </motion.div>
                                  <span className={`
                                    text-xs mt-2 text-center max-w-[70px]
                                    ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}
                                  `}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Tracking Number */}
                      {order.tracking_number && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <Truck className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">Tracking Number</p>
                                <p className="font-mono text-lg">{order.tracking_number}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={`https://www.google.com/search?q=track+${order.tracking_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Track Shipment
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          </div>
                          {order.shipped_at && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Shipped on {formatDate(order.shipped_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Rooting Service Status */}
                      {hasRooting && (
                        <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Leaf className="h-5 w-5 text-secondary" />
                            <h4 className="font-semibold text-secondary">Rooting Service</h4>
                          </div>
                          
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rootingStatus.progress}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className={`h-full ${rootingStatus.color} rounded-full`}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-muted-foreground mb-3">
                            <span>Started</span>
                            <span>In Progress</span>
                            <span>Ready</span>
                          </div>
                          
                          <p className="text-sm font-medium">
                            Status: <span className="text-secondary">{rootingStatus.label}</span>
                          </p>
                          
                          {rootingStatus.progress < 100 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimated completion: 3-6 weeks from order date
                            </p>
                          )}
                        </div>
                      )}

                      <Separator className="my-4" />

                      {/* Order Items */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Items Ordered</h4>
                        {order.order_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <PackageCheck className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × {formatCurrency(item.unit_price_zar)}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium text-sm">{formatCurrency(item.total_price_zar)}</p>
                          </div>
                        ))}
                        
                        <div className="pt-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(order.subtotal_zar)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{formatCurrency(order.shipping_cost_zar || 0)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(order.total_zar)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex items-start gap-3">
                            <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium mb-1">Shipping Address</p>
                              <p className="text-sm text-muted-foreground">
                                {order.shipping_address.name}<br />
                                {order.shipping_address.address}<br />
                                {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postalCode}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild>
                      <Link to="/my-orders">
                        View All Orders
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/contact">
                        Need Help?
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
