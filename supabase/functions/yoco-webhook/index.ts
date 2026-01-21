import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData = await req.json();
    console.log("Received Yoco webhook:", webhookData);

    const { type, payload } = webhookData;

    if (!payload?.metadata?.orderId) {
      console.log("No order ID in webhook payload");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const orderId = payload.metadata.orderId;
    const paymentId = payload.id;

    let paymentStatus: string;
    let orderPaymentStatus: string;
    let orderStatus: string;

    switch (type) {
      case "payment.succeeded":
        paymentStatus = "completed";
        orderPaymentStatus = "paid";
        orderStatus = "confirmed";
        break;
      case "payment.failed":
        paymentStatus = "failed";
        orderPaymentStatus = "failed";
        orderStatus = "pending";
        break;
      case "payment.cancelled":
        paymentStatus = "cancelled";
        orderPaymentStatus = "cancelled";
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
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              type: "order_confirmation",
              orderId: orderId,
              email: order.guest_email,
            }),
          });
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Yoco webhook error:", error);
    return new Response(error.message, {
      status: 500,
      headers: corsHeaders,
    });
  }
};

serve(handler);
