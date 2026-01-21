import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Vision model for image analysis and generation prompts
const VISION_MODEL = "qwen/qwen2.5-vl-7b-instruct";

interface ImageRequest {
  type: "analyze" | "describe" | "generate_prompt";
  prompt: string;
  imageUrl?: string;
  context?: {
    productName?: string;
    category?: string;
    style?: string;
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

    const { type, prompt, imageUrl, context }: ImageRequest = await req.json();

    let systemPrompt = "";
    let userPrompt = prompt;

    switch (type) {
      case "analyze":
        systemPrompt = `You are an expert image analyst. Analyze the provided image in detail, describing:
- Main subject and composition
- Colors, textures, and materials
- Style and aesthetic
- Potential use cases for e-commerce
Provide your analysis in a structured format.`;
        break;

      case "describe":
        systemPrompt = `You are a product photographer's assistant. Create detailed visual descriptions for product images that would help with:
- Alt text for accessibility
- SEO optimization
- Marketing materials
Keep descriptions accurate, engaging, and under 200 words.`;
        break;

      case "generate_prompt":
        systemPrompt = `You are an expert at creating prompts for AI image generators.
Given the product details, create a detailed prompt that would generate a stunning product image suitable for e-commerce.
Include specifics about:
- Lighting (studio, natural, dramatic)
- Background (clean white, lifestyle, contextual)
- Angle and composition
- Style (professional, artisan, rustic)
- Any props or context elements

Return ONLY the prompt text, no explanations.`;
        
        if (context?.productName) {
          userPrompt = `Create an image generation prompt for: ${context.productName}
${context.category ? `Category: ${context.category}` : ""}
${context.style ? `Preferred style: ${context.style}` : "African artisan, handcrafted aesthetic"}
Additional notes: ${prompt}`;
        }
        break;

      default:
        systemPrompt = "You are a helpful assistant for image-related tasks.";
    }

    // Build messages
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add image if provided
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    console.log(`Using OpenRouter vision model: ${VISION_MODEL}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://african-vibe.lovable.app",
        "X-Title": "African Vibe E-commerce",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
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
      console.error("OpenRouter vision error:", response.status, errorText);
      throw new Error("Failed to process image request");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        content, 
        type,
        model: VISION_MODEL,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI Image error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
