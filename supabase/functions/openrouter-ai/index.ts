import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenRouter FREE models as specified
const MODELS = {
  // For CODING, LOGIC, DATABASES, APIs, PAYFAST, YOCO, AUTH, UI CODE, TEXT, CONTENT
  text: "nousresearch/hermes-3-405b",
  // For CODE REVIEW, SECURITY, PERFORMANCE, BUG CHECKING, FINAL AUDIT
  review: "meta-llama/llama-3.1-405b-instruct",
  // For IMAGES (vision capabilities)
  vision: "qwen/qwen2.5-vl-7b-instruct",
};

interface AIRequest {
  type: "product_description" | "seo_meta" | "content" | "custom" | "code_review" | "vision";
  prompt: string;
  context?: {
    productName?: string;
    category?: string;
    keywords?: string[];
    existingDescription?: string;
    imageUrl?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { type, prompt, context }: AIRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = prompt;
    let model = MODELS.text;

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
        model = MODELS.text;
        break;

      case "seo_meta":
        systemPrompt = `You are an SEO specialist. Generate optimized meta tags following best practices:
- Title: Under 60 characters, include main keyword
- Description: Under 160 characters, compelling call-to-action
- Keywords: 5-10 relevant terms
Return as JSON: { "title": "", "description": "", "keywords": [] }`;
        model = MODELS.text;
        break;

      case "content":
        systemPrompt = `You are a content marketing specialist for an African artisan e-commerce store. 
Create engaging content that:
- Celebrates African craftsmanship and culture
- Is SEO-friendly and well-structured
- Uses proper heading hierarchy (H2, H3, etc.)
- Includes relevant internal linking suggestions
- Maintains a warm, authentic brand voice`;
        model = MODELS.text;
        break;

      case "code_review":
        systemPrompt = `You are a senior software engineer specializing in code review, security auditing, and performance optimization.
Analyze the provided code for:
- Security vulnerabilities
- Performance bottlenecks
- Best practices violations
- Bug potential
Provide actionable feedback with specific line references.`;
        model = MODELS.review;
        break;

      case "vision":
        systemPrompt = `You are an AI assistant that analyzes images and provides detailed descriptions.
Focus on visual elements, composition, colors, and any text visible in the image.`;
        model = MODELS.vision;
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
        model = MODELS.text;
        break;
    }

    // Build messages array
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt },
    ];

    // Handle vision requests with images
    if (type === "vision" && context?.imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: context.imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    console.log(`Using OpenRouter model: ${model}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://african-vibe.lovable.app",
        "X-Title": "African Vibe E-commerce",
      },
      body: JSON.stringify({
        model,
        messages,
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
          JSON.stringify({ error: "API credits exhausted. Please check your OpenRouter account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      throw new Error("Failed to generate AI response");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        content, 
        type,
        model,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("OpenRouter AI error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
