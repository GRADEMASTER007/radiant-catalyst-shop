import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) return { allowed: false, remaining: 0 };
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

async function generateMD5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPayFastSignature(itnData: Record<string, string>, passphrase?: string): Promise<boolean> {
  const receivedSignature = itnData.signature;
  if (!receivedSignature) return false;
  const sortedKeys = Object.keys(itnData).filter(key => key !== "signature" && itnData[key] !== "").sort();
  const signatureString = sortedKeys.map(key => `${key}=${encodeURIComponent(itnData[key].trim()).replace(/%20/g, "+")}`).join("&");
  const finalString = passphrase && passphrase.length > 0 ? `${signatureString}&passphrase=${encodeURIComponent(passphrase.trim())}` : signatureString;
  const calculatedSignature = await generateMD5Hash(finalString);
  return calculatedSignature.toLowerCase() === receivedSignature.toLowerCase();
}

async function validateAmount(supabase: any, orderId: string, itnAmount: string): Promise<boolean> {
  const { data: order, error } = await supabase.from("orders").select("total_zar").eq("id", orderId).single();
  if (error || !order) return false;
  return parseFloat(order.total_zar).toFixed(2) === parseFloat(itnAmount).toFixed(2);
}

async function isDuplicateITN(supabase: any, orderId: string, pfPaymentId: string): Promise<boolean> {
  const { data: existingPayment } = await supabase.from("payments").select("payment_id, status").eq("order_id", orderId).single();
  return existingPayment?.payment_id === pfPaymentId && existingPayment?.status === "completed";
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
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
    if (product) {
      const newQty = Math.max(0, product.stock_quantity - item.quantity);
      const { error: updateError } = await supabase.from("products").update({ stock_quantity: newQty, updated_at: new Date().toISOString() }).eq("id", item.product_id);
      if (updateError) console.error(`Stock deduction failed for product ${item.product_id}:`, updateError);
      else console.log(`Stock deducted: product ${item.product_id}, qty ${product.stock_quantity} -> ${newQty}`);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const supabase = createClient(supabaseUrl, supabaseKey);
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");

    const formData = await req.formData();
    const itnData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) itnData[key] = value.toString();

    console.log("Received PayFast ITN:", { m_payment_id: itnData.m_payment_id, pf_payment_id: itnData.pf_payment_id, payment_status: itnData.payment_status, amount_gross: itnData.amount_gross });

    const { m_payment_id, pf_payment_id, payment_status, amount_gross } = itnData;
    if (!m_payment_id || !pf_payment_id) return new Response("Invalid ITN data", { status: 400, headers: corsHeaders });

    if (merchantId && itnData.merchant_id !== merchantId) {
      console.error("SECURITY: Merchant ID mismatch!");
      return new Response("Invalid merchant", { status: 400, headers: corsHeaders });
    }

    const isValidSignature = await verifyPayFastSignature(itnData, passphrase);
    if (!isValidSignature) {
      console.error("SECURITY: PayFast signature verification failed");
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    if (await isDuplicateITN(supabase, m_payment_id, pf_payment_id)) {
      return new Response("OK - Already processed", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    if (payment_status === "COMPLETE" && amount_gross) {
      const amountOk = await validateAmount(supabase, m_payment_id, amount_gross);
      if (!amountOk) {
        console.error(`SECURITY: PayFast amount mismatch for order ${m_payment_id} — received ${amount_gross}`);
        return new Response("Amount mismatch", { status: 400, headers: corsHeaders });
      }
    }

    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;

    switch (payment_status) {
      case "COMPLETE":
        paymentStatus = "completed";
        orderPaymentStatus = "paid";
        orderStatus = "paid";
        break;
      case "FAILED":
        paymentStatus = "failed";
        orderPaymentStatus = "failed";
        orderStatus = "pending";
        break;
      case "PENDING":
        paymentStatus = "pending";
        orderPaymentStatus = "pending";
        orderStatus = "pending";
        break;
      case "CANCELLED":
        paymentStatus = "cancelled";
        orderPaymentStatus = "failed";
        orderStatus = "cancelled";
        break;
      default:
        paymentStatus = "unknown";
        orderPaymentStatus = "pending";
        orderStatus = "pending";
    }

    await supabase.from("payments").update({
      status: paymentStatus,
      payment_id: pf_payment_id,
      transaction_id: pf_payment_id,
      payment_data: itnData,
      updated_at: new Date().toISOString(),
    }).eq("order_id", m_payment_id);

    const orderUpdate: Record<string, unknown> = {
      payment_status: orderPaymentStatus,
      payment_reference: pf_payment_id,
      payment_method: "payfast",
      status: orderStatus,
      updated_at: new Date().toISOString(),
    };
    if (payment_status === "COMPLETE") {
      orderUpdate.paid_at = new Date().toISOString();
    }
    await supabase.from("orders").update(orderUpdate).eq("id", m_payment_id);

    // STOCK DEDUCTION on successful payment
    if (payment_status === "COMPLETE") {
      await deductStock(supabase, m_payment_id);

      try {
        const { data: order } = await supabase.from("orders").select("*").eq("id", m_payment_id).single();
        if (order) {
          const customerEmail = order.guest_email || order.customer_email;
          if (customerEmail) {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
              body: JSON.stringify({ type: "order_confirmation", orderId: m_payment_id, email: customerEmail }),
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    console.log("PayFast ITN processed:", { orderId: m_payment_id, paymentId: pf_payment_id, status: payment_status });
    return new Response("OK", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  } catch (error: any) {
    console.error("PayFast ITN error:", error);
    return new Response("Error processed", { status: 200, headers: corsHeaders });
  }
};

serve(handler);
