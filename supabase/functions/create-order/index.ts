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
  paymentGateway?: string;
}

// Orders older than this are considered expired and won't be reused
const ORDER_EXPIRY_MINUTES = 60;

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
    const { items, shippingAddress, shippingMethod, shippingCost, rootingCost = 0, couponCode, couponDiscount = 0, paymentGateway } = body;

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
    const total = subtotal + shippingCost + rootingCost - couponDiscount;

    const rootingItems = items.filter((i) => i.includeRooting);
    const rootingNote = rootingItems.length
      ? `Rooting Service: ${rootingItems.reduce((sum, i) => sum + i.quantity, 0)} plants @ R${(
          rootingCost / rootingItems.reduce((sum, i) => sum + i.quantity, 0)
        ).toFixed(2)}/plant = R${rootingCost.toFixed(2)}`
      : null;

    // --- DUPLICATE ORDER PREVENTION ---
    // Check for existing unpaid order from same customer/email within expiry window
    const expiryThreshold = new Date(Date.now() - ORDER_EXPIRY_MINUTES * 60 * 1000).toISOString();
    
    let existingOrder: any = null;
    
    if (customerId) {
      const { data } = await service
        .from("orders")
        .select("id, order_number, access_token, created_at")
        .eq("customer_id", customerId)
        .in("payment_status", ["pending"])
        .in("status", ["pending", "awaiting_payment"])
        .gte("created_at", expiryThreshold)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.length) existingOrder = data[0];
    } else if (shippingAddress.email) {
      const { data } = await service
        .from("orders")
        .select("id, order_number, access_token, created_at")
        .eq("guest_email", shippingAddress.email)
        .is("customer_id", null)
        .in("payment_status", ["pending"])
        .in("status", ["pending", "awaiting_payment"])
        .gte("created_at", expiryThreshold)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.length) existingOrder = data[0];
    }

    if (existingOrder) {
      console.log("Reusing existing unpaid order:", existingOrder.order_number);
      
      // Update existing order with latest details
      await service
        .from("orders")
        .update({
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          shipping_method: shippingMethod,
          shipping_cost_zar: shippingCost,
          subtotal_zar: subtotal + rootingCost,
          discount_zar: couponDiscount,
          total_zar: total,
          status: "pending",
          payment_status: "pending",
          notes: rootingNote,
          coupon_code: couponCode || null,
          coupon_discount_zar: couponDiscount,
          payment_method: paymentGateway || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", existingOrder.id);

      // Delete old order items and replace with new ones
      await service.from("order_items").delete().eq("order_id", existingOrder.id);
      
      const orderItems = items.map((item) => ({
        order_id: existingOrder.id,
        product_id: item.productId,
        product_name: item.productName,
        product_sku: item.productSku,
        quantity: item.quantity,
        unit_price_zar: item.unitPrice,
        total_price_zar: item.unitPrice * item.quantity,
      }));

      await service.from("order_items").insert(orderItems as any);

      // Also delete any stale payment record so the gateway creates a fresh one
      await service.from("payments").delete().eq("order_id", existingOrder.id);

      return new Response(
        JSON.stringify({ success: true, orderId: existingOrder.id, orderNumber: existingOrder.order_number, accessToken: existingOrder.access_token, reused: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Expire any old unpaid orders from this customer/email ---
    if (customerId) {
      await service
        .from("orders")
        .update({ status: "expired", payment_status: "abandoned", updated_at: new Date().toISOString() } as any)
        .eq("customer_id", customerId)
        .in("payment_status", ["pending"])
        .in("status", ["pending", "awaiting_payment"])
        .lt("created_at", expiryThreshold);
    } else if (shippingAddress.email) {
      await service
        .from("orders")
        .update({ status: "expired", payment_status: "abandoned", updated_at: new Date().toISOString() } as any)
        .eq("guest_email", shippingAddress.email)
        .is("customer_id", null)
        .in("payment_status", ["pending"])
        .in("status", ["pending", "awaiting_payment"])
        .lt("created_at", expiryThreshold);
    }

    // --- CREATE NEW ORDER ---
    const fullName = (shippingAddress.name || "").trim();
    const firstName = fullName.split(" ")[0] || null;
    const lastName = fullName.split(" ").slice(1).join(" ") || null;
    const phone = shippingAddress.phone || null;
    const email = (shippingAddress.email || "").toLowerCase().trim();

    // Normalized shipping address: keep legacy fields AND add standard fields
    // so the admin UI (which expects first_name/last_name/address_line1) shows data.
    const normalizedAddress = {
      ...shippingAddress,
      first_name: firstName,
      last_name: lastName,
      address_line1: shippingAddress.address,
      postal_code: shippingAddress.postalCode,
      country: "South Africa",
    };

    // Ensure customer record exists for BOTH authenticated and guest orders.
    // Authenticated → upsert by id. Guest → upsert by email (only if not already present).
    if (customerId) {
      // Don't blank out existing names if checkout name is empty
      const updatePayload: Record<string, unknown> = {
        id: customerId,
        email,
        updated_at: new Date().toISOString(),
      };
      if (firstName) updatePayload.first_name = firstName;
      if (lastName) updatePayload.last_name = lastName;
      if (phone) updatePayload.phone = phone;

      await service
        .from("customers")
        .upsert(updatePayload as any, { onConflict: "id" });
    } else if (email) {
      // Guest checkout: track customer by email so admin sees them
      const { data: existingCustomer } = await service
        .from("customers")
        .select("id, first_name, last_name, phone")
        .eq("email", email)
        .maybeSingle();

      if (!existingCustomer) {
        await service.from("customers").insert({
          id: crypto.randomUUID(),
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
        } as any);
      } else {
        // Update missing fields only — never blank out existing data
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (!existingCustomer.first_name && firstName) patch.first_name = firstName;
        if (!existingCustomer.last_name && lastName) patch.last_name = lastName;
        if (!existingCustomer.phone && phone) patch.phone = phone;
        if (Object.keys(patch).length > 1) {
          await service.from("customers").update(patch).eq("id", existingCustomer.id);
        }
      }
    }

    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const accessToken = crypto.randomUUID();

    const orderData: Record<string, unknown> = {
      id: orderId,
      order_number: orderNumber,
      access_token: accessToken,
      shipping_address: normalizedAddress,
      billing_address: normalizedAddress,
      shipping_method: shippingMethod,
      shipping_cost_zar: shippingCost,
      subtotal_zar: subtotal + rootingCost,
      discount_zar: couponDiscount,
      total_zar: total,
      status: "pending",
      payment_status: "pending",
      notes: rootingNote,
      guest_email: shippingAddress.email,
      customer_id: customerId,
      coupon_code: couponCode || null,
      coupon_discount_zar: couponDiscount,
      payment_method: paymentGateway || null,
    };

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
