import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentCreationResult {
  success: boolean;
  type: "page" | "blog" | "menu";
  id?: string;
  slug?: string;
  title?: string;
  message: string;
  viewUrl?: string;
  editUrl?: string;
}

/**
 * Create a blog post via z.ai
 */
export async function createBlogFromAI(topic: string, keywords?: string[]): Promise<ContentCreationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('zai-blog', {
      body: { topic, keywords, autoSave: true },
    });

    if (error) throw error;

    return {
      success: true,
      type: "blog",
      id: data.post_id,
      slug: data.slug,
      title: data.title,
      message: `Blog post "${data.title}" created as draft!`,
      viewUrl: `/blog/${data.slug}`,
      editUrl: `/admin/blog-posts`,
    };
  } catch (error: any) {
    console.error("Create blog error:", error);
    return {
      success: false,
      type: "blog",
      message: error.message || "Failed to create blog post",
    };
  }
}

/**
 * Create a page via z.ai
 */
export async function createPageFromAI(prompt: string): Promise<ContentCreationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('zai-page', {
      body: { prompt },
    });

    if (error) throw error;

    return {
      success: true,
      type: "page",
      id: data.page_id,
      slug: data.slug,
      title: data.title,
      message: `Page "${data.title}" created and added to navigation!`,
      viewUrl: data.view_url,
      editUrl: `/admin/pages`,
    };
  } catch (error: any) {
    console.error("Create page error:", error);
    return {
      success: false,
      type: "page",
      message: error.message || "Failed to create page",
    };
  }
}

/**
 * Add menu item
 */
export async function createMenuItemFromAI(label: string, url?: string): Promise<ContentCreationResult> {
  try {
    const slug = label.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 100);
    const finalUrl = url || `/${slug}`;

    // Add to header menu
    const { data: menus } = await supabase
      .from("menus")
      .select("*")
      .eq("location", "header")
      .single();

    if (menus) {
      const items = Array.isArray(menus.items) ? menus.items : [];
      if (!items.some((item: any) => item.url === finalUrl)) {
        items.push({ label, url: finalUrl, order: items.length });
        await supabase.from("menus").update({ items }).eq("id", menus.id);
      }
    } else {
      await supabase.from("menus").insert({
        name: "Main Navigation",
        location: "header",
        is_active: true,
        items: [{ label, url: finalUrl, order: 0 }],
      });
    }

    return {
      success: true,
      type: "menu",
      title: label,
      message: `Menu item "${label}" added to navigation!`,
      editUrl: `/admin/menus`,
    };
  } catch (error: any) {
    console.error("Create menu item error:", error);
    return {
      success: false,
      type: "menu",
      message: error.message || "Failed to add menu item",
    };
  }
}
