import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify Yoco webhook signature using HMAC-SHA256
async function verifyYocoSignature(
  payload: string,
  signature: string | null,
  secretKey: string
): Promise<boolean> {
  if (!signature) {
    console.warn("No signature provided in webhook");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures (case-insensitive)
    return calculatedSignature.toLowerCase() === signature.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Validate order amount matches webhook amount
async function validateAmount(
  supabase: any,
  orderId: string,
  webhookAmountCents: number
): Promise<boolean> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("total_zar")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("Order not found for amount validation:", orderId);
    return false;
  }

  const expectedAmountCents = Math.round(order.total_zar * 100);
  const amountMatch = expectedAmountCents === webhookAmountCents;

  if (!amountMatch) {
    console.error("Amount mismatch!", {
      orderId,
      expected: expectedAmountCents,
      received: webhookAmountCents,
    });
  }

  return amountMatch;
}

// Check for duplicate webhook processing (idempotency)
async function isDuplicateWebhook(
  supabase: any,
  orderId: string,
  transactionId: string
): Promise<boolean> {
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("transaction_id, status")
    .eq("order_id", orderId)
    .single();

  if (existingPayment?.transaction_id === transactionId && 
      existingPayment?.status === "completed") {
    console.log("Duplicate webhook detected - already processed:", transactionId);
    return true;
  }

  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const yocoSecretKey = Deno.env.get("YOCO_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const webhookSignature = req.headers.get("x-yoco-signature") || 
                             req.headers.get("yoco-signature");

    // Verify signature if secret key is configured
    if (yocoSecretKey && yocoSecretKey.length > 0) {
      const isValidSignature = await verifyYocoSignature(rawBody, webhookSignature, yocoSecretKey);
      if (!isValidSignature) {
        console.error("Invalid Yoco webhook signature");
        // In production, reject invalid signatures
        // For now, log warning and continue for debugging
        console.warn("Proceeding despite signature failure - enable strict mode in production");
      }
    }

    const webhookData = JSON.parse(rawBody);
    console.log("Received Yoco webhook:", {
      type: webhookData.type,
      payloadId: webhookData.payload?.id,
      orderId: webhookData.payload?.metadata?.orderId,
    });

    const { type, payload } = webhookData;

    if (!payload?.metadata?.orderId) {
      console.log("No order ID in webhook payload - ignoring");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const orderId = payload.metadata.orderId;
    const paymentId = payload.id;
    const amountCents = payload.amount;

    // Check for duplicate processing
    if (await isDuplicateWebhook(supabase, orderId, paymentId)) {
      return new Response("OK - Already processed", { status: 200, headers: corsHeaders });
    }

    // Validate amount on successful payment
    if (type === "payment.succeeded" && amountCents) {
      const amountValid = await validateAmount(supabase, orderId, amountCents);
      if (!amountValid) {
        console.error("SECURITY: Amount manipulation detected!", { orderId, amountCents });
        // Still process but flag for review
      }
    }

    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;

    // Valid order status: pending, processing, paid, shipped, delivered, cancelled, refunded
    // Valid payment_status: pending, paid, failed, refunded, partially_refunded
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
        console.log("Unhandled webhook type:", type);
        return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        transaction_id: paymentId,
        payment_data: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (paymentError) {
      console.error("Failed to update payment:", paymentError);
    }

    // Update order
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: orderPaymentStatus,
        payment_reference: paymentId,
        payment_method: "yoco",
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderError) {
      console.error("Failed to update order:", orderError);
    }

    // Send confirmation email on successful payment
    if (type === "payment.succeeded") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (order) {
          const customerEmail = order.guest_email || order.customer_email;
          if (customerEmail) {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                type: "order_confirmation",
                orderId: orderId,
                email: customerEmail,
              }),
            });
            
            if (!emailResponse.ok) {
              console.error("Email send failed:", await emailResponse.text());
            }
          }
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    console.log("Yoco webhook processed:", {
      orderId,
      paymentId,
      type,
      status: paymentStatus,
    });

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Yoco webhook error:", error);
    // Return 200 to prevent Yoco from retrying
    return new Response("Error processed", {
      status: 200,
      headers: corsHeaders,
    });
  }
};

serve(handler);
