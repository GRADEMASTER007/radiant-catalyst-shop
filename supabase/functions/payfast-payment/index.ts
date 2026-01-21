import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayFastPaymentRequest {
  orderId: string;
  amount: number;
  itemName: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl: string;
}

// Generate MD5 hash for PayFast signature
async function generateMD5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate PayFast signature according to PayFast spec:
// - Create a query string of all fields (excluding `signature`)
// - Keys sorted alphabetically
// - Values URL-encoded with spaces as `+` (PayFast expects this)
// - Append passphrase as `&passphrase=...` if set
async function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): Promise<string> {
  const encodeValue = (value: string) =>
    encodeURIComponent(value.trim()).replace(/%20/g, "+");

  const keys = Object.keys(data)
    .filter((k) => k !== "signature" && data[k] !== undefined && data[k].trim() !== "")
    .sort();

  const signatureStringBase = keys
    .map((k) => `${k}=${encodeValue(data[k])}`)
    .join("&");

  const signatureString =
    passphrase && passphrase.trim() !== ""
      ? `${signatureStringBase}&passphrase=${encodeValue(passphrase)}`
      : signatureStringBase;

  console.log(
    "PayFast signature string:",
    signatureString.replace(/merchant_key=[^&]+/, "merchant_key=[REDACTED]")
  );

  return await generateMD5Hash(signatureString);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    
    if (!merchantId || !merchantKey) {
      console.error("PayFast credentials missing:", { merchantId: !!merchantId, merchantKey: !!merchantKey });
      throw new Error("PayFast credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody: PayFastPaymentRequest = await req.json();
    const { orderId, amount, itemName, customerEmail, customerName, returnUrl, cancelUrl } = requestBody;

    // Validate required fields
    if (!orderId || !amount || !customerEmail) {
      throw new Error("Missing required fields: orderId, amount, or customerEmail");
    }

    // Get the order from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order lookup failed:", orderError);
      throw new Error(`Order not found: ${orderId}`);
    }

    const notifyUrl = `${supabaseUrl}/functions/v1/payfast-itn`;

    // Parse customer name safely
    const nameParts = (customerName || "Customer").trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "";

    // PayFast payment data - order matters for signature
    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName.substring(0, 100),
      name_last: lastName.substring(0, 100),
      email_address: customerEmail.substring(0, 100),
      m_payment_id: orderId,
      amount: amount.toFixed(2),
      item_name: (itemName || "Dragon Fruit Order").substring(0, 100),
    };

    // Generate signature
    const signature = await generatePayFastSignature(paymentData, passphrase);
    paymentData.signature = signature;

    console.log("PayFast payment initiated:", {
      orderId,
      amount: paymentData.amount,
      merchantId,
      notifyUrl,
    });

    // Create or update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert({
        order_id: orderId,
        provider: "payfast",
        amount_zar: amount,
        status: "pending",
        payment_data: {
          ...paymentData,
          signature: "[REDACTED]", // Don't store signature
          merchant_key: "[REDACTED]", // Don't store key
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "order_id",
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      // Continue anyway - payment can still proceed
    }

    // Return payment data for form POST (not URL redirect)
    // PayFast requires form POST submission, not GET with URL params
    const payfastUrl = "https://www.payfast.co.za/eng/process";
    
    // Prepare form fields for POST submission
    const formFields: Record<string, string> = {};
    const orderedKeys = [
      "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
      "name_first", "name_last", "email_address", "m_payment_id", "amount", 
      "item_name", "signature"
    ];
    
    for (const key of orderedKeys) {
      if (paymentData[key]) {
        formFields[key] = paymentData[key];
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        actionUrl: payfastUrl,
        formFields: formFields,
        paymentId: orderId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("PayFast payment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Payment initialization failed"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
