// Public, token-gated lookup of order + payment status.
// Returns a sanitized payload for guest order status pages.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    const orderNumber = url.searchParams.get("orderNumber");
    const token = url.searchParams.get("token");

    if ((!orderId && !orderNumber) || !token) {
      return new Response(JSON.stringify({ error: "Missing orderId/orderNumber or token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, payment_reference, total_zar, subtotal_zar, shipping_cost_zar, tax_zar, discount_zar, currency, shipping_method, shipping_address, guest_email, created_at, updated_at, access_token",
      );
    q = orderId ? q.eq("id", orderId) : q.eq("order_number", orderNumber!);

    const { data: order, error } = await q.maybeSingle();
    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.access_token !== token) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: items }, { data: payment }] = await Promise.all([
      supabase
        .from("order_items")
        .select("product_name, product_sku, quantity, unit_price_zar, total_price_zar")
        .eq("order_id", order.id),
      supabase
        .from("payments")
        .select("provider, status, amount_zar, transaction_id, error_message, updated_at")
        .eq("order_id", order.id)
        .maybeSingle(),
    ]);

    // Strip access_token from the response
    const { access_token: _omit, ...safeOrder } = order as Record<string, unknown>;

    return new Response(
      JSON.stringify({ order: safeOrder, items: items ?? [], payment: payment ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("order-status error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
