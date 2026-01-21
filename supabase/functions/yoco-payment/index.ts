import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YocoPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("YOCO_SECRET_KEY");
    
    if (!secretKey) {
      console.error("Yoco secret key not configured");
      throw new Error("Yoco credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestBody: YocoPaymentRequest = await req.json();
    const { orderId, amount, currency, successUrl, cancelUrl, customerEmail, metadata } = requestBody;

    // Validate required fields
    if (!orderId || !amount) {
      throw new Error("Missing required fields: orderId or amount");
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order lookup failed:", orderError);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Convert amount to cents for Yoco (they expect cents)
    const amountInCents = Math.round(amount * 100);

    // Webhook URL for payment notifications
    const webhookUrl = `${supabaseUrl}/functions/v1/yoco-webhook`;

    console.log("Creating Yoco checkout:", {
      orderId,
      amount,
      amountInCents,
      currency: currency || "ZAR",
    });

    // Create Yoco checkout session
    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: currency || "ZAR",
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        failureUrl: cancelUrl,
        metadata: {
          orderId: orderId,
          orderNumber: order.order_number,
          ...metadata,
        },
      }),
    });

    if (!yocoResponse.ok) {
      const errorData = await yocoResponse.text();
      console.error("Yoco API error:", yocoResponse.status, errorData);
      
      if (yocoResponse.status === 401) {
        throw new Error("Invalid Yoco API credentials");
      }
      if (yocoResponse.status === 400) {
        throw new Error(`Invalid payment request: ${errorData}`);
      }
      throw new Error(`Yoco API error: ${yocoResponse.status}`);
    }

    const checkoutData = await yocoResponse.json();

    console.log("Yoco checkout created:", {
      checkoutId: checkoutData.id,
      redirectUrl: checkoutData.redirectUrl,
    });

    // Create or update payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .upsert({
        order_id: orderId,
        provider: "yoco",
        amount_zar: amount,
        status: "pending",
        payment_id: checkoutData.id,
        payment_data: {
          checkoutId: checkoutData.id,
          redirectUrl: checkoutData.redirectUrl,
          amountInCents,
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

    return new Response(
      JSON.stringify({
        success: true,
        checkoutId: checkoutData.id,
        redirectUrl: checkoutData.redirectUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Yoco payment error:", error);
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
