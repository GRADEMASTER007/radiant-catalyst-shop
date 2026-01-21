import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1min.AI API Configuration
const ONEMIN_API_URL = "https://api.1min.ai/api/features";
const ONEMIN_STREAMING_URL = "https://api.1min.ai/api/features?isStreaming=true";
const DEFAULT_MODEL = "gpt-4o-mini";

// Available 1min.AI models for chat
const AVAILABLE_MODELS = {
  // OpenAI Models
  "gpt-4o-mini": "GPT-4o Mini - OpenAI",
  "gpt-4o": "GPT-4o - OpenAI",
  "gpt-4-turbo": "GPT-4 Turbo - OpenAI",
  "gpt-3.5-turbo": "GPT-3.5 - OpenAI",
  "gpt-5": "GPT-5 - OpenAI",
  "gpt-5-mini": "GPT-5 Mini - OpenAI",
  "gpt-5-nano": "GPT-5 Nano - OpenAI",
  // Anthropic Models
  "claude-sonnet-4-20250514": "Claude 4 Sonnet - Anthropic",
  "claude-haiku-4-5-20251001": "Claude 4.5 Haiku - Anthropic",
  // Google Models
  "gemini-2.5-pro": "Gemini 2.5 Pro - GoogleAI",
  "gemini-2.5-flash": "Gemini 2.5 Flash - GoogleAI",
  "gemini-3-pro-preview": "Gemini 3 Pro - GoogleAI",
  // DeepSeek Models
  "deepseek-chat": "DeepSeek V3.2 Chat",
  "deepseek-reasoner": "DeepSeek V3.2 Reasoner",
  // Mistral Models
  "mistral-large-latest": "Mistral Large 2 - MistralAI",
  "mistral-small-latest": "Mistral Small - MistralAI",
  // xAI Models
  "grok-3": "Grok 3 - xAI",
  "grok-3-mini": "Grok 3 Mini - xAI",
  // Meta Models
  "meta/meta-llama-3.1-405b-instruct": "LLaMA 3.1 405b - MetaAI",
  "meta/llama-4-maverick-instruct": "LLaMA 4 Maverick - MetaAI",
};

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

// Fetch chat configuration from database
async function getChatConfig(supabase: any): Promise<{ model: string; isActive: boolean }> {
  try {
    const { data, error } = await supabase
      .from("chat_provider_config")
      .select("selected_model, is_active")
      .eq("provider_name", "1min.ai")
      .single();

    if (error || !data) {
      console.log("No chat config found, using defaults");
      return { model: DEFAULT_MODEL, isActive: true };
    }

    return { 
      model: data.selected_model || DEFAULT_MODEL, 
      isActive: data.is_active ?? true 
    };
  } catch (err) {
    console.error("Error fetching chat config:", err);
    return { model: DEFAULT_MODEL, isActive: true };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONEMIN_API_KEY = Deno.env.get("ONEMIN_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ONEMIN_API_KEY) {
      console.error("ONEMIN_AI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Chat service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get chat configuration
    const { model, isActive } = await getChatConfig(supabase);
    
    if (!isActive) {
      return new Response(
        JSON.stringify({ error: "Chat is currently disabled. Please contact us directly." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Build conversation history for 1min.AI format
    const conversationHistory = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // Get the last user message as the prompt
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    console.log(`1min.AI Chat using model: ${model}`);

    // Call 1min.AI Streaming API
    const response = await fetch(ONEMIN_STREAMING_URL, {
      method: "POST",
      headers: {
        "API-KEY": ONEMIN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CHAT_WITH_AI",
        model: model,
        promptObject: {
          prompt: `${fullSystemPrompt}\n\nConversation:\n${conversationHistory.slice(0, -1).map((m: any) => `${m.role}: ${m.content}`).join("\n")}\n\nUser: ${lastUserMessage}`,
          isMixed: false,
          webSearch: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("1min.AI error:", response.status, errorText);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chat authentication failed. Please contact support." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Chat service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`1min.AI API error: ${response.status}`);
    }

    // Stream the response back to the client
    // 1min.AI returns plain text for streaming, we need to convert to SSE format
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error("No response body from 1min.AI");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            const text = decoder.decode(value, { stream: true });
            
            // Convert 1min.AI streaming response to SSE format compatible with client
            const sseData = {
              choices: [{
                delta: { content: text }
              }]
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
      cancel() {
        reader.cancel();
      }
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
    console.error("1min.AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Chat service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
