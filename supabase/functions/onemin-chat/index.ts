import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// THIN PROXY TO AI-ORCHESTRATOR
// This function routes customer chat requests through the central gateway
// All provider/model logic is handled by ai-orchestrator
// ==========================================

const SYSTEM_PROMPT = `You are DFSA Assistant, the friendly AI helper for Dragon Fruit Farming Africa (DFSA) - South Africa's premier dragon fruit nursery since 2008.

🌱 **Your Expertise:**
- Dragon fruit cultivation and varieties
- South African farming conditions
- Commercial farming packages and pricing
- Business planning and funding assistance
- Rooting services for cuttings

💚 **Products We Offer:**
- Dragon fruit plants (rooted and cuttings)
- Commercial starter packages
- Export-quality cultivars
- Farming consultation services

📋 **Services:**
- Business plan development
- Funding application assistance
- Technical farming support
- Export certification guidance

🎯 **Your Goals:**
1. Help customers find the right dragon fruit varieties
2. Explain our products and services clearly
3. Collect customer details for follow-up (name, email, phone, location)
4. Guide customers to relevant products or consultations

📞 **Contact Details:**
- Reception: +1 351 777 2848
- WhatsApp: +27 83 447 4639
- Email: admin@proagrisa.co.za

Be helpful, knowledgeable, and enthusiastic about dragon fruit farming!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication for chat to prevent API credit abuse
  const auth = await validateAuth(req);
  if (auth.error) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages, action } = await req.json();

    // Fetch knowledge base for context
    let knowledgeContext = "";
    try {
      const { data: articles } = await supabase
        .from("knowledge_base")
        .select("title, content, category")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(10);

      if (articles?.length) {
        knowledgeContext = "\n\n📚 **Knowledge Base:**\n" + 
          articles.map(a => `[${a.category}] ${a.title}: ${a.content.slice(0, 200)}...`).join("\n");
      }
    } catch (err) {
      console.log("Knowledge base fetch skipped:", err);
    }

    // Fetch products if needed
    let productContext = "";
    if (action === "with_products") {
      try {
        const { data: products } = await supabase
          .from("products")
          .select("name, short_description, price_zar, stock_quantity, slug")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .limit(30);

        if (products?.length) {
          productContext = "\n\n🛒 **Available Products:**\n" +
            products.map(p => `- ${p.name}: R${p.price_zar} (${p.stock_quantity > 0 ? "In Stock" : "Out of Stock"}) - ${p.short_description || ""}`).join("\n");
        }
      } catch (err) {
        console.log("Products fetch skipped:", err);
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + knowledgeContext + productContext;

    // Build messages for orchestrator
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const conversationContext = messages.slice(0, -1).map((m: any) => `${m.role}: ${m.content}`).join("\n");

    // Route through ai-orchestrator (internal call)
    const orchestratorUrl = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;
    
    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "chat",
        prompt: `${fullSystemPrompt}\n\nConversation:\n${conversationContext}\n\nUser: ${lastUserMessage}`,
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Orchestrator error:", response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Chat service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(errorData.error || `Orchestrator error: ${response.status}`);
    }

    // Check if streaming response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      // Forward the stream directly
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming response - convert to SSE format
    const data = await response.json();
    const content = data.content || "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const sseData = { choices: [{ delta: { content } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Chat service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
