import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// THIN PROXY TO AI-ORCHESTRATOR
// Routes admin AI requests through the central gateway
// All provider/model logic is handled by ai-orchestrator
// ==========================================

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

    const { type, prompt, context }: AIRequest = await req.json();

    // Build full prompt with context
    let userPrompt = prompt;
    if (context?.productName && type === "product_description") {
      userPrompt = `Create a compelling product description for "${context.productName}"${context.category ? ` in the ${context.category} category` : ""}.
${context.keywords?.length ? `Include these keywords naturally: ${context.keywords.join(", ")}` : ""}
${context.existingDescription ? `Improve upon this existing description: ${context.existingDescription}` : ""}
Additional context: ${prompt}`;
    }

    // Route through ai-orchestrator
    const orchestratorUrl = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;
    
    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: type === "code_review" ? "audit" : type === "custom" ? "content" : type,
        prompt: userPrompt,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
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
      throw new Error(errorData.error || "Failed to generate AI response");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: data.content, 
        type, 
        model: data.model,
        provider: data.provider,
      }),
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
