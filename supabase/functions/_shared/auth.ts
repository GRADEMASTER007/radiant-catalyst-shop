import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export { corsHeaders };

export interface AuthResult {
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
  error: string | null;
  // deno-lint-ignore no-explicit-any
  supabaseClient: SupabaseClient<any> | null;
}

/**
 * Validates the Authorization header and returns user info.
 * Use this for endpoints that require any authenticated user.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { user: null, isAdmin: false, error: "Server configuration error", supabaseClient: null };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, isAdmin: false, error: "Missing or invalid Authorization header", supabaseClient: null };
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return { user: null, isAdmin: false, error: "Invalid or expired token", supabaseClient: null };
  }

  return { user, isAdmin: false, error: null, supabaseClient };
}

/**
 * Validates the Authorization header and checks for admin role.
 * Use this for admin-only endpoints.
 */
export async function validateAdminAuth(req: Request): Promise<AuthResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return { user: null, isAdmin: false, error: "Server configuration error", supabaseClient: null };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, isAdmin: false, error: "Missing or invalid Authorization header", supabaseClient: null };
  }

  // First validate the user token
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return { user: null, isAdmin: false, error: "Invalid or expired token", supabaseClient: null };
  }

  // Use service role to check admin status (bypasses RLS)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: roleData, error: roleError } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (roleError || !roleData) {
    return { user, isAdmin: false, error: "Admin access required", supabaseClient };
  }

  return { user, isAdmin: true, error: null, supabaseClient };
}

/**
 * Returns an unauthorized response with CORS headers
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Returns a forbidden response with CORS headers
 */
export function forbiddenResponse(message: string = "Access denied"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
