import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

// Rate limiting (in-memory, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) return { allowed: false };
  record.count++;
  return { allowed: true };
}

// Constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/**
 * Verify Yoco webhook per official spec:
 *  - signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 *  - secret: strip `whsec_` prefix, base64-decode the rest
 *  - HMAC-SHA256, base64 output
 *  - signature header: space-separated list of `v1,<base64sig>` entries
 *  - reject if timestamp drift > 3 minutes (replay protection)
 */
async function verifyYocoSignature(
  rawBody: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null,
  secret: string,
): Promise<{ valid: boolean; reason?: string }> {
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { valid: false, reason: "Missing webhook headers" };
  }

  // Replay protection — 3 minute window
  const tsSec = parseInt(webhookTimestamp, 10);
  if (!Number.isFinite(tsSec)) return { valid: false, reason: "Invalid timestamp" };
  const driftSec = Math.abs(Math.floor(Date.now() / 1000) - tsSec);
  if (driftSec > 180) return { valid: false, reason: `Timestamp drift ${driftSec}s exceeds 180s` };

  // Decode secret (strip whsec_ prefix, base64-decode)
  let secretBytes: Uint8Array;
  try {
    const b64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
    const bin = atob(b64);
    secretBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) secretBytes[i] = bin.charCodeAt(i);
  } catch {
    return { valid: false, reason: "Could not decode webhook secret" };
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const sigBytes = new Uint8Array(sigBuf);
  let bin = "";
  for (let i = 0; i < sigBytes.length; i++) bin += String.fromCharCode(sigBytes[i]);
  const expected = btoa(bin);

  // Header: "v1,sig1 v1,sig2 ..." — accept if any version-1 entry matches
  const provided = webhookSignature.split(" ").map((s) => s.trim()).filter(Boolean);
  for (const entry of provided) {
    const [version, sig] = entry.split(",");
    if (version === "v1" && sig && timingSafeEqual(sig, expected)) {
      return { valid: true };
    }
  }
  return { valid: false, reason: "Signature mismatch" };
}

async function validateAmount(supabase: any, orderId: string, webhookAmountCents: number): Promise<boolean> {
  const { data: order, error } = await supabase.from("orders").select("total_zar").eq("id", orderId).single();
  if (error || !order) return false;
  const expectedCents = Math.round(Number(order.total_zar) * 100);
  if (expectedCents !== webhookAmountCents) {
    console.error("Amount mismatch", { orderId, expected: expectedCents, received: webhookAmountCents });
    return false;
  }
  return true;
}

async function isDuplicateWebhook(supabase: any, orderId: string, transactionId: string): Promise<boolean> {
  const { data } = await supabase.from("payments").select("transaction_id, status").eq("order_id", orderId).maybeSingle();
  return data?.transaction_id === transactionId && data?.status === "completed";
}

async function deductStock(supabase: any, orderId: string): Promise<void> {
  const { data: items, error } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  if (error || !items?.length) {
    console.error("Stock deduction: no items / fetch error", error);
    return;
  }
  for (const it of items) {
    if (!it.product_id) continue;
    const { data: p } = await supabase.from("products").select("stock_quantity").eq("id", it.product_id).single();
    if (!p) continue;
    const newQty = Math.max(0, (p.stock_quantity ?? 0) - (it.quantity ?? 0));
    const { error: upErr } = await supabase
      .from("products")
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", it.product_id);
    if (upErr) console.error(`Stock decrement failed for ${it.product_id}:`, upErr);
    else console.log(`Stock: ${it.product_id} ${p.stock_quantity} -> ${newQty}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip).allowed) {
    return new Response("Rate limit exceeded", { status: 429, headers: { ...corsHeaders, "Retry-After": "60" } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("YOCO_WEBHOOK_SECRET");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");

    // SIGNATURE VERIFICATION (mandatory in production)
    if (webhookSecret && webhookSecret.length > 0) {
      const result = await verifyYocoSignature(rawBody, webhookId, webhookTimestamp, webhookSignature, webhookSecret);
      if (!result.valid) {
        console.error("SECURITY: Yoco webhook rejected -", result.reason);
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    } else {
      console.warn("YOCO_WEBHOOK_SECRET not configured — accepting webhook unverified (NOT SAFE FOR PROD)");
    }

    let webhookData: any;
    try {
      webhookData = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    console.log("Yoco webhook received:", {
      type: webhookData.type,
      payloadId: webhookData.payload?.id,
      orderId: webhookData.payload?.metadata?.orderId,
    });

    const { type, payload } = webhookData;
    if (!payload?.metadata?.orderId) {
      console.warn("No orderId in metadata — ignoring");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const orderId = payload.metadata.orderId as string;
    const paymentId = payload.id as string;
    const amountCents = payload.amount as number | undefined;

    if (await isDuplicateWebhook(supabase, orderId, paymentId)) {
      console.log("Duplicate webhook — already processed");
      return new Response("OK - Already processed", { status: 200, headers: corsHeaders });
    }

    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;

    switch (type) {
      case "payment.succeeded":
        if (amountCents != null && !(await validateAmount(supabase, orderId, amountCents))) {
          console.error("Amount mismatch — refusing to mark paid");
          return new Response("Amount mismatch", { status: 400, headers: corsHeaders });
        }
        paymentStatus = "completed";
        orderPaymentStatus = "paid";
        orderStatus = "paid";
        break;
      case "payment.failed":
        paymentStatus = "failed";
        orderPaymentStatus = "failed";
        orderStatus = "pending";
        break;
      case "payment.cancelled":
        paymentStatus = "cancelled";
        orderPaymentStatus = "failed";
        orderStatus = "cancelled";
        break;
      default:
        console.log("Ignoring event type:", type);
        return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Upsert payment row (handles webhooks arriving before the create-checkout payment row exists)
    const { error: payErr } = await supabase
      .from("payments")
      .upsert(
        {
          order_id: orderId,
          provider: "yoco",
          amount_zar: amountCents != null ? amountCents / 100 : 0,
          status: paymentStatus,
          transaction_id: paymentId,
          payment_id: paymentId,
          payment_data: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" },
      );
    if (payErr) console.error("Payment upsert error:", payErr);

    // Update order
    const orderUpdate: Record<string, unknown> = {
      payment_status: orderPaymentStatus,
      payment_reference: paymentId,
      payment_method: "yoco",
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };
    if (type === "payment.succeeded") orderUpdate.paid_at = new Date().toISOString();

    const { error: ordErr } = await supabase.from("orders").update(orderUpdate).eq("id", orderId);
    if (ordErr) console.error("Order update error:", ordErr);

    if (type === "payment.succeeded") {
      await deductStock(supabase, orderId);

      // Send confirmation email (best-effort)
      try {
        const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
        const customerEmail = order?.guest_email;
        if (customerEmail) {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
            body: JSON.stringify({ type: "order_confirmation", orderId, email: customerEmail }),
          });
        }
      } catch (e) {
        console.error("Confirmation email failed:", e);
      }
    }

    console.log("Yoco webhook processed", { orderId, paymentId, type, paymentStatus });
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Yoco webhook error:", err);
    // Return 200 so Yoco doesn't retry forever on our internal errors; we log for triage.
    return new Response("Error logged", { status: 200, headers: corsHeaders });
  }
};

serve(handler);
