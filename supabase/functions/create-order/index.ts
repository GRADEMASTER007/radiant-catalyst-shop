import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

// Orders older than this are considered expired and won't be reused
const ORDER_EXPIRY_MINUTES = 60;

// --- Validation schemas (server-side canonical contract) ---
const itemSchema = z.object({
  productId: z.string().uuid({ message: "productId must be a UUID" }),
  productName: z.string().trim().min(1).max(255),
  productSku: z.string().trim().min(1).max(100),
  quantity: z.number().int().positive().max(1000),
  unitPrice: z.number().nonnegative().max(1_000_000),
  includeRooting: z.boolean().optional(),
});

// Accepts the loose shape sent by Checkout.tsx; we map it to a canonical
// address below. Either `address` or `address_line1` is required, etc.
const addressInputSchema = z
  .object({
    name: z.string().trim().max(200).optional(),
    first_name: z.string().trim().max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z.string().trim().min(5).max(40),
    address: z.string().trim().max(255).optional(),
    address_line1: z.string().trim().max(255).optional(),
    address_line2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    province: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().max(20).optional(),
    postal_code: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
  })
  .refine((a) => !!(a.name || a.first_name || a.last_name), {
    message: "Name (or first_name/last_name) is required",
    path: ["name"],
  })
  .refine((a) => !!(a.address || a.address_line1), {
    message: "Address line 1 is required",
    path: ["address"],
  })
  .refine((a) => !!(a.postalCode || a.postal_code), {
    message: "Postal code is required",
    path: ["postalCode"],
  });

const requestSchema = z.object({
  items: z.array(itemSchema).min(1, "At least one item is required"),
  shippingAddress: addressInputSchema,
  shippingMethod: z.string().trim().min(1).max(100),
  shippingCost: z.number().nonnegative().max(100_000),
  rootingCost: z.number().nonnegative().max(100_000).optional(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  couponDiscount: z.number().nonnegative().max(1_000_000).optional(),
  paymentGateway: z.string().trim().max(50).optional().nullable(),
});

// Canonical address shape stored in orders.shipping_address /
// orders.billing_address. Mirrors src/types/product.ts ShippingAddress, with
// legacy fields kept for backwards compatibility with older admin views.
export interface CanonicalAddress {
  // Standard / canonical
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  // Legacy aliases (kept so older code keeps working)
  name: string;
  address: string;
  postalCode: string;
}

function toCanonicalAddress(
  input: z.infer<typeof addressInputSchema>,
): CanonicalAddress {
  const fullName =
    (input.name?.trim() ||
      [input.first_name, input.last_name].filter(Boolean).join(" ").trim()) ??
    "";
  const firstName =
    input.first_name?.trim() || fullName.split(" ")[0] || "";
  const lastName =
    input.last_name?.trim() ||
    fullName.split(" ").slice(1).join(" ").trim() ||
    null;
  const line1 = (input.address_line1 || input.address || "").trim();
  const postal = (input.postal_code || input.postalCode || "").trim();
  const country = (input.country || "South Africa").trim();

  return {
    first_name: firstName,
    last_name: lastName,
    email: input.email,
    phone: input.phone,
    address_line1: line1,
    address_line2: input.address_line2?.trim() || null,
    city: input.city,
    province: input.province,
    postal_code: postal,
    country,
    // Legacy aliases
    name: fullName,
    address: line1,
    postalCode: postal,
  };
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

    // --- Validate request body against canonical schema ---
    const rawBody = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      console.warn("[create-order] validation failed:", JSON.stringify(fieldErrors));
      return new Response(
        JSON.stringify({ success: false, error: "Invalid checkout payload", fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      items,
      shippingAddress: rawShippingAddress,
      shippingMethod,
      shippingCost,
      rootingCost = 0,
      couponCode,
      couponDiscount = 0,
      paymentGateway,
    } = parsed.data;

    // Single canonical address used for shipping_address AND billing_address.
    const normalizedAddress = toCanonicalAddress(rawShippingAddress);
    const shippingAddress = normalizedAddress; // alias used below

    console.log("[create-order] incoming payload:", JSON.stringify({
      itemCount: items.length,
      items: items.map((i) => ({ sku: i.productSku, qty: i.quantity, unit: i.unitPrice, rooting: !!i.includeRooting })),
      shippingAddress: {
        name: normalizedAddress.name,
        first_name: normalizedAddress.first_name,
        last_name: normalizedAddress.last_name,
        email: normalizedAddress.email,
        phone: normalizedAddress.phone,
        address_line1: normalizedAddress.address_line1,
        city: normalizedAddress.city,
        province: normalizedAddress.province,
        postal_code: normalizedAddress.postal_code,
        country: normalizedAddress.country,
      },
      shippingMethod,
      shippingCost,
      rootingCost,
      couponCode,
      couponDiscount,
      paymentGateway,
    }));

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
      console.log("[create-order] reusing existing unpaid order:", existingOrder.order_number);

      // Build normalized address (same shape as new orders) so admin UI works.
      const _fullName = (shippingAddress.name || "").trim();
      const _firstName = _fullName.split(" ")[0] || null;
      const _lastName = _fullName.split(" ").slice(1).join(" ") || null;
      const reusedNormalizedAddress = {
        ...shippingAddress,
        first_name: _firstName,
        last_name: _lastName,
        address_line1: shippingAddress.address,
        postal_code: shippingAddress.postalCode,
        country: "South Africa",
      };

      const { error: updateErr } = await service
        .from("orders")
        .update({
          shipping_address: reusedNormalizedAddress,
          billing_address: reusedNormalizedAddress,
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

      console.log("[create-order] reused order updated:", JSON.stringify({
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
        shipping_address: reusedNormalizedAddress,
        total_zar: total,
        error: updateErr?.message ?? null,
      }));

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

    // Ensure authenticated user's customer profile is up to date.
    // Guest orders don't create customer rows (FK to auth.users), but their
    // info is fully captured in orders.shipping_address for the admin UI.
    if (customerId) {
      const updatePayload: Record<string, unknown> = {
        id: customerId,
        email,
        updated_at: new Date().toISOString(),
      };
      if (firstName) updatePayload.first_name = firstName;
      if (lastName) updatePayload.last_name = lastName;
      if (phone) updatePayload.phone = phone;

      const { error: customerErr } = await service
        .from("customers")
        .upsert(updatePayload as any, { onConflict: "id" });

      console.log("[create-order] customer upsert:", JSON.stringify({
        customerId,
        fields: { email, first_name: firstName, last_name: lastName, phone },
        error: customerErr?.message ?? null,
      }));
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
      guest_email: email,
      customer_id: customerId,
      coupon_code: couponCode || null,
      coupon_discount_zar: couponDiscount,
      payment_method: paymentGateway || null,
    };

    const { error: orderError } = await service.from("orders").insert(orderData as any);
    if (orderError) throw new Error(orderError.message);

    console.log("[create-order] order saved:", JSON.stringify({
      orderId,
      orderNumber,
      customerId,
      guest_email: email,
      shipping_address: {
        name: normalizedAddress.name,
        first_name: normalizedAddress.first_name,
        last_name: normalizedAddress.last_name,
        email: normalizedAddress.email,
        phone: normalizedAddress.phone,
        address_line1: normalizedAddress.address_line1,
        city: normalizedAddress.city,
        province: normalizedAddress.province,
        postal_code: normalizedAddress.postal_code,
        country: normalizedAddress.country,
      },
      total_zar: total,
    }));

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
