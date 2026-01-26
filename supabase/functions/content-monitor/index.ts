import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContentAuditResult {
  type: 'product' | 'blog' | 'page';
  id: string;
  name: string;
  issues: string[];
  seoScore: number;
  hasImage: boolean;
  hasDescription: boolean;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
}

interface AuditSummary {
  totalProducts: number;
  totalBlogs: number;
  totalPages: number;
  productsWithImages: number;
  productsWithSEO: number;
  blogsWithSEO: number;
  pagesWithSEO: number;
  issues: ContentAuditResult[];
  recommendations: string[];
  lastRunAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Content Monitor] Starting daily content audit...");

    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, slug, primary_image_url, description, short_description, meta_title, meta_description, is_active")
      .eq("is_active", true);

    if (productsError) throw productsError;

    // Fetch all blog posts
    const { data: blogs, error: blogsError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, featured_image_url, content, excerpt, meta_title, meta_description, is_published")
      .eq("is_published", true);

    if (blogsError) throw blogsError;

    // Fetch all pages
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, title, slug, featured_image_url, content, meta_title, meta_description, is_published")
      .eq("is_published", true);

    if (pagesError) throw pagesError;

    const issues: ContentAuditResult[] = [];
    const recommendations: string[] = [];

    // Audit products
    let productsWithImages = 0;
    let productsWithSEO = 0;

    for (const product of products || []) {
      const productIssues: string[] = [];
      let seoScore = 0;

      const hasImage = !!product.primary_image_url;
      const hasDescription = !!(product.description || product.short_description);
      const hasMetaTitle = !!product.meta_title;
      const hasMetaDescription = !!product.meta_description;

      if (hasImage) {
        productsWithImages++;
        seoScore += 25;
      } else {
        productIssues.push("Missing product image");
      }

      if (hasDescription) seoScore += 25;
      else productIssues.push("Missing product description");

      if (hasMetaTitle) seoScore += 25;
      else productIssues.push("Missing SEO meta title");

      if (hasMetaDescription) seoScore += 25;
      else productIssues.push("Missing SEO meta description");

      if (seoScore >= 75) productsWithSEO++;

      if (productIssues.length > 0) {
        issues.push({
          type: 'product',
          id: product.id,
          name: product.name,
          issues: productIssues,
          seoScore,
          hasImage,
          hasDescription,
          hasMetaTitle,
          hasMetaDescription,
        });
      }
    }

    // Audit blog posts
    let blogsWithSEO = 0;

    for (const blog of blogs || []) {
      const blogIssues: string[] = [];
      let seoScore = 0;

      const hasImage = !!blog.featured_image_url;
      const hasDescription = !!(blog.content && blog.content.length > 100);
      const hasMetaTitle = !!blog.meta_title;
      const hasMetaDescription = !!blog.meta_description;

      if (hasImage) seoScore += 25;
      else blogIssues.push("Missing featured image");

      if (hasDescription) seoScore += 25;
      else blogIssues.push("Content too short (less than 100 chars)");

      if (hasMetaTitle) seoScore += 25;
      else blogIssues.push("Missing SEO meta title");

      if (hasMetaDescription) seoScore += 25;
      else blogIssues.push("Missing SEO meta description");

      if (seoScore >= 75) blogsWithSEO++;

      if (blogIssues.length > 0) {
        issues.push({
          type: 'blog',
          id: blog.id,
          name: blog.title,
          issues: blogIssues,
          seoScore,
          hasImage,
          hasDescription,
          hasMetaTitle,
          hasMetaDescription,
        });
      }
    }

    // Audit pages
    let pagesWithSEO = 0;

    for (const page of pages || []) {
      const pageIssues: string[] = [];
      let seoScore = 0;

      const hasImage = !!page.featured_image_url;
      const hasDescription = !!(page.content && page.content.length > 50);
      const hasMetaTitle = !!page.meta_title;
      const hasMetaDescription = !!page.meta_description;

      if (hasImage) seoScore += 25;
      // Images are optional for pages

      if (hasDescription) seoScore += 25;
      else pageIssues.push("Content too short");

      if (hasMetaTitle) seoScore += 25;
      else pageIssues.push("Missing SEO meta title");

      if (hasMetaDescription) seoScore += 25;
      else pageIssues.push("Missing SEO meta description");

      if (seoScore >= 50) pagesWithSEO++;

      if (pageIssues.length > 0) {
        issues.push({
          type: 'page',
          id: page.id,
          name: page.title,
          issues: pageIssues,
          seoScore,
          hasImage,
          hasDescription,
          hasMetaTitle,
          hasMetaDescription,
        });
      }
    }

    // Generate recommendations
    const totalProducts = products?.length || 0;
    const totalBlogs = blogs?.length || 0;
    const totalPages = pages?.length || 0;

    if (productsWithImages < totalProducts) {
      recommendations.push(`${totalProducts - productsWithImages} products are missing images. Add images to improve conversion rates.`);
    }

    if (productsWithSEO < totalProducts) {
      recommendations.push(`${totalProducts - productsWithSEO} products have incomplete SEO metadata. Complete meta titles and descriptions.`);
    }

    if (blogsWithSEO < totalBlogs) {
      recommendations.push(`${totalBlogs - blogsWithSEO} blog posts need SEO improvements.`);
    }

    if (totalBlogs < 5) {
      recommendations.push("Consider adding more blog content. Aim for at least 5 published articles for SEO.");
    }

    if (issues.length === 0) {
      recommendations.push("All content is properly optimized! Great job maintaining your site.");
    }

    const summary: AuditSummary = {
      totalProducts,
      totalBlogs,
      totalPages,
      productsWithImages,
      productsWithSEO,
      blogsWithSEO,
      pagesWithSEO,
      issues: issues.slice(0, 50), // Limit to first 50 issues
      recommendations,
      lastRunAt: new Date().toISOString(),
    };

    console.log("[Content Monitor] Audit complete:", {
      products: totalProducts,
      productsWithImages,
      productsWithSEO,
      blogs: totalBlogs,
      blogsWithSEO,
      issueCount: issues.length,
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Content Monitor] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
