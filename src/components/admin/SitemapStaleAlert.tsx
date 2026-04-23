import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sitemap-last-regenerated-at";
const DISMISS_KEY = "sitemap-stale-dismissed-until";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

type Change = { table: string; slug: string; updated_at: string };

export function getLastSitemapRegenAt(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function markSitemapRegenerated() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  localStorage.removeItem(DISMISS_KEY);
}

export function SitemapStaleAlert() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const checkStale = async () => {
    // Honor temporary dismissal
    const dismissUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissUntil && new Date(dismissUntil) > new Date()) {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    const lastRegen = getLastSitemapRegenAt();
    // If never regenerated, use a generous lookback so we don't false-alarm on legacy rows
    const since = lastRegen ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [products, blogs, pages] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_active", true)
        .gt("updated_at", since)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("is_published", true)
        .gt("updated_at", since)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("pages")
        .select("slug, updated_at")
        .eq("is_published", true)
        .gt("updated_at", since)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);

    const all: Change[] = [
      ...(products.data || []).map((r) => ({ table: "product", slug: r.slug, updated_at: r.updated_at })),
      ...(blogs.data || []).map((r) => ({ table: "blog", slug: r.slug, updated_at: r.updated_at })),
      ...(pages.data || []).map((r) => ({ table: "page", slug: r.slug, updated_at: r.updated_at })),
    ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    setChanges(all);
  };

  useEffect(() => {
    checkStale();
    const interval = setInterval(checkStale, POLL_INTERVAL_MS);
    const onFocus = () => checkStale();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (dismissed || changes.length === 0) return null;

  const handleDismiss = () => {
    // Snooze 24h
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(DISMISS_KEY, until);
    setDismissed(true);
  };

  const lastRegen = getLastSitemapRegenAt();
  const preview = changes.slice(0, 3).map((c) => `${c.table}/${c.slug}`).join(", ");
  const more = changes.length > 3 ? ` +${changes.length - 3} more` : "";

  return (
    <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4 mb-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          Sitemap is out of date — {changes.length} slug{changes.length === 1 ? "" : "s"} changed since {lastRegen ? "last regeneration" : "the last 7 days"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {preview}{more}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {lastRegen ? `Last regenerated: ${new Date(lastRegen).toLocaleString()}` : "No regeneration recorded yet."}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button asChild size="sm" variant="default">
            <Link to="/admin/sitemap-audit" className="gap-1">
              Open Sitemap Audit <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Snooze 24h
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
