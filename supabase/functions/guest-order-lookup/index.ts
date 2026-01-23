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
    const { email, accessToken, orderNumber } = await req.json();

    // Require BOTH email and either access token or order number for security
    if (!email || (!accessToken && !orderNumber)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email and access token (or order number) are required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Service unavailable" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query with strict validation
    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal_zar,
        shipping_cost_zar,
        total_zar,
        created_at,
        shipped_at,
        tracking_number,
        shipping_method,
        order_items (
          id,
          product_name,
          quantity,
          unit_price_zar,
          total_price_zar
        )
      `)
      .eq("guest_email", email.toLowerCase().trim());

    // Require access token OR order number verification
    if (accessToken) {
      query = query.eq("access_token", accessToken);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch orders" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Don't expose if no match found (prevents enumeration)
    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          orders: [],
          message: "No orders found. Please check your email and order details."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, orders }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Guest order lookup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
