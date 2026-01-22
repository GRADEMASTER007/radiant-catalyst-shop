import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// THIN PROXY TO AI-ORCHESTRATOR
// Routes image AI requests through the central gateway
// All provider/model logic is handled by ai-orchestrator
// ==========================================

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

  // Admin-only endpoint
  const auth = await validateAdminAuth(req);
  if (auth.error) {
    if (auth.error === "Admin access required") {
      return forbiddenResponse(auth.error);
    }
    return unauthorizedResponse(auth.error);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { type, prompt, imageUrl, context }: ImageRequest = await req.json();

    // Build the full prompt based on type
    let userPrompt = prompt;
    
    if (type === "generate_prompt" && context?.productName) {
      userPrompt = `Create an image generation prompt for: ${context.productName}
${context.category ? `Category: ${context.category}` : ""}
${context.style ? `Preferred style: ${context.style}` : "African artisan, handcrafted aesthetic"}
Additional notes: ${prompt}`;
    }

    // Route through ai-orchestrator with vision type
    const orchestratorUrl = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;
    
    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "vision",
        prompt: userPrompt,
        context: {
          ...context,
          imageUrl,
          imageRequestType: type,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please check your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(errorData.error || "Failed to process image request");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: data.content, 
        type,
        model: data.model,
        provider: data.provider,
        usage: data.usage,
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
