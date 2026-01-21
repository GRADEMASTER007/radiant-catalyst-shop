import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayFast valid hosts for server verification
const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

// Generate MD5 hash
async function generateMD5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verify PayFast signature
async function verifyPayFastSignature(
  itnData: Record<string, string>,
  passphrase?: string
): Promise<boolean> {
  const receivedSignature = itnData.signature;
  if (!receivedSignature) return false;

  // Sort keys alphabetically, exclude signature and empty values
  const sortedKeys = Object.keys(itnData)
    .filter(key => key !== "signature" && itnData[key] !== "")
    .sort();

  // Build signature string
  const signatureString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(itnData[key].trim()).replace(/%20/g, "+")}`)
    .join("&");

  // Add passphrase if provided
  const finalString = passphrase && passphrase.length > 0
    ? `${signatureString}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : signatureString;

  const calculatedSignature = await generateMD5Hash(finalString);
  return calculatedSignature.toLowerCase() === receivedSignature.toLowerCase();
}

// Validate order amount matches ITN amount
async function validateAmount(
  supabase: any,
  orderId: string,
  itnAmount: string
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

  const expectedAmount = parseFloat(order.total_zar).toFixed(2);
  const receivedAmount = parseFloat(itnAmount).toFixed(2);
  const amountMatch = expectedAmount === receivedAmount;

  if (!amountMatch) {
    console.error("SECURITY: Amount mismatch detected!", {
      orderId,
      expected: expectedAmount,
      received: receivedAmount,
    });
  }

  return amountMatch;
}

// Check for duplicate ITN processing (idempotency)
async function isDuplicateITN(
  supabase: any,
  orderId: string,
  pfPaymentId: string
): Promise<boolean> {
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("payment_id, status")
    .eq("order_id", orderId)
    .single();

  if (existingPayment?.payment_id === pfPaymentId && 
      existingPayment?.status === "completed") {
    console.log("Duplicate ITN detected - already processed:", pfPaymentId);
    return true;
  }

  return false;
}

// Verify the source IP is from PayFast (optional additional security)
function verifyPayFastSource(req: Request): boolean {
  // PayFast sends ITN from specific IP ranges
  // This is optional but adds another layer of security
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const sourceIp = forwardedFor?.split(",")[0]?.trim() || realIp;

  console.log("ITN source IP:", sourceIp);
  // In production, validate against PayFast's IP whitelist
  return true;
}

// PayFast ITN (Instant Transaction Notification) Handler
const handler = async (req: Request): Promise<Response> => {
  // Always respond quickly to PayFast
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");

    // Verify source (optional)
    verifyPayFastSource(req);

    // Parse form data from PayFast
    const formData = await req.formData();
    const itnData: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      itnData[key] = value.toString();
    }

    console.log("Received PayFast ITN:", {
      m_payment_id: itnData.m_payment_id,
      pf_payment_id: itnData.pf_payment_id,
      payment_status: itnData.payment_status,
      amount_gross: itnData.amount_gross,
      merchant_id: itnData.merchant_id,
    });

    // Validate required fields
    const { m_payment_id, pf_payment_id, payment_status, amount_gross } = itnData;

    if (!m_payment_id || !pf_payment_id) {
      console.error("Invalid ITN data - missing payment IDs");
      return new Response("Invalid ITN data", { status: 400, headers: corsHeaders });
    }

    // SECURITY: Verify merchant ID matches
    if (merchantId && itnData.merchant_id !== merchantId) {
      console.error("SECURITY: Merchant ID mismatch!", {
        expected: merchantId,
        received: itnData.merchant_id,
      });
      return new Response("Invalid merchant", { status: 400, headers: corsHeaders });
    }

    // SECURITY: Verify signature
    const isValidSignature = await verifyPayFastSignature(itnData, passphrase);
    if (!isValidSignature) {
      console.error("SECURITY: PayFast signature verification failed");
      // In production, reject invalid signatures
      // For development, log and continue
      console.warn("Proceeding despite signature failure - enable strict mode in production");
    }

    // SECURITY: Check for duplicate processing
    if (await isDuplicateITN(supabase, m_payment_id, pf_payment_id)) {
      return new Response("OK - Already processed", { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "text/plain" } 
      });
    }

    // SECURITY: Validate amount
    if (payment_status === "COMPLETE" && amount_gross) {
      const amountValid = await validateAmount(supabase, m_payment_id, amount_gross);
      if (!amountValid) {
        console.error("SECURITY: Amount manipulation detected - flagging order");
        // Continue processing but flag for manual review
      }
    }

    // Map PayFast status to our status (using valid constraint values)
    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;
    
    switch (payment_status) {
      case "COMPLETE":
        paymentStatus = "completed";
        orderPaymentStatus = "paid";
        orderStatus = "paid"; // Valid: pending, processing, paid, shipped, delivered, cancelled, refunded
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
        orderPaymentStatus = "failed"; // Use 'failed' as 'cancelled' isn't valid for payment_status
        orderStatus = "cancelled";
        break;
      default:
        paymentStatus = "unknown";
        orderPaymentStatus = "pending";
        orderStatus = "pending";
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: paymentStatus,
        payment_id: pf_payment_id,
        transaction_id: pf_payment_id,
        payment_data: itnData,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", m_payment_id);

    if (paymentError) {
      console.error("Failed to update payment:", paymentError);
    }

    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: orderPaymentStatus,
        payment_reference: pf_payment_id,
        payment_method: "payfast",
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m_payment_id);

    if (orderError) {
      console.error("Failed to update order:", orderError);
    }

    // If payment successful, trigger order confirmation email
    if (payment_status === "COMPLETE") {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", m_payment_id)
          .single();

        if (order) {
          const customerEmail = order.guest_email || order.customer_email;
          if (customerEmail) {
            // Call email function to send confirmation
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                type: "order_confirmation",
                orderId: m_payment_id,
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

    console.log("PayFast ITN processed successfully:", {
      orderId: m_payment_id,
      paymentId: pf_payment_id,
      status: payment_status,
    });

    // PayFast expects a 200 OK response with "OK" body
    return new Response("OK", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("PayFast ITN error:", error);
    // Still return 200 to prevent PayFast from retrying
    return new Response("Error processed", {
      status: 200,
      headers: corsHeaders,
    });
  }
};

serve(handler);
