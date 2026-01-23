import { Hono } from "npm:hono@4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const mcpServer = new McpServer({
  name: "customer-support-mcp",
  version: "1.0.0",
});

// FAQ Database
const faqs = {
  "shipping": {
    question: "How long does shipping take?",
    answer: "We ship nationwide within South Africa. Delivery times:\n- Gauteng: 1-2 business days\n- Western Cape, KZN: 2-3 business days\n- Other provinces: 3-5 business days\n\nCuttings are shipped Monday-Wednesday to ensure they don't sit over weekends. Heat packs included in winter months at no extra charge."
  },
  "rooting": {
    question: "How do I root my dragon fruit cutting?",
    answer: "1. Let the cutting callus for 5-7 days in shade\n2. Plant in well-draining mix (50% perlite, 50% potting soil)\n3. Water lightly - keep barely moist, not wet\n4. Place in bright indirect light\n5. Roots develop in 2-4 weeks\n6. Don't fertilize until established (6-8 weeks)\n\nWe include detailed instructions with every cutting. WhatsApp support available!"
  },
  "fruiting": {
    question: "When will my plant fruit?",
    answer: "Fruiting timeline depends on starting point:\n- From cutting: 18-24 months\n- From rooted plant: 12-18 months\n- Established plant: Can fruit same season if healthy\n\nPlants need to reach ~1.5m height and have multiple branches before flowering. Good nutrition and proper support structures speed up fruiting."
  },
  "winter-care": {
    question: "How do I protect plants in winter?",
    answer: "Dragon fruit is frost-sensitive. For South African winters:\n1. Stop watering in May - resume in September\n2. Cover plants if frost expected (below 2°C)\n3. Don't prune in winter\n4. No fertilizer during dormancy\n5. Coastal areas usually fine without protection\n6. Highveld needs frost cloth or heated greenhouse\n\nPlants tolerate cool temps (5-10°C) but frost kills tissue."
  },
  "payment": {
    question: "What payment methods do you accept?",
    answer: "We accept:\n- Credit/Debit cards (Visa, Mastercard) via Yoco\n- Instant EFT via Yoco\n- Direct bank transfer (EFT)\n\nSecure checkout with SSL encryption. Orders processed within 24 hours of payment confirmation."
  },
  "guarantee": {
    question: "Do you offer a guarantee?",
    answer: "Yes! Our guarantees:\n- Cuttings: Healthy and viable on arrival\n- Rooted plants: Alive and rooted on delivery\n- If DOA, send photos within 24 hours for full replacement\n\nWe can't guarantee rooting success as this depends on your care, but we offer free WhatsApp support to help you succeed."
  },
  "pollination": {
    question: "Do I need multiple plants for fruit?",
    answer: "It depends on the variety:\n- Vietnamese White: Self-fertile but cross-pollination improves yield\n- Red Flesh: Needs cross-pollination with compatible variety\n- Yellow Dragon: Self-fertile\n\nFor best results, we recommend at least 2 different varieties. Hand pollination at night (when flowers open) dramatically increases fruit set."
  },
  "returns": {
    question: "What is your returns policy?",
    answer: "Due to the nature of live plants:\n- Unused items: Full refund within 7 days\n- Dead on arrival: Full replacement (photos required within 24hrs)\n- Damaged in transit: Full replacement (photos required)\n- Change of mind: No returns on live plants\n\nContact us immediately for any issues - we want you to succeed!"
  }
};

// Tool: Get FAQ answer
mcpServer.tool({
  name: "answer_faq",
  description: "Answer frequently asked questions about dragon fruit and the business",
  inputSchema: {
    type: "object",
    properties: {
      topic: { 
        type: "string", 
        description: "FAQ topic: shipping, rooting, fruiting, winter-care, payment, guarantee, pollination, returns" 
      }
    },
    required: ["topic"]
  },
  handler: async ({ topic }) => {
    const faq = faqs[topic as keyof typeof faqs];
    if (!faq) {
      return {
        content: [{
          type: "text",
          text: `Topic not found. Available topics: ${Object.keys(faqs).join(", ")}\n\nFor other questions, please contact us via WhatsApp or email.`
        }]
      };
    }
    return {
      content: [{
        type: "text",
        text: `**${faq.question}**\n\n${faq.answer}`
      }]
    };
  }
});

