import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateMD5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Same routine as payfast-payment: raw values, sorted keys, optional passphrase
async function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): Promise<string> {
  const signatureParts = Object.keys(data)
    .filter((k) => k !== "signature")
    .sort()
    .flatMap((key) => {
      const value = data[key];
      if (value === undefined || value === null) return [];
      const trimmed = value.trim();
      if (!trimmed) return [];
      return [`${key}=${trimmed}`];
    });

  let signatureString = signatureParts.join("&");
  if (passphrase && passphrase.trim() !== "") {
    signatureString += `&passphrase=${passphrase.trim()}`;
  }

  const redactedLog = signatureString
    .replace(/merchant_key=[^&]+/, "merchant_key=[REDACTED]")
    .replace(/passphrase=[^&]+/, "passphrase=[REDACTED]");
  console.log("PayFast (subscription) signature string:", redactedLog);

  return generateMD5Hash(signatureString);
}

function generatePaymentReference(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `SUB-${suffix}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Backend is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate caller
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
    const user = userData.user;

    const body = await req.json();
    const { businessId, planId, provider } = body || {};
    if (!businessId || !planId || !provider) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: businessId, planId, provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (provider !== "payfast" && provider !== "paypal") {
      return new Response(JSON.stringify({ success: false, error: "provider must be 'payfast' or 'paypal'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm business belongs to caller
    const { data: business, error: businessError } = await supabase
      .from("business_listings")
      .select("id, user_id, business_name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ success: false, error: "Business listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (business.user_id !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "You do not own this business listing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_zar, duration_months, is_active")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ success: false, error: "Subscription plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!plan.is_active) {
      return new Response(JSON.stringify({ success: false, error: "This subscription plan is not currently available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceZar = Number(plan.price_zar);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Number(plan.duration_months));

    const paymentReference = generatePaymentReference();

    const { data: subscription, error: subError } = await supabase
      .from("business_subscriptions")
      .insert({
        business_id: businessId,
        plan_id: planId,
        user_id: user.id,
        status: "pending",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        amount_paid_zar: priceZar,
        payment_reference: paymentReference,
      })
      .select("id")
      .single();

    if (subError || !subscription) {
      console.error("Failed to create business_subscriptions row:", subError?.message);
      return new Response(JSON.stringify({ success: false, error: "Could not create subscription record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve caller display name/email
    let firstName = "Seller";
    let lastName = "";
    const metaName = (user.user_metadata?.full_name || user.user_metadata?.name || "") as string;
    if (metaName.trim()) {
      const parts = metaName.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    } else {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        const profileName = (profile?.full_name || "").trim();
        if (profileName) {
          const parts = profileName.split(" ");
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }
      } catch (_e) {
        // fall back to defaults
      }
    }
    const email = user.email || "";

    if (provider === "payfast") {
      const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
      const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
      const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";

      if (!merchantId || !merchantKey) {
        return new Response(
          JSON.stringify({ success: false, error: "PAYFAST_MERCHANT_ID or PAYFAST_MERCHANT_KEY is not configured" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl;
      const notifyUrl = `${supabaseUrl}/functions/v1/payfast-itn`;
      const returnUrl = `${siteUrl}/seller/subscription/success`;
      const cancelUrl = `${siteUrl}/seller/subscription/cancelled`;

      const paymentData: Record<string, string> = {
        merchant_id: merchantId.trim().replace(/\D/g, ""),
        merchant_key: merchantKey.trim(),
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: firstName.substring(0, 100),
        name_last: lastName.substring(0, 100),
        email_address: email.trim(),
        m_payment_id: subscription.id,
        amount: priceZar.toFixed(2),
        item_name: `${plan.name} Subscription`.substring(0, 100),
      };
      for (const key of Object.keys(paymentData)) {
        paymentData[key] = paymentData[key].trim();
      }

      const signature = await generatePayFastSignature(paymentData, passphrase);
      paymentData.signature = signature;

      const orderedKeys = [
        "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
        "name_first", "name_last", "email_address", "m_payment_id", "amount",
        "item_name", "signature",
      ];
      const formFields: Record<string, string> = {};
      for (const key of orderedKeys) {
        if (paymentData[key]) formFields[key] = paymentData[key];
      }

      console.log("Seller subscription payment initiated:", {
        subscriptionId: subscription.id,
        planName: plan.name,
        provider: "payfast",
        amount: priceZar.toFixed(2),
      });

      return new Response(
        JSON.stringify({
          success: true,
          actionUrl: "https://www.payfast.co.za/eng/process",
          formFields,
          subscriptionId: subscription.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // provider === "paypal"
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalEnv = (Deno.env.get("PAYPAL_ENV") || "").toLowerCase();

    if (!paypalClientId || !paypalClientSecret || !paypalEnv) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "PayPal is not set up yet. PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_ENV must be configured.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiBase = paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const tokenResp = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenResp.ok) {
      const errText = await tokenResp.text().catch(() => "");
      console.error("PayPal token request failed:", tokenResp.status, errText.slice(0, 200));
      return new Response(JSON.stringify({ success: false, error: "Could not authenticate with PayPal" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson.access_token;

    const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl;
    const orderResp = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: subscription.id,
            description: `${plan.name} Subscription`,
            amount: { currency_code: "ZAR", value: priceZar.toFixed(2) },
          },
        ],
        application_context: {
          return_url: `${siteUrl}/seller/subscription/success`,
          cancel_url: `${siteUrl}/seller/subscription/cancelled`,
        },
      }),
    });

    const orderJson = await orderResp.json();
    if (!orderResp.ok) {
      console.error("PayPal order creation failed:", orderResp.status, JSON.stringify(orderJson).slice(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: orderJson?.message || "PayPal could not create the order" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const approvalLink = (orderJson.links || []).find((l: any) => l.rel === "approve")?.href;

    await supabase
      .from("business_subscriptions")
      .update({ payment_reference: orderJson.id, updated_at: new Date().toISOString() })
      .eq("id", subscription.id);

    console.log("Seller subscription payment initiated:", {
      subscriptionId: subscription.id,
      planName: plan.name,
      provider: "paypal",
      amount: priceZar.toFixed(2),
    });

    return new Response(
      JSON.stringify({ success: true, redirectUrl: approvalLink, subscriptionId: subscription.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("seller-subscription error:", error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: "Subscription initialization failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
