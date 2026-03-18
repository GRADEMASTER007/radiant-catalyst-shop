import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// ==========================================
// Z.AI CUSTOMER CHAT - Public endpoint
// Powers the customer-facing chatbot widget
// ==========================================

const SYSTEM_PROMPT = `You are the AI assistant for this website. You help customers find products, answer questions, and provide expert guidance on dragon fruit cultivation, probiotics, fermentation, and farming.

You are knowledgeable, warm, and professional. You understand the structure of the website and always produce helpful, accurate responses.

📞 Contact: Reception +1 351 777 2848 | WhatsApp: +27 83 447 4639 | Email: admin@proagrisa.co.za

Be helpful, enthusiastic, and guide customers to the right products and services! 🌿`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages, action } = await req.json();

    // Fetch knowledge base
    let knowledgeContext = "";
    try {
      const { data: articles } = await supabase
        .from("knowledge_base")
        .select("title, content, category")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(10);

      if (articles?.length) {
        knowledgeContext = "\n\n📚 Knowledge Base:\n" +
          articles.map(a => `[${a.category}] ${a.title}: ${a.content.slice(0, 200)}`).join("\n");
      }
    } catch {}

    // Fetch products if needed
    let productContext = "";
    if (action === "with_products") {
      try {
        const { data: products } = await supabase
          .from("products")
          .select("name, short_description, price_zar, stock_quantity")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .limit(30);

        if (products?.length) {
          productContext = "\n\n🛒 Available Products:\n" +
            products.map(p => `- ${p.name}: R${p.price_zar} (${p.stock_quantity > 0 ? "In Stock" : "Out of Stock"}) - ${p.short_description || ""}`).join("\n");
        }
      } catch {}
    }

    const fullSystemPrompt = SYSTEM_PROMPT + knowledgeContext + productContext;

    // Route through orchestrator
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "customer_chat",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[zai-chat] Orchestrator error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Chat is busy. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Orchestrator error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Non-streaming: convert to SSE
    const data = await response.json();
    const content = data.content || "";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });

  } catch (error: any) {
    console.error("[zai-chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Chat service error",
        fallback: "Please contact us directly:\n📞 +1 351 777 2848\n📱 WhatsApp: +27 83 447 4639"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
