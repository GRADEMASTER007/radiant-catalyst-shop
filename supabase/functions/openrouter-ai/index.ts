import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuthOrService, unauthorizedResponse } from "../_shared/auth.ts";

// REDIRECT: Routes to ai-orchestrator (z.ai)
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const auth = await validateAuthOrService(req);
  if (auth.error) return unauthorizedResponse(auth.error);
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const body = await req.json();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ type: body.type || "content_generation", prompt: body.prompt, context: body.context }),
    });
    const data = await response.text();
    return new Response(data, { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
