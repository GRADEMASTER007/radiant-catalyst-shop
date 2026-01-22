import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

// ==========================================
// THIN PROXY TO AI-ORCHESTRATOR
// Routes code audit requests through the central gateway
// All provider/model logic is handled by ai-orchestrator
// ==========================================

interface AuditRequest {
  type: "security" | "performance" | "best-practices" | "full" | "deployment-check";
  code?: string;
  context?: string;
  files?: Array<{ path: string; content: string }>;
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

    const { type, code, context, files }: AuditRequest = await req.json();

    // Build user prompt based on audit type
    let userPrompt = "";
    
    if (files && files.length > 0) {
      userPrompt = `Please audit the following files for ${type} issues:\n\n`;
      files.forEach((file) => {
        userPrompt += `--- ${file.path} ---\n${file.content}\n\n`;
      });
    } else if (code) {
      userPrompt = `Please audit the following code for ${type} issues:\n\n${code}`;
    } else {
      userPrompt = context || "Please provide a general audit checklist for a React/Supabase e-commerce application.";
    }

    if (context && (code || files)) {
      userPrompt += `\n\nAdditional context: ${context}`;
    }

    // Route through ai-orchestrator with audit type
    const orchestratorUrl = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;
    
    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: "audit",
        prompt: userPrompt,
        context: { auditType: type },
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
      throw new Error(errorData.error || `Orchestrator error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content || "";

    // Try to parse as JSON
    let auditResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        auditResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        auditResult = { rawResponse: content };
      }
    } catch {
      auditResult = { rawResponse: content };
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        model: data.model,
        provider: data.provider,
        audit: auditResult,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Code audit error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Audit failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