// Tool: Get order status
mcpServer.tool({
  name: "get_order_status",
  description: "Get the status of a customer order by order number",
  inputSchema: {
    type: "object",
    properties: {
      orderNumber: { type: "string", description: "Order number (e.g., ORD-20260123-ABC123)" }
    },
    required: ["orderNumber"]
  },
  handler: async ({ orderNumber }) => {
    // Connect to Supabase to fetch real order data
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        content: [{
          type: "text",
          text: "Unable to check order status. Please contact support directly."
        }]
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return {
        content: [{
          type: "text",
          text: `Order ${orderNumber} not found. Please check the order number and try again, or contact support.`
        }]
      };
    }

    const statusMessages = {
      "pending": "⏳ Order received - awaiting payment confirmation",
      "confirmed": "✅ Payment confirmed - preparing your order",
      "processing": "📦 Order being prepared for shipment",
      "shipped": `🚚 Order shipped! Tracking: ${order.tracking_number || 'Pending'}`,
      "delivered": "✅ Order delivered!",
      "cancelled": "❌ Order cancelled"
    };

    const response = {
      orderNumber: order.order_number,
      status: order.status,
      statusMessage: statusMessages[order.status as keyof typeof statusMessages] || order.status,
      paymentStatus: order.payment_status,
      total: `R${order.total_zar?.toFixed(2)}`,
      items: order.order_items?.length || 0,
      createdAt: new Date(order.created_at).toLocaleDateString('en-ZA'),
      shippedAt: order.shipped_at ? new Date(order.shipped_at).toLocaleDateString('en-ZA') : null,
      trackingNumber: order.tracking_number
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
});

// Tool: Get customer info (for support agents)
mcpServer.tool({
  name: "get_customer_info",
  description: "Get customer information for support purposes",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Customer email address" }
    },
    required: ["email"]
  },
  handler: async ({ email }) => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        content: [{
          type: "text",
          text: "Unable to fetch customer info. Service unavailable."
        }]
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get customer
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_zar, created_at')
      .or(`customer_id.eq.${customer?.id},guest_email.eq.${email}`)
      .order('created_at', { ascending: false })
      .limit(5);

    const info = {
      customerFound: !!customer,
      name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Guest',
      email: email,
      phone: customer?.phone,
      totalOrders: orders?.length || 0,
      recentOrders: orders?.map(o => ({
        number: o.order_number,
        status: o.status,
        total: `R${o.total_zar?.toFixed(2)}`,
        date: new Date(o.created_at).toLocaleDateString('en-ZA')
      })) || []
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(info, null, 2)
      }]
    };
  }
});

// Tool: Generate support response
mcpServer.tool({
  name: "generate_support_response",
  description: "Generate a helpful customer support response",
  inputSchema: {
    type: "object",
    properties: {
      issueType: { 
        type: "string", 
        description: "Type of issue: shipping-delay, damaged-plant, rooting-help, payment-issue, general" 
      },
      customerName: { type: "string", description: "Customer's name" },
      orderNumber: { type: "string", description: "Related order number if applicable" }
    },
    required: ["issueType"]
  },
  handler: async ({ issueType, customerName, orderNumber }) => {
    const name = customerName || "there";
    const orderRef = orderNumber ? ` regarding order ${orderNumber}` : "";
    
    const responses = {
      "shipping-delay": `Hi ${name}! 👋\n\nThank you for reaching out${orderRef}. I understand waiting for your plants can be frustrating!\n\nLet me check on your shipment status right away. Our standard delivery times are:\n- Gauteng: 1-2 days\n- Other provinces: 2-5 days\n\nIf it's been longer, there may be a courier delay. I'll track your package and get back to you with an update within the hour.\n\nIn the meantime, rest assured that our plants are packaged to stay healthy for up to 7 days in transit. 🌱\n\nThank you for your patience!`,
      
      "damaged-plant": `Hi ${name}! 😔\n\nI'm so sorry to hear your plant arrived damaged${orderRef}. That's definitely not the experience we want for you!\n\nPlease send me photos of:\n1. The damaged plant\n2. The packaging condition\n\nWe'll arrange a replacement right away - no need to return the damaged item. We want you to have healthy plants!\n\nWhile I organize the replacement, if any parts of the cutting are still firm and green, they may still be usable. Happy to guide you on salvaging them if you'd like. 🌿`,
      
      "rooting-help": `Hi ${name}! 🌱\n\nHappy to help with your rooting journey!\n\nQuick checklist for success:\n✅ Cutting callused for 5-7 days?\n✅ Well-draining soil mix?\n✅ Bright indirect light?\n✅ Watering only when soil is dry?\n\nCommon issues:\n- Yellow/soft = too much water\n- Shriveling = needs more humidity\n- No roots after 4 weeks = check soil drainage\n\nSend me a photo and I can give specific advice for your situation! We're here to help you succeed. 💪`,
      
      "payment-issue": `Hi ${name}! 💳\n\nI apologize for any payment difficulties${orderRef}. Let me help resolve this quickly!\n\nCommon solutions:\n1. Try a different browser or clear cache\n2. Ensure 3D Secure is enabled with your bank\n3. Try an alternative payment method\n\nIf you're still having trouble, I can send you a direct EFT banking details for manual payment.\n\nPlease let me know which option works best for you!`,
      
      "general": `Hi ${name}! 👋\n\nThank you for contacting Dragon Fruit South Africa${orderRef}!\n\nI'm here to help with any questions about:\n🌱 Our plants and products\n📦 Shipping and delivery\n🌿 Growing advice\n💳 Orders and payments\n\nHow can I assist you today?`
    };

    const response = responses[issueType as keyof typeof responses] || responses["general"];
    
    return {
      content: [{
        type: "text",
        text: response
      }]
    };
  }
});

const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
