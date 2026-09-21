import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo, x-paypal-webhook-token",
};

function getApiBase(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");
  const resp = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`PayPal token request failed (${resp.status})`);
  const json = await resp.json();
  return json.access_token;
}

async function verifyWebhookSignature(req: Request, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");

  if (!webhookId) {
    // Fallback: accept only if a shared-secret token header matches
    const expectedToken = Deno.env.get("PAYPAL_WEBHOOK_TOKEN");
    const providedToken = req.headers.get("x-paypal-webhook-token");
    console.log("PAYPAL_WEBHOOK_ID not configured; verification skipped, falling back to shared-secret token check");
    if (!expectedToken || !providedToken) return false;
    return providedToken === expectedToken;
  }

  try {
    const accessToken = await getAccessToken();
    const body = JSON.parse(rawBody);
    const verifyResp = await fetch(`${getApiBase()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        cert_url: req.headers.get("paypal-cert-url"),
        auth_algo: req.headers.get("paypal-auth-algo"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });
    if (!verifyResp.ok) {
      console.error("PayPal webhook verification request failed:", verifyResp.status);
      return false;
    }
    const verifyJson = await verifyResp.json();
    return verifyJson.verification_status === "SUCCESS";
  } catch (e: any) {
    console.error("PayPal webhook verification error:", e?.message || e);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();

    const verified = await verifyWebhookSignature(req, rawBody);
    if (!verified) {
      console.error("PayPal webhook: signature/token verification failed");
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    console.log("PayPal webhook event:", eventType);

    // We only act on capture-completed events
    if (eventType !== "PAYMENT.CAPTURE.COMPLETED" && eventType !== "CHECKOUT.ORDER.APPROVED") {
      return new Response("OK - ignored", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Resolve the PayPal order id and captured amount from the resource payload
    let paypalOrderId: string | undefined;
    let capturedAmount: string | undefined;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource;
      paypalOrderId = resource?.supplementary_data?.related_ids?.order_id;
      capturedAmount = resource?.amount?.value;
    } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Not yet captured — nothing to activate yet
      return new Response("OK - approved, awaiting capture", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    if (!paypalOrderId) {
      console.log("PayPal webhook: could not resolve order id from event payload");
      return new Response("OK - no order id", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    const { data: subscription, error: subError } = await supabase
      .from("business_subscriptions")
      .select("id, business_id, amount_paid_zar, status, expires_at, starts_at")
      .eq("payment_reference", paypalOrderId)
      .maybeSingle();

    if (subError || !subscription) {
      console.log("PayPal webhook: no matching subscription for PayPal order", paypalOrderId);
      return new Response("OK - no matching subscription", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    if (subscription.status === "active") {
      return new Response("OK - already active", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }

    const expectedAmount = Number(subscription.amount_paid_zar).toFixed(2);
    const receivedAmount = Number(capturedAmount || 0).toFixed(2);

    if (expectedAmount !== receivedAmount) {
      console.error("PayPal webhook: amount mismatch for subscription", subscription.id);
      await supabase
        .from("business_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);
      return new Response("OK - amount mismatch, subscription cancelled", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const now = new Date();
    // Preserve original duration by using existing expires_at/starts_at span, anchored to now
    const originalSpanMs = new Date(subscription.expires_at).getTime() - new Date(subscription.starts_at).getTime();
    const newExpiresAt = new Date(now.getTime() + Math.max(originalSpanMs, 0));

    await supabase
      .from("business_subscriptions")
      .update({
        status: "active",
        starts_at: now.toISOString(),
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    await supabase
      .from("business_listings")
      .update({
        subscription_status: "active",
        subscription_expires_at: newExpiresAt.toISOString(),
        is_active: true,
      })
      .eq("id", subscription.business_id);

    console.log("PayPal webhook: subscription activated", subscription.id);
    return new Response("OK", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  } catch (error: any) {
    console.error("paypal-webhook error:", error?.message || error);
    return new Response("Error processed", { status: 200, headers: corsHeaders });
  }
};

serve(handler);
