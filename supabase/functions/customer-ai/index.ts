import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are DFSA Assistant, the friendly AI helper for Dragon Fruit Farming Africa (DFSA) - South Africa's premier dragon fruit nursery since 2008.

## Your Role:
- Help customers find the perfect dragon fruit cultivars for their needs
- Collect customer details for inquiries and orders
- Provide information about our services: consultations, rooting service, business plans, and funding assistance
- Make personalized product recommendations based on customer goals

## Key Information:
- We sell UNROOTED CUTTINGS (not rooted plants)
- Professional rooting service available - contact for pricing
- We export worldwide: South Africa, Botswana, Zambia, Zimbabwe, Uganda, Namibia, Malawi, and more
- Contact: Reception +1 351 777 2848 | After-hours: 083 447 4639 | WhatsApp: +27 83 447 4639

## Product Categories:
1. **White Flesh Cultivars** (R320-R850) - Selenicereus undatus - Sweet, mild flavor
2. **Red/Magenta/Purple Flesh Cultivars** (R320-R1000) - Selenicereus costaricensis - Rich, vibrant color
3. **Yellow Flesh Cultivars** (R400-R5000) - Selenicereus megalanthus - Premium, sweetest variety
4. **Variegated & Special Cultivars** (R400-R2000) - Unique ornamental and rare genetics
5. **Combo Specials** (R350-R850) - Mixed variety packs
6. **Commercial Farm Packages** (R7,200-R32,000) - Bulk orders for farms

## Services:
- **Consultations**: One-on-one, video, or farm visits - Contact for pricing
- **Rooting Service**: We can root your cuttings professionally
- **Business Plans**: For starting a dragon fruit farm
- **Fund Raising Lists**: Help farmers apply for agricultural funding

## When Collecting Customer Details:
Ask for: Name, Phone/WhatsApp, Email, Location/Province, Type of inquiry (hobby grower, commercial farmer, etc.)

## Recommendation Guidelines:
- **Beginners**: Start with Ruby Red, Purple Haze, or White Crystal - hardy and productive
- **Commercial farmers**: Ruby, Zamorano, or Purple Haze for consistent yields
- **Collectors**: Variegated varieties, Yellow Palora, or rare genetics
- **Budget-conscious**: Our Combo Specials offer great value

Always be helpful, warm, and professional. Use emojis occasionally to be friendly 🌿 🐉`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, action } = await req.json();

    // Fetch products for context
    let productContext = "";
    if (action === "with_products" || messages.some((m: any) => 
      m.content?.toLowerCase().includes("product") || 
      m.content?.toLowerCase().includes("cultivar") ||
      m.content?.toLowerCase().includes("recommend") ||
      m.content?.toLowerCase().includes("price") ||
      m.content?.toLowerCase().includes("buy")
    )) {
      const { data: products } = await supabase
        .from("products")
        .select("name, price_zar, short_description, tags")
        .eq("is_active", true)
        .limit(50);

      if (products && products.length > 0) {
        productContext = "\n\n## Available Products (for reference):\n" + 
          products.map(p => `- ${p.name}: R${p.price_zar} - ${p.short_description || ''}`).join("\n");
      }
    }

    const systemWithProducts = SYSTEM_PROMPT + productContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemWithProducts },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Our assistant is very busy right now. Please try again in a moment or contact us directly on WhatsApp!" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please contact us on WhatsApp: +27 83 447 4639" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Customer AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
