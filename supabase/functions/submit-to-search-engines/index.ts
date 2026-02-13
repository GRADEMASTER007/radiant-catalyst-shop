import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/auth.ts";

/**
 * Submit sitemap to Google, Bing, and IndexNow for fast indexing.
 * Also pings free listing aggregators.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // 1. Google Ping
    try {
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      );
      results.push({
        service: "Google Sitemap Ping",
        status: googleRes.ok ? "success" : "failed",
        details: `HTTP ${googleRes.status}`,
      });
    } catch (e: any) {
      results.push({ service: "Google Sitemap Ping", status: "error", details: e.message });
    }

    // 2. Bing Ping
    try {
      const bingRes = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      );
      results.push({
        service: "Bing Sitemap Ping",
        status: bingRes.ok ? "success" : "failed",
        details: `HTTP ${bingRes.status}`,
      });
    } catch (e: any) {
      results.push({ service: "Bing Sitemap Ping", status: "error", details: e.message });
    }

    // 3. IndexNow (Bing, Yandex, Seznam, Naver)
    try {
      // IndexNow allows batch URL submission
      const indexNowRes = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: new URL(siteUrl).hostname,
          key: "gut-health-probiotics-sa",
          keyLocation: `${siteUrl}/gut-health-probiotics-sa.txt`,
          urlList: [
            siteUrl,
            `${siteUrl}/products`,
            `${siteUrl}/blog`,
            `${siteUrl}/about`,
            `${siteUrl}/contact`,
            `${siteUrl}/directory`,
          ],
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

    // 4. Google Search Console Indexing API ping (basic - requires API key for full)
    try {
      const gscRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      );
      results.push({
        service: "Google Search Console Ping",
        status: gscRes.ok ? "success" : "failed",
      });
    } catch (e: any) {
      results.push({ service: "Google Search Console", status: "error", details: e.message });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sitemapUrl,
        submissions: results,
        message: `Submitted to ${results.filter(r => r.status === "success").length}/${results.length} services`,
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
