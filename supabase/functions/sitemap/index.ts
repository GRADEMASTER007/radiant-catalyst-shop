import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// === Canonical URL policy ===
// All sitemap entries are normalized to this origin regardless of which host
// served the request (e.g. business-specific domains, www variants, http).
const CANONICAL_ORIGIN = "https://purelyhealthnutra.com";

// Hosts we still accept inbound requests from (for logging/debug only).
// We never emit URLs with these hosts in the sitemap.
const ALLOWED_ALT_HOSTS = new Set<string>([
  "purelyhealthnutra.com",
  "www.purelyhealthnutra.com",
  "ai-sparkle-commerce.lovable.app",
  "id-preview--ebefb83e-8360-49f6-8c2c-47ba87809fec.lovable.app",
]);

/** Normalize a path to the canonical form: leading slash, no trailing slash (except root). */
function normalizePath(path: string): string {
  if (!path) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = "/" + p;
  // Collapse duplicate slashes
  p = p.replace(/\/{2,}/g, "/");
  // Strip trailing slash on non-root paths
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/** Build a fully canonical absolute URL from a path. */
function canonicalUrl(path: string): string {
  return `${CANONICAL_ORIGIN}${normalizePath(path)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log if the inbound host is non-canonical so admins can audit alt-domain traffic.
    try {
      const inbound = new URL(req.url);
      if (inbound.hostname && !ALLOWED_ALT_HOSTS.has(inbound.hostname)) {
        console.log(`[sitemap] Inbound from non-allowlisted host: ${inbound.hostname}`);
      }
    } catch {/* ignore */}

    // Ignore any caller-provided site_url — sitemaps are ALWAYS canonical.
    // (Previously this honored ?site_url=... which allowed serving non-canonical URLs.)

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

    const escapeXml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    for (const page of staticPages) {
      xml += `  <url>
    <loc>${canonicalUrl(page.loc)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    for (const p of products) {
      xml += `  <url>
    <loc>${canonicalUrl(`/product/${p.slug}`)}</loc>
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

    for (const b of blogs) {
      xml += `  <url>
    <loc>${canonicalUrl(`/blog/${b.slug}`)}</loc>
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

    for (const pg of pages) {
      xml += `  <url>
    <loc>${canonicalUrl(`/page/${pg.slug}`)}</loc>
    <lastmod>${new Date(pg.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

    for (const c of categories) {
      // URL-encode the slug since it appears in a query string.
      const encoded = encodeURIComponent(c.slug);
      xml += `  <url>
    <loc>${canonicalUrl(`/products`)}?category=${encoded}</loc>
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
        // Hint to crawlers that this resource is canonical.
        "Link": `<${CANONICAL_ORIGIN}/sitemap.xml>; rel="canonical"`,
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
