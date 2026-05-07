import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


interface OrderItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price_zar: number;
  total_price_zar: number;
}

interface PaymentInfo {
  provider: string;
  status: string;
  amount_zar: number;
  transaction_id: string | null;
  error_message: string | null;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_reference: string | null;
  total_zar: number;
  subtotal_zar: number;
  shipping_cost_zar: number;
  tax_zar: number;
  discount_zar: number;
  currency: string;
  shipping_method: string | null;
  shipping_address: any;
  guest_email: string | null;
  created_at: string;
  updated_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(n) || 0);

type View = "paid" | "failed" | "cancelled" | "pending";

const STATUS_MAP: Record<View, { label: string; tone: string; Icon: typeof CheckCircle2; blurb: string }> = {
  paid: {
    label: "Payment received",
    tone: "from-emerald-500 to-emerald-700",
    Icon: CheckCircle2,
    blurb: "Your order has been paid and is being prepared.",
  },
  failed: {
    label: "Payment failed",
    tone: "from-red-500 to-red-700",
    Icon: XCircle,
    blurb: "We couldn't process the payment for this order. You can retry below.",
  },
  cancelled: {
    label: "Payment cancelled",
    tone: "from-amber-500 to-amber-700",
    Icon: AlertTriangle,
    blurb: "The payment was cancelled. Your order has not been charged.",
  },
  pending: {
    label: "Awaiting payment",
    tone: "from-slate-400 to-slate-600",
    Icon: Clock,
    blurb: "We're waiting for the payment provider to confirm. This usually takes seconds.",
  },
};

function deriveView(o: Order): View {
  const ps = (o.payment_status || "").toLowerCase();
  const s = (o.status || "").toLowerCase();
  if (s === "cancelled" || ps === "cancelled") return "cancelled";
  if (ps === "paid" || s === "paid") return "paid";
  if (ps === "failed") return "failed";
  return "pending";
}

const OrderStatus = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);

  const load = async (silent = false) => {
    if (!orderId || !token) {
      setError("Missing order id or access token in the URL.");
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("order-status", {
        body: null,
        method: "GET",
        // supabase-js doesn't natively pass query params on invoke; use fetch fallback
      } as any);
      // Fallback to direct fetch since invoke doesn't support query params
      let payload: any = data;
      if (!payload || fnErr) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-status?orderId=${encodeURIComponent(
          orderId,
        )}&token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
      }
      setOrder(payload.order);
      setItems(payload.items || []);
      setPayment(payload.payment || null);
    } catch (e: any) {
      setError(e?.message || "Could not load order");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 5s while pending so users see paid/failed updates without reloading
    const id = setInterval(() => {
      setOrder((o) => {
        if (o && deriveView(o) === "pending") load(true);
        return o;
      });
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token]);

  const view: View | null = order ? deriveView(order) : null;
  const meta = view ? STATUS_MAP[view] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Helmet>
        <title>{order ? `Order ${order.order_number}` : "Order status"} | Healthy Fields</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <CartSidebar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="glass-card p-8 rounded-xl text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Could not load order</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          ) : order && meta && view ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Status banner */}
              <div className="glass-card rounded-xl p-6 mb-6 flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${meta.tone} flex items-center justify-center shadow-md shrink-0`}
                >
                  <meta.Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-display font-semibold">{meta.label}</h1>
                    <Badge variant="outline" className="uppercase text-xs">
                      {order.payment_status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{meta.blurb}</p>
                </div>
                {view === "pending" && (
                  <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                )}
              </div>

              {/* Order summary */}
              <div className="glass-card rounded-xl p-6 mb-6">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
                    <p className="font-mono text-lg">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Placed</p>
                    <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="divide-y">
                  {items.map((it, i) => (
                    <div key={i} className="py-3 flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{it.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.product_sku && <span>SKU {it.product_sku} · </span>}
                          Qty {it.quantity} × {fmt(it.unit_price_zar)}
                        </p>
                      </div>
                      <div className="text-right font-medium">{fmt(it.total_price_zar)}</div>
                    </div>
                  ))}
                </div>

                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>{fmt(order.subtotal_zar)}</dd>
                  </div>
                  {order.discount_zar > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>Discount</dt>
                      <dd>-{fmt(order.discount_zar)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Shipping{order.shipping_method ? ` (${order.shipping_method})` : ""}</dt>
                    <dd>{fmt(order.shipping_cost_zar)}</dd>
                  </div>
                  {order.tax_zar > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tax</dt>
                      <dd>{fmt(order.tax_zar)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2">
                    <dt>Total</dt>
                    <dd>{fmt(order.total_zar)}</dd>
                  </div>
                </dl>
              </div>

              {/* Payment details */}
              <div className="glass-card rounded-xl p-6 mb-6">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Payment details
                </h2>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="capitalize">{order.payment_method || payment?.provider || "—"}</dd>

                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="capitalize">{payment?.status || order.payment_status}</dd>

                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono text-xs break-all">
                    {payment?.transaction_id || order.payment_reference || "—"}
                  </dd>

                  <dt className="text-muted-foreground">Amount</dt>
                  <dd>{fmt(payment?.amount_zar ?? order.total_zar)}</dd>

                  {payment?.updated_at && (
                    <>
                      <dt className="text-muted-foreground">Updated</dt>
                      <dd>{new Date(payment.updated_at).toLocaleString()}</dd>
                    </>
                  )}

                  {payment?.error_message && (
                    <>
                      <dt className="text-muted-foreground">Error</dt>
                      <dd className="text-destructive">{payment.error_message}</dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {view === "paid" && (
                  <Link to="/track-order">
                    <Button className="btn-sunset">
                      Track shipment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {(view === "failed" || view === "cancelled") && (
                  <Link to="/checkout">
                    <Button className="btn-sunset">Retry payment</Button>
                  </Link>
                )}
                <Link to="/products">
                  <Button variant="outline">Continue shopping</Button>
                </Link>
              </div>

              <p className="mt-8 text-center text-xs text-muted-foreground">
                Need help? Email{" "}
                <a href="mailto:orders@proagrisa.co.za" className="underline">
                  orders@proagrisa.co.za
                </a>
              </p>
            </motion.div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default OrderStatus;
