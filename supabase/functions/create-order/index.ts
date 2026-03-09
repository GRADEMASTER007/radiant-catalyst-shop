import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

interface CreateOrderItemInput {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  includeRooting?: boolean;
}

interface CreateOrderRequest {
  items: CreateOrderItemInput[];
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  shippingMethod: string;
  shippingCost: number;
  rootingCost?: number;
  couponCode?: string;
  couponDiscount?: number;
}

function generateOrderNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json()) as CreateOrderRequest;
    const { items, shippingAddress, shippingMethod, shippingCost, rootingCost = 0 } = body;

    if (!items?.length) throw new Error("No items provided");
    if (!shippingAddress?.email || !shippingAddress?.name) throw new Error("Missing shipping details");

    // Optional auth: if bearer token exists, attach customer_id
    let customerId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const auth = await validateAuth(req);
      if (auth.user?.id) customerId = auth.user.id;
    }

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const total = subtotal + shippingCost + rootingCost;

    const rootingItems = items.filter((i) => i.includeRooting);
    const rootingNote = rootingItems.length
      ? `Rooting Service: ${rootingItems.reduce((sum, i) => sum + i.quantity, 0)} plants @ R${(
          rootingCost / rootingItems.reduce((sum, i) => sum + i.quantity, 0)
        ).toFixed(2)}/plant = R${rootingCost.toFixed(2)}`
      : null;

    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const accessToken = crypto.randomUUID();

    const orderData: Record<string, unknown> = {
      id: orderId,
      order_number: orderNumber,
      access_token: accessToken,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      shipping_method: shippingMethod,
      shipping_cost_zar: shippingCost,
      subtotal_zar: subtotal + rootingCost,
      total_zar: total,
      status: "pending",
      payment_status: "pending",
      notes: rootingNote,
      guest_email: shippingAddress.email,
      customer_id: customerId,
    };

    // Ensure customer exists for authenticated users (prevents FK errors)
    if (customerId) {
      const fullName = (shippingAddress.name || "").trim();
      const firstName = fullName.split(" ")[0] || null;
      const lastName = fullName.split(" ").slice(1).join(" ") || null;

      await service
        .from("customers")
        .upsert(
          {
            id: customerId,
            email: shippingAddress.email,
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          } as any,
          { onConflict: "id" }
        );
    }

    const { error: orderError } = await service.from("orders").insert(orderData as any);
    if (orderError) throw new Error(orderError.message);

    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      quantity: item.quantity,
      unit_price_zar: item.unitPrice,
      total_price_zar: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await service.from("order_items").insert(orderItems as any);
    if (itemsError) throw new Error(itemsError.message);

    return new Response(
      JSON.stringify({ success: true, orderId, orderNumber, accessToken }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create order";
    console.error("create-order error:", e);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
