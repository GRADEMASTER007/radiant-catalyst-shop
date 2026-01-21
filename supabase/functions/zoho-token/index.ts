import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAdminAuth, corsHeaders, forbiddenResponse, unauthorizedResponse } from "../_shared/auth.ts";

interface TokenRequest {
  action: "set" | "get" | "delete" | "check";
  provider: string;
  token?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only admins can manage integration tokens
    const auth = await validateAdminAuth(req);
    if (auth.error) {
      if (auth.error === "Admin access required") {
        return forbiddenResponse(auth.error);
      }
      return unauthorizedResponse(auth.error);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, provider, token }: TokenRequest = await req.json();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "set": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "Token is required for set action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Upsert the token (encrypted at rest by Supabase)
        const { error } = await supabase
          .from("integration_tokens")
          .upsert({
            user_id: auth.user!.id,
            provider,
            encrypted_token: token,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,provider",
          });

        if (error) {
          console.error("Failed to save token:", error);
          return new Response(
            JSON.stringify({ error: "Failed to save token" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Token saved securely" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        const { data, error } = await supabase
          .from("integration_tokens")
          .select("encrypted_token")
          .eq("user_id", auth.user!.id)
          .eq("provider", provider)
          .single();

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: true, token: null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, token: data.encrypted_token }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { error } = await supabase
          .from("integration_tokens")
          .delete()
          .eq("user_id", auth.user!.id)
          .eq("provider", provider);

        if (error) {
          console.error("Failed to delete token:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete token" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Token deleted" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check": {
        const { data } = await supabase
          .from("integration_tokens")
          .select("id")
          .eq("user_id", auth.user!.id)
          .eq("provider", provider)
          .single();

        return new Response(
          JSON.stringify({ success: true, connected: !!data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Token management error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
