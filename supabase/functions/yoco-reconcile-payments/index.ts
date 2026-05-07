// Periodic reconciliation: ask Yoco for the truth on every pending Yoco
// checkout we know about, then correct order/payment/stock state if we
// missed (or mis-handled) the webhook.
//
// Triggered by pg_cron every 15 minutes. Also callable manually by an admin
// via supabase.functions.invoke('yoco-reconcile-payments').

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// How far back to look for pending payments (avoid scanning the whole table).
const LOOKBACK_DAYS = 14;
// Pending checkouts older than this with no completion are marked failed.
const ABANDON_AFTER_HOURS = 48;

type SupabaseClient = ReturnType<typeof createClient>;

interface YocoCheckout {
  id: string;
  status: "created" | "started" | "processing" | "completed";
  amount: number;
  currency: string;
  paymentId: string | null;
  metadata?: Record<string, unknown> | null;
}

async function fetchYocoCheckout(checkoutId: string, secretKey: string): Promise<YocoCheckout | null> {
  const res = await fetch(`https://payments.yoco.com/api/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Yoco GET checkout ${checkoutId} failed [${res.status}]: ${body}`);
  }
  return await res.json() as YocoCheckout;
}

async function deductStock(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);
  if (!items?.length) return;
  for (const it of items as Array<{ product_id: string | null; quantity: number }>) {
    if (!it.product_id) continue;
    const { data: p } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", it.product_id)
      .single();
    if (!p) continue;
    const newQty = Math.max(0, ((p as any).stock_quantity ?? 0) - (it.quantity ?? 0));
    await supabase
      .from("products")
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", it.product_id);
  }
}

async function markPaid(
  supabase: SupabaseClient,
  orderId: string,
  checkout: YocoCheckout,
): Promise<{ stockDeducted: boolean }> {
  const txId = checkout.paymentId ?? checkout.id;

  // Idempotency guard — if payment row is already completed with this tx, do nothing.
  const { data: existing } = await supabase
    .from("payments")
    .select("status, transaction_id")
    .eq("order_id", orderId)
    .maybeSingle();
  const alreadyCompleted =
    (existing as any)?.status === "completed" && (existing as any)?.transaction_id === txId;

  await supabase.from("payments").upsert(
    {
      order_id: orderId,
      provider: "yoco",
      amount_zar: checkout.amount / 100,
      status: "completed",
      transaction_id: txId,
      payment_id: checkout.id,
      payment_data: checkout as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" },
  );

  await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      payment_method: "yoco",
      payment_reference: txId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (!alreadyCompleted) {
    await deductStock(supabase, orderId);
    return { stockDeducted: true };
  }
  return { stockDeducted: false };
}

async function markFailed(
  supabase: SupabaseClient,
  orderId: string,
  checkoutId: string,
  reason: string,
): Promise<void> {
  await supabase.from("payments").upsert(
    {
      order_id: orderId,
      provider: "yoco",
      amount_zar: 0,
      status: "failed",
      payment_id: checkoutId,
      transaction_id: checkoutId,
      error_message: reason,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" },
  );
  await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

interface ReconcileSummary {
  scanned: number;
  fixed_paid: number;
  marked_failed: number;
  still_pending: number;
  not_found_at_yoco: number;
  errors: Array<{ orderId: string; error: string }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const summary: ReconcileSummary = {
    scanned: 0,
    fixed_paid: 0,
    marked_failed: 0,
    still_pending: 0,
    not_found_at_yoco: 0,
    errors: [],
  };

  try {
    const secretKey = Deno.env.get("YOCO_SECRET_KEY");
    if (!secretKey) throw new Error("YOCO_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Pending Yoco payments (each is one order).
    const { data: pending, error } = await supabase
      .from("payments")
      .select("order_id, payment_id, status, created_at")
      .eq("provider", "yoco")
      .eq("status", "pending")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    summary.scanned = pending?.length ?? 0;

    for (const row of (pending ?? []) as Array<{
      order_id: string;
      payment_id: string | null;
      created_at: string;
    }>) {
      const { order_id, payment_id, created_at } = row;
      if (!payment_id) {
        summary.errors.push({ orderId: order_id, error: "Missing checkoutId on payment row" });
        continue;
      }
      try {
        const checkout = await fetchYocoCheckout(payment_id, secretKey);
        if (!checkout) {
          summary.not_found_at_yoco++;
          continue;
        }

        if (checkout.status === "completed") {
          const { stockDeducted } = await markPaid(supabase, order_id, checkout);
          summary.fixed_paid++;
          console.log(
            `Reconciled paid: order=${order_id} checkout=${checkout.id} payment=${checkout.paymentId} stockDeducted=${stockDeducted}`,
          );
        } else {
          // Not completed yet. Abandon if pending too long.
          const ageHours = (Date.now() - new Date(created_at).getTime()) / 3_600_000;
          if (ageHours >= ABANDON_AFTER_HOURS) {
            await markFailed(supabase, order_id, payment_id, `Abandoned after ${Math.round(ageHours)}h (status=${checkout.status})`);
            summary.marked_failed++;
            console.log(`Reconciled abandoned: order=${order_id} ageHours=${ageHours.toFixed(1)}`);
          } else {
            summary.still_pending++;
          }
        }
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        summary.errors.push({ orderId: order_id, error: msg });
        console.error(`Reconcile error order=${order_id}:`, msg);
      }
    }

    return new Response(JSON.stringify({ success: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Reconcile fatal error:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message ?? String(err), summary }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
