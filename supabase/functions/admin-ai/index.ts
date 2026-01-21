import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  type: "product_description" | "seo_meta" | "content" | "custom";
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, prompt, context }: AIRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = prompt;

    switch (type) {
      case "product_description":
        systemPrompt = `You are an expert e-commerce copywriter specializing in African artisan products. 
Create compelling, SEO-optimized product descriptions that:
- Highlight craftsmanship and cultural significance
- Use sensory language to describe textures, colors, and materials
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
        break;

      case "seo_meta":
        systemPrompt = `You are an SEO specialist. Generate optimized meta tags following best practices:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`;
        break;

      case "content":
        systemPrompt = `You are a content marketing specialist for an African artisan e-commerce store. 
Create engaging content that:
- Celebrates African craftsmanship and culture
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy (H2, H3, etc.)
- Includes relevant internal linking suggestions
- Maintains a warm, authentic brand voice`;
        break;

      case "custom":
      default:
        systemPrompt = `You are a helpful AI assistant for an African artisan e-commerce store admin panel. 
You can help with:
- Product descriptions and content
- SEO optimization
- Marketing copy
- Customer communication
- Data analysis and insights
Be helpful, professional, and culturally aware.`;
        break;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
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
      JSON.stringify({ success: true, content, type }),
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
