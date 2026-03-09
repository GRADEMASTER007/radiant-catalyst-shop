import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, orderSubtotal } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, error: "No coupon code provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: coupon, error } = await service
      .from("coupon_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid coupon code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon has expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check start date
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon is not yet active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon has reached its usage limit" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum order amount
    if (coupon.min_order_amount && orderSubtotal < coupon.min_order_amount) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Minimum order of R${coupon.min_order_amount.toFixed(2)} required`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (orderSubtotal * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, orderSubtotal); // Cap at subtotal

    // Increment usage
    await service
      .from("coupon_codes")
      .update({ current_uses: coupon.current_uses + 1 })
      .eq("id", coupon.id);

    return new Response(
      JSON.stringify({
        valid: true,
        discount,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        description: coupon.description,
        code: coupon.code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("validate-coupon error:", e);
    return new Response(
      JSON.stringify({ valid: false, error: "Failed to validate coupon" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
