import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kilo.AI FREE Models
const KILO_MODELS = {
  coder: "qwen/qwen3-coder",
  reasoning: "deepseek/deepseek-r1-0528:free",
  agent: "moonshotai/kimi-k2:free",
  fast: "zhipu-ai/glm-4.5-air:free",
};

const KILO_API_URL = "https://api.kilo.ai/v1/chat/completions";

interface AIRequest {
  type: "product_description" | "seo_meta" | "content" | "custom" | "code_review";
  prompt: string;
  context?: {
    productName?: string;
    category?: string;
    keywords?: string[];
    existingDescription?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try Kilo.AI first, then fallback to OpenRouter
    const KILO_API_KEY = Deno.env.get("KILO_CODE_JWT");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    
    if (!KILO_API_KEY && !OPENROUTER_API_KEY) {
      throw new Error("No AI API key configured (KILO_CODE_JWT or OPENROUTER_API_KEY)");
    }

    const { type, prompt, context }: AIRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = prompt;
    let model = KILO_MODELS.fast;

    switch (type) {
      case "product_description":
        systemPrompt = `You are an expert e-commerce copywriter specializing in dragon fruit and agricultural products. 
Create compelling, SEO-optimized product descriptions that:
- Highlight the unique qualities and growing characteristics
- Use sensory language to describe the fruit's appearance and taste
- Include relevant keywords naturally
- Create urgency and desire
- Keep descriptions between 150-300 words
- Format with short paragraphs for readability`;
        
        if (context?.productName) {
          userPrompt = `Create a compelling product description for "${context.productName}"${context.category ? ` in the ${context.category} category` : ""}.
${context.keywords?.length ? `Include these keywords naturally: ${context.keywords.join(", ")}` : ""}
${context.existingDescription ? `Improve upon this existing description: ${context.existingDescription}` : ""}
Additional context: ${prompt}`;
        }
        model = KILO_MODELS.fast;
        break;

      case "seo_meta":
        systemPrompt = `You are an SEO specialist for Dragon Fruit Farming Africa. Generate optimized meta tags following best practices:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`;
        model = KILO_MODELS.fast;
        break;

      case "content":
        systemPrompt = `You are a content marketing specialist for Dragon Fruit Farming Africa. 
Create engaging content that:
- Celebrates dragon fruit cultivation and South African farming
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy (H2, H3, etc.)
- Includes relevant internal linking suggestions
- Maintains a professional, helpful brand voice`;
        model = KILO_MODELS.fast;
        break;

      case "code_review":
        systemPrompt = `You are a senior software engineer specializing in code review, security auditing, and performance optimization.
Analyze the provided code for:
- Security vulnerabilities
- Performance bottlenecks
- Best practices violations
- Bug potential
Provide actionable feedback with specific line references.`;
        model = KILO_MODELS.coder;
        break;

      case "custom":
      default:
        systemPrompt = `You are a helpful AI assistant for the Dragon Fruit Farming Africa admin panel. 
You can help with:
- Product descriptions and content
- SEO optimization
- Marketing copy
- Customer communication
- Data analysis and insights
Be helpful, professional, and knowledgeable about dragon fruit farming.`;
        model = KILO_MODELS.fast;
        break;
    }

    // Use Kilo.AI if available, otherwise fallback to OpenRouter
    const apiUrl = KILO_API_KEY ? KILO_API_URL : "https://openrouter.ai/api/v1/chat/completions";
    const apiKey = KILO_API_KEY || OPENROUTER_API_KEY;
    const actualModel = KILO_API_KEY ? model : "nousresearch/hermes-3-405b";

    console.log(`Using ${KILO_API_KEY ? "Kilo.AI" : "OpenRouter"} model: ${actualModel}`);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (!KILO_API_KEY) {
      headers["HTTP-Referer"] = "https://african-vibe.lovable.app";
      headers["X-Title"] = "African Vibe E-commerce";
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: actualModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate AI response");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ success: true, content, type, model: actualModel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Admin AI error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
