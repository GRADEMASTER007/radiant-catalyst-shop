import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Submit sitemap/URLs to Google Indexing API, IndexNow, and Bing Webmaster API.
 * Google's ping endpoint and Bing's ping endpoint are both deprecated.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { siteUrl } = await req.json();

    if (!siteUrl) {
      return new Response(
        JSON.stringify({ error: "siteUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const sitemapUrl = `${SUPABASE_URL}/functions/v1/sitemap?site_url=${encodeURIComponent(siteUrl)}`;

    const results: { service: string; status: string; details?: string }[] = [];

    // Key URLs to submit
    const urlsToSubmit = [
      siteUrl,
      `${siteUrl}/products`,
      `${siteUrl}/blog`,
      `${siteUrl}/about`,
      `${siteUrl}/contact`,
      `${siteUrl}/directory`,
      `${siteUrl}/learn/gut-health-guide`,
      `${siteUrl}/learn/fermentation-guide`,
      `${siteUrl}/learn/algae-guide`,
      `${siteUrl}/learn/farming-em1-guide`,
    ];

    // 1. Google — no public ping endpoint exists anymore (deprecated 2023).
    // Users must submit sitemaps via Google Search Console manually.
    results.push({
      service: "Google Search Console",
      status: "manual",
      details: `Google's ping endpoint is deprecated. Submit your sitemap in Google Search Console: ${sitemapUrl}`,
    });

    // 2. IndexNow (covers Bing, Yandex, Seznam, Naver — the modern standard)
    try {
      const indexNowRes = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: new URL(siteUrl).hostname,
          key: "gut-health-probiotics-sa",
          keyLocation: `${siteUrl}/gut-health-probiotics-sa.txt`,
          urlList: urlsToSubmit,
        }),
      });
      results.push({
        service: "IndexNow (Bing, Yandex, Seznam, Naver)",
        status: indexNowRes.ok || indexNowRes.status === 202 ? "success" : "failed",
        details: `HTTP ${indexNowRes.status}`,
      });
    } catch (e: any) {
      results.push({ service: "IndexNow", status: "error", details: e.message });
    }

    // 3. Bing Webmaster URL Submission API (if API key available)
    const bingApiKey = Deno.env.get("BING_WEBMASTER_API_KEY");
    if (bingApiKey) {
      try {
        const bingRes = await fetch(
          `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${bingApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteUrl: siteUrl,
              urlList: urlsToSubmit.slice(0, 10), // Bing limits batch size
            }),
          }
        );
        results.push({
          service: "Bing Webmaster URL Submission API",
          status: bingRes.ok ? "success" : "failed",
          details: `HTTP ${bingRes.status}`,
        });
      } catch (e: any) {
        results.push({ service: "Bing Webmaster API", status: "error", details: e.message });
      }
    } else {
      results.push({
        service: "Bing Webmaster URL Submission API",
        status: "skipped",
        details: "No BING_WEBMASTER_API_KEY configured — IndexNow covers Bing",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sitemapUrl,
        submissions: results,
        message: `Submitted to ${results.filter(r => r.status === "success").length}/${results.length} services`,
        tip: "For Google, submit your sitemap URL in Google Search Console for best results.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Search engine submission error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
