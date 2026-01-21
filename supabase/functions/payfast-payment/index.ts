import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

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

// Generate PayFast signature
function generateSignature(data: Record<string, string>, passphrase: string): string {
  const orderedParams = Object.keys(data)
    .sort()
    .filter(key => data[key] !== "" && key !== "signature")
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");
  
  const stringToSign = passphrase ? `${orderedParams}&passphrase=${encodeURIComponent(passphrase)}` : orderedParams;
  
  // Use SubtleCrypto for MD5 hash
  const encoder = new TextEncoder();
  const data_bytes = encoder.encode(stringToSign);
  
  // Simple MD5 implementation for Deno
  let hash = "";
  const md5 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer).catch(() => null);
    
    if (!hashBuffer) {
      // Fallback: use a simple hash for testing
      let h = 0;
      for (let i = 0; i < message.length; i++) {
        h = ((h << 5) - h) + message.charCodeAt(i);
        h = h & h;
      }
      return Math.abs(h).toString(16);
    }
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };
  
  // For PayFast, we need to implement MD5 properly
  // Using a simple approach with crypto
  return stringToSign;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE");
    
    if (!merchantId || !merchantKey) {
      throw new Error("PayFast credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, amount, itemName, customerEmail, customerName, returnUrl, cancelUrl }: PayFastPaymentRequest = await req.json();

    // Get the order from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const notifyUrl = `${supabaseUrl}/functions/v1/payfast-itn`;

    // PayFast payment data
    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: customerName.split(" ")[0] || "Customer",
      name_last: customerName.split(" ").slice(1).join(" ") || "",
      email_address: customerEmail,
      m_payment_id: orderId,
      amount: amount.toFixed(2),
      item_name: itemName.substring(0, 100),
    };

    // Generate signature using MD5
    const sortedKeys = Object.keys(paymentData).sort();
    const signatureString = sortedKeys
      .filter(key => paymentData[key] !== "")
      .map(key => `${key}=${encodeURIComponent(paymentData[key]).replace(/%20/g, "+")}`)
      .join("&");
    
    const finalString = passphrase 
      ? `${signatureString}&passphrase=${encodeURIComponent(passphrase)}`
      : signatureString;

    // Create MD5 hash using crypto module
    const { crypto: denoCrypto } = await import("https://deno.land/std@0.190.0/crypto/crypto.ts");
    const encoder = new TextEncoder();
    const data = encoder.encode(finalString);
    const hashBuffer = await denoCrypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    paymentData.signature = signature;

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      provider: "payfast",
      amount_zar: amount,
      status: "pending",
      payment_data: paymentData,
    });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
    }

    // Build PayFast redirect URL
    const payfastUrl = "https://www.payfast.co.za/eng/process";
    const formParams = new URLSearchParams(paymentData);

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: `${payfastUrl}?${formParams.toString()}`,
        paymentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("PayFast payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
