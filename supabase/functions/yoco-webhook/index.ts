import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (in-memory, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

async function verifyYocoSignature(payload: string, signature: string | null, secretKey: string): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const calculatedSignature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    return calculatedSignature.toLowerCase() === signature.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

async function validateAmount(supabase: any, orderId: string, webhookAmountCents: number): Promise<boolean> {
  const { data: order, error } = await supabase.from("orders").select("total_zar").eq("id", orderId).single();
  if (error || !order) return false;
  const expectedAmountCents = Math.round(order.total_zar * 100);
  const amountMatch = expectedAmountCents === webhookAmountCents;
  if (!amountMatch) console.error("Amount mismatch!", { orderId, expected: expectedAmountCents, received: webhookAmountCents });
  return amountMatch;
}

async function isDuplicateWebhook(supabase: any, orderId: string, transactionId: string): Promise<boolean> {
  const { data: existingPayment } = await supabase.from("payments").select("transaction_id, status").eq("order_id", orderId).single();
  if (existingPayment?.transaction_id === transactionId && existingPayment?.status === "completed") return true;
  return false;
}

// Deduct stock after successful payment
async function deductStock(supabase: any, orderId: string): Promise<void> {
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (error || !orderItems?.length) {
    console.error("Failed to fetch order items for stock deduction:", error);
    return;
  }

  for (const item of orderItems) {
    if (!item.product_id) continue;
    
    // Use RPC-style atomic decrement via raw update
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (product) {
      const newQty = Math.max(0, product.stock_quantity - item.quantity);
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
        .eq("id", item.product_id);

      if (updateError) {
        console.error(`Stock deduction failed for product ${item.product_id}:`, updateError);
      } else {
        console.log(`Stock deducted: product ${item.product_id}, qty ${product.stock_quantity} -> ${newQty}`);
      }
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response("Rate limit exceeded", { status: 429, headers: { ...corsHeaders, "Retry-After": "60" } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    const webhookSignature = req.headers.get("x-yoco-signature") || req.headers.get("yoco-signature");

    if (yocoSecretKey && yocoSecretKey.length > 0) {
      const isValidSignature = await verifyYocoSignature(rawBody, webhookSignature, yocoSecretKey);
      if (!isValidSignature) {
        console.error("SECURITY: Invalid Yoco webhook signature - REJECTING");
        return new Response("Invalid signature", { status: 400, headers: corsHeaders });
      }
    }

    const webhookData = JSON.parse(rawBody);
    console.log("Received Yoco webhook:", { type: webhookData.type, payloadId: webhookData.payload?.id, orderId: webhookData.payload?.metadata?.orderId });

    const { type, payload } = webhookData;
    if (!payload?.metadata?.orderId) {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const orderId = payload.metadata.orderId;
    const paymentId = payload.id;
    const amountCents = payload.amount;

    if (await isDuplicateWebhook(supabase, orderId, paymentId)) {
      return new Response("OK - Already processed", { status: 200, headers: corsHeaders });
    }

    if (type === "payment.succeeded" && amountCents) {
      await validateAmount(supabase, orderId, amountCents);
    }

    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;

    switch (type) {
      case "payment.succeeded":
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
        return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Update payment record
    await supabase.from("payments").update({
      status: paymentStatus,
      transaction_id: paymentId,
      payment_data: payload,
      updated_at: new Date().toISOString(),
    }).eq("order_id", orderId);

    // Update order
    const orderUpdate: Record<string, unknown> = {
      payment_status: orderPaymentStatus,
      payment_reference: paymentId,
      payment_method: "yoco",
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };
    if (type === "payment.succeeded") {
      orderUpdate.paid_at = new Date().toISOString();
    }
    await supabase.from("orders").update(orderUpdate).eq("id", orderId);

    // STOCK DEDUCTION on successful payment
    if (type === "payment.succeeded") {
      await deductStock(supabase, orderId);

      // Send confirmation email
      try {
        const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
        if (order) {
          const customerEmail = order.guest_email || order.customer_email;
          if (customerEmail) {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
              body: JSON.stringify({ type: "order_confirmation", orderId, email: customerEmail }),
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    console.log("Yoco webhook processed:", { orderId, paymentId, type, status: paymentStatus });
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Yoco webhook error:", error);
    return new Response("Error processed", { status: 200, headers: corsHeaders });
  }
};

serve(handler);
