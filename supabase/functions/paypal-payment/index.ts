import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getApiBase(): string {
  const env = (Deno.env.get("PAYPAL_ENV") || "").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  const env = Deno.env.get("PAYPAL_ENV");
  if (!clientId || !clientSecret || !env) return null;
  return { clientId, clientSecret };
}

/** Exchange client credentials for a bearer access token. */
export async function getAccessToken(): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error("PayPal is not set up yet (missing PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET/PAYPAL_ENV)");

  const resp = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${creds.clientId}:${creds.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`PayPal token request failed (${resp.status}): ${text.slice(0, 200)}`);
  }
  const json = await resp.json();
  return json.access_token;
}

/** Create a PayPal v2 checkout order. amount is a ZAR two-decimal string. */
export async function createOrder(params: {
  amount: string;
  referenceId?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  const accessToken = await getAccessToken();
  const resp = await fetch(`${getApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.referenceId,
          description: params.description,
          amount: { currency_code: "ZAR", value: params.amount },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json?.message || `PayPal order creation failed (${resp.status})`);
  }
  return json;
}

/** Capture an approved PayPal order. */
export async function captureOrder(orderId: string) {
  const accessToken = await getAccessToken();
  const resp = await fetch(`${getApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json?.message || `PayPal capture failed (${resp.status})`);
  }
  return json;
}

/** Fetch a PayPal order's current state. */
export async function getOrder(orderId: string) {
  const accessToken = await getAccessToken();
  const resp = await fetch(`${getApiBase()}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json?.message || `PayPal order lookup failed (${resp.status})`);
  }
  return json;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!getCredentials()) {
      return new Response(
        JSON.stringify({ success: false, error: "PayPal is not set up yet. Ask an admin to configure PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_ENV." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ success: false, error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "createOrder") {
      const order = await createOrder({
        amount: Number(body.amount).toFixed(2),
        referenceId: body.referenceId,
        description: body.description,
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
      });
      return new Response(JSON.stringify({ success: true, order }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "captureOrder") {
      const capture = await captureOrder(body.orderId);
      return new Response(JSON.stringify({ success: true, capture }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getOrder") {
      const order = await getOrder(body.orderId);
      return new Response(JSON.stringify({ success: true, order }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("paypal-payment error:", error?.message || error);
    return new Response(JSON.stringify({ success: false, error: error?.message || "PayPal request failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
