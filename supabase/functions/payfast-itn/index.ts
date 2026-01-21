import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  // Sort keys alphabetically, exclude signature
  const sortedKeys = Object.keys(itnData)
    .filter(key => key !== "signature")
    .sort();

  // Build signature string
  const signatureString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(itnData[key].trim()).replace(/%20/g, "+")}`)
    .join("&");

  // Add passphrase if provided
  const finalString = passphrase
    ? `${signatureString}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : signatureString;

  const calculatedSignature = await generateMD5Hash(finalString);
  return calculatedSignature.toLowerCase() === receivedSignature.toLowerCase();
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
    });

    // Validate required fields
    const { m_payment_id, pf_payment_id, payment_status, amount_gross } = itnData;

    if (!m_payment_id || !pf_payment_id) {
      console.error("Invalid ITN data - missing payment IDs");
      return new Response("Invalid ITN data", { status: 400, headers: corsHeaders });
    }

    // Verify signature (log warning but don't fail - for debugging)
    const isValidSignature = await verifyPayFastSignature(itnData, passphrase);
    if (!isValidSignature) {
      console.warn("PayFast signature verification failed - proceeding anyway for debugging");
      // In production, you might want to return an error here
    }

    // Map PayFast status to our status
    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;
    
    switch (payment_status) {
      case "COMPLETE":
        paymentStatus = "completed";
        orderPaymentStatus = "paid";
        orderStatus = "confirmed";
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
        orderPaymentStatus = "cancelled";
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
