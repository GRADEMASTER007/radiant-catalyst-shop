import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// The single source of truth for our public site host.
// Any sitemap URL must point here, regardless of which domain a request came from.
const CANONICAL_ORIGIN = "https://purelyhealthnutra.com";

// Allowed alternate hosts that we will silently rewrite to canonical.
// Anything outside this list is rejected.
const ALLOWED_ALT_HOSTS = new Set([
  "purelyhealthnutra.com",
  "www.purelyhealthnutra.com",
  "ai-sparkle-commerce.lovable.app",
  "id-preview--ebefb83e-8360-49f6-8c2c-47ba87809fec.lovable.app",
]);

/** Resolve and validate the requested site_url, then return a clean canonical origin (no trailing slash). */
function resolveOrigin(siteUrlParam: string | null): { origin: string; warning?: string } {
  if (!siteUrlParam) return { origin: CANONICAL_ORIGIN };
  try {
    const u = new URL(siteUrlParam);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { origin: CANONICAL_ORIGIN, warning: "Non-HTTP protocol rejected" };
    }
    if (!ALLOWED_ALT_HOSTS.has(u.hostname)) {
      // Reject unknown hosts (prevents poisoning the sitemap with arbitrary domains).
      return { origin: CANONICAL_ORIGIN, warning: `Host '${u.hostname}' not in allowlist; falling back to canonical` };
    }
    // Always force https + canonical host. Strip any path/query/trailing slash.
    return { origin: CANONICAL_ORIGIN };
  } catch {
    return { origin: CANONICAL_ORIGIN, warning: "Invalid site_url" };
  }
}

/** Strip trailing slash (except root) so URLs are stable. */
const cleanPath = (p: string) => {
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const { origin: siteUrl, warning } = resolveOrigin(url.searchParams.get("site_url"));
    if (warning) console.warn("[sitemap]", warning);

    // Fetch all published content
    const [productsRes, blogRes, pagesRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("slug, updated_at, primary_image_url, name, meta_description").eq("is_active", true),
      supabase.from("blog_posts").select("slug, updated_at, featured_image_url, title, meta_description, tags, published_at").eq("is_published", true),
      supabase.from("pages").select("slug, updated_at, meta_description, title").eq("is_published", true),
      supabase.from("categories").select("slug, updated_at, name, image_url").eq("is_active", true),
    ]);

    const products = productsRes.data || [];
    const blogs = blogRes.data || [];
    const pages = pagesRes.data || [];
    const categories = categoriesRes.data || [];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/products", priority: "0.9", changefreq: "daily" },
      { loc: "/blog", priority: "0.8", changefreq: "daily" },
      { loc: "/about", priority: "0.7", changefreq: "monthly" },
      { loc: "/contact", priority: "0.6", changefreq: "monthly" },
      { loc: "/directory", priority: "0.7", changefreq: "weekly" },
      { loc: "/consultations", priority: "0.6", changefreq: "monthly" },
      { loc: "/rooting-services", priority: "0.6", changefreq: "monthly" },
      { loc: "/business-resources", priority: "0.5", changefreq: "monthly" },
      { loc: "/learn/gut-health-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/learn/fermentation-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/learn/algae-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/learn/farming-em1-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/learn/for-practitioners", priority: "0.7", changefreq: "monthly" },
    ];

    const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    /** Build a canonical absolute URL for the sitemap. */
    const abs = (path: string) => `${siteUrl}${cleanPath(path)}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${abs(page.loc)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Products
    for (const p of products) {
      xml += `  <url>
    <loc>${abs(`/product/${p.slug}`)}</loc>
    <lastmod>${new Date(p.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${p.primary_image_url ? `    <image:image>
      <image:loc>${escapeXml(p.primary_image_url)}</image:loc>
      <image:title>${escapeXml(p.name)}</image:title>
${p.meta_description ? `      <image:caption>${escapeXml(p.meta_description.substring(0, 160))}</image:caption>` : ""}
    </image:image>` : ""}
  </url>
`;
    }

    // Blog posts
    for (const b of blogs) {
      xml += `  <url>
    <loc>${abs(`/blog/${b.slug}`)}</loc>
    <lastmod>${new Date(b.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
${b.featured_image_url ? `    <image:image>
      <image:loc>${escapeXml(b.featured_image_url)}</image:loc>
      <image:title>${escapeXml(b.title)}</image:title>
    </image:image>` : ""}
  </url>
`;
    }

    // CMS pages
    for (const pg of pages) {
      xml += `  <url>
    <loc>${abs(`/page/${pg.slug}`)}</loc>
    <lastmod>${new Date(pg.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

    // Categories
    for (const c of categories) {
      xml += `  <url>
    <loc>${abs(`/products?category=${encodeURIComponent(c.slug)}`)}</loc>
    <lastmod>${new Date(c.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
${c.image_url ? `    <image:image>
      <image:loc>${escapeXml(c.image_url)}</image:loc>
      <image:title>${escapeXml(c.name)}</image:title>
    </image:image>` : ""}
  </url>
`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Sitemap-Canonical-Origin": siteUrl,
      },
    });
  } catch (error: any) {
    console.error("Sitemap error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
