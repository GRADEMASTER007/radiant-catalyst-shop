import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://purelyhealthnutra.com";
const GSC_SITE = "https://purelyhealthnutra.com/";

const HUB_PATHS = [
  "/",
  "/learn/gut-health-guide",
  "/learn/fermentation-guide",
  "/learn/algae-guide",
  "/learn/farming-em1-guide",
  "/hub/natural-probiotics",
];

async function inspectUrl(
  inspectionUrl: string,
  lovableKey: string,
  gscKey: string,
) {
  try {
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gscKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl: GSC_SITE,
        }),
      },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: body };
    }
    const ir = body?.inspectionResult?.indexStatusResult ?? {};
    return {
      ok: true,
      verdict: ir.verdict ?? "UNKNOWN",
      coverageState: ir.coverageState ?? null,
      lastCrawlTime: ir.lastCrawlTime ?? null,
      googleCanonical: ir.googleCanonical ?? null,
      userCanonical: ir.userCanonical ?? null,
      indexingState: ir.indexingState ?? null,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pick top 4 most-recently-updated active products
    const { data: products } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(4);

    const productPaths = (products ?? []).map((p) => `/product/${p.slug}`);
    const paths = [...HUB_PATHS, ...productPaths].slice(0, 10);
    const urls = paths.map((p) => (p === "/" ? SITE : `${SITE}${p}`));

    // 1) IndexNow — instant ping to Bing/Yandex/etc.
    let indexNow: any = { status: "skipped" };
    try {
      const r = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: "purelyhealthnutra.com",
          key: "gut-health-probiotics-sa",
          keyLocation: `${SITE}/gut-health-probiotics-sa.txt`,
          urlList: urls,
        }),
      });
      indexNow = { status: r.ok || r.status === 202 ? "success" : "failed", http: r.status };
    } catch (e) {
      indexNow = { status: "error", error: String(e) };
    }

    // 2) GSC URL Inspection — read current status & expose deep link for manual "Request Indexing"
    const inspections: any[] = [];
    if (LOVABLE_API_KEY && GSC_KEY) {
      for (const u of urls) {
        const result = await inspectUrl(u, LOVABLE_API_KEY, GSC_KEY);
        inspections.push({
          url: u,
          ...result,
          inspectionDeepLink:
            `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(GSC_SITE)}&id=${encodeURIComponent(u)}`,
        });
      }
    } else {
      for (const u of urls) {
        inspections.push({
          url: u,
          ok: false,
          error: "GSC connector not linked",
          inspectionDeepLink:
            `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(GSC_SITE)}&id=${encodeURIComponent(u)}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        urls,
        indexNow,
        inspections,
        note: "Google's Indexing API does not accept regular content URLs. After running this, open each inspectionDeepLink and click 'Request Indexing' (manual, ~10 URLs/day quota).",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
