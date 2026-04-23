import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, AlertTriangle, FileX, FilePlus, Loader2, Globe, Link2Off } from "lucide-react";
import { markSitemapRegenerated } from "@/components/admin/SitemapStaleAlert";

const CANONICAL_ORIGIN = "https://purelyhealthnutra.com";
const CANONICAL_HOST = "purelyhealthnutra.com";
const SITEMAP_URL = "/sitemap.xml";

type Diff = {
  inSitemapNotInDb: string[];
  inDbNotInSitemap: string[];
  matched: number;
};

type UrlIssue = { url: string; reason: string };

type AuditReport = {
  products: Diff;
  blogs: Diff;
  pages: Diff;
  totalSitemapUrls: number;
  urlIssues: UrlIssue[];
  checkedAt: string;
};

const extractLocs = (xml: string): string[] => {
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, "").trim());
};

const pathFromUrl = (url: string): string => {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/$/, "") || "/";
    return p;
  } catch {
    return url;
  }
};

const validateCanonical = (loc: string): UrlIssue | null => {
  let u: URL;
  try { u = new URL(loc); } catch {
    return { url: loc, reason: "Not a valid absolute URL" };
  }
  if (u.protocol !== "https:") return { url: loc, reason: `Protocol must be https (got '${u.protocol}')` };
  if (u.hostname !== CANONICAL_HOST) {
    return { url: loc, reason: `Host '${u.hostname}' should be '${CANONICAL_HOST}'` };
  }
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    return { url: loc, reason: "Trailing slash on non-root path" };
  }
  return null;
};

const diff = (sitemapPaths: Set<string>, dbPaths: Set<string>): Diff => {
  const stale: string[] = [];
  const missing: string[] = [];
  let matched = 0;
  sitemapPaths.forEach(p => {
    if (dbPaths.has(p)) matched++;
    else stale.push(p);
  });
  dbPaths.forEach(p => {
    if (!sitemapPaths.has(p)) missing.push(p);
  });
  return { inSitemapNotInDb: stale.sort(), inDbNotInSitemap: missing.sort(), matched };
};

export default function SitemapAudit() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(() => {
    try {
      const saved = localStorage.getItem("sitemap-audit-report");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const runAudit = useCallback(async () => {
    setLoading(true);
    try {
      const xmlRes = await fetch(SITEMAP_URL, { cache: "no-store" });
      if (!xmlRes.ok) throw new Error(`Sitemap fetch failed: ${xmlRes.status}`);
      const xml = await xmlRes.text();
      const allLocs = extractLocs(xml);

      // Canonical URL validation
      const urlIssues: UrlIssue[] = [];
      for (const loc of allLocs) {
        const issue = validateCanonical(loc);
        if (issue) urlIssues.push(issue);
      }

      const sitemapPaths = new Set(allLocs.map(pathFromUrl));
      const smProducts = new Set<string>();
      const smBlogs = new Set<string>();
      const smPages = new Set<string>();
      sitemapPaths.forEach(p => {
        if (p.startsWith("/product/")) smProducts.add(p);
        else if (p.startsWith("/blog/")) smBlogs.add(p);
        else if (p.startsWith("/page/")) smPages.add(p);
      });

      const [productsRes, blogsRes, pagesRes] = await Promise.all([
        supabase.from("products").select("slug").eq("is_active", true),
        supabase.from("blog_posts").select("slug").eq("is_published", true),
        supabase.from("pages").select("slug").eq("is_published", true),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (blogsRes.error) throw blogsRes.error;
      if (pagesRes.error) throw pagesRes.error;

      const dbProducts = new Set((productsRes.data || []).map(p => `/product/${p.slug}`));
      const dbBlogs = new Set((blogsRes.data || []).map(b => `/blog/${b.slug}`));
      const dbPages = new Set((pagesRes.data || []).map(pg => `/page/${pg.slug}`));

      const newReport: AuditReport = {
        products: diff(smProducts, dbProducts),
        blogs: diff(smBlogs, dbBlogs),
        pages: diff(smPages, dbPages),
        totalSitemapUrls: allLocs.length,
        urlIssues,
        checkedAt: new Date().toISOString(),
      };

      setReport(newReport);
      try { localStorage.setItem("sitemap-audit-report", JSON.stringify(newReport)); } catch {}

      const slugIssues =
        newReport.products.inSitemapNotInDb.length + newReport.products.inDbNotInSitemap.length +
        newReport.blogs.inSitemapNotInDb.length + newReport.blogs.inDbNotInSitemap.length +
        newReport.pages.inSitemapNotInDb.length + newReport.pages.inDbNotInSitemap.length;
      const totalIssues = slugIssues + urlIssues.length;

      if (totalIssues === 0) {
        markSitemapRegenerated();
        toast.success("Sitemap is fully canonical and in sync ✓");
      } else {
        toast.warning(
          `${slugIssues} slug mismatch${slugIssues === 1 ? "" : "es"}, ${urlIssues.length} non-canonical URL${urlIssues.length === 1 ? "" : "s"}`
        );
      }
    } catch (e: any) {
      toast.error(`Audit failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!report) runAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slugIssues = report
    ? report.products.inSitemapNotInDb.length + report.products.inDbNotInSitemap.length +
      report.blogs.inSitemapNotInDb.length + report.blogs.inDbNotInSitemap.length +
      report.pages.inSitemapNotInDb.length + report.pages.inDbNotInSitemap.length
    : 0;
  const urlIssueCount = report?.urlIssues.length ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Globe className="h-7 w-7 text-primary" />
                Sitemap Audit
              </CardTitle>
              <CardDescription>
                Diffs <code className="text-xs">/sitemap.xml</code> against the live database and enforces canonical
                origin <code className="text-xs">{CANONICAL_ORIGIN}</code>. Run before every publish.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button onClick={runAudit} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Re-run audit
              </Button>
              {report && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date(report.checkedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {report ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryStat label="Sitemap URLs" value={report.totalSitemapUrls} />
              <SummaryStat label="Slug mismatches" value={slugIssues} tone={slugIssues === 0 ? "success" : "warning"} />
              <SummaryStat label="Non-canonical URLs" value={urlIssueCount} tone={urlIssueCount === 0 ? "success" : "warning"} />
              <SummaryStat
                label="Total issues"
                value={slugIssues + urlIssueCount}
                tone={slugIssues + urlIssueCount === 0 ? "success" : "warning"}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Running first audit…</p>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <CanonicalSection issues={report.urlIssues} />
          <DiffSection title="Products" diff={report.products} />
          <DiffSection title="Blog posts" diff={report.blogs} />
          <DiffSection title="CMS pages" diff={report.pages} />
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  const color =
    tone === "success" ? "text-green-600" :
    tone === "warning" && value > 0 ? "text-yellow-600" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function CanonicalSection({ issues }: { issues: UrlIssue[] }) {
  const clean = issues.length === 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {clean ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Link2Off className="h-5 w-5 text-yellow-500" />}
            URL canonicalization
          </CardTitle>
          {!clean && <Badge variant="destructive">{issues.length} issue{issues.length === 1 ? "" : "s"}</Badge>}
        </div>
        <CardDescription>
          Every <code className="text-xs">&lt;loc&gt;</code> must use <code className="text-xs">https://</code>, host{" "}
          <code className="text-xs">{CANONICAL_HOST}</code>, and no trailing slash on non-root paths.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clean ? (
          <p className="text-sm text-muted-foreground">All sitemap URLs are canonical ✓</p>
        ) : (
          <ScrollArea className="h-56 rounded border bg-muted/30 p-2">
            <ul className="space-y-2">
              {issues.map((it, i) => (
                <li key={i} className="text-xs">
                  <code className="font-mono break-all block">{it.url}</code>
                  <span className="text-yellow-700 dark:text-yellow-400">↳ {it.reason}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function DiffSection({ title, diff }: { title: string; diff: Diff }) {
  const clean = diff.inSitemapNotInDb.length === 0 && diff.inDbNotInSitemap.length === 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {clean ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{diff.matched} matched</Badge>
            {diff.inSitemapNotInDb.length > 0 && (
              <Badge variant="destructive">{diff.inSitemapNotInDb.length} stale</Badge>
            )}
            {diff.inDbNotInSitemap.length > 0 && (
              <Badge variant="default">{diff.inDbNotInSitemap.length} missing</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {clean ? (
          <p className="text-sm text-muted-foreground">No mismatches.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiffList
              icon={<FileX className="h-4 w-4 text-destructive" />}
              title="In sitemap but NOT in database (stale)"
              items={diff.inSitemapNotInDb}
              hint="Remove from sitemap — these URLs return soft-404s."
            />
            <DiffList
              icon={<FilePlus className="h-4 w-4 text-primary" />}
              title="In database but NOT in sitemap (missing)"
              items={diff.inDbNotInSitemap}
              hint="Add to sitemap so search engines can discover them."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiffList({ icon, title, items, hint }: { icon: React.ReactNode; title: string; items: string[]; hint: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded border bg-muted/20 p-3">
        <p className="text-xs font-medium flex items-center gap-2">{icon}{title}</p>
        <p className="text-xs text-muted-foreground mt-2">None ✓</p>
      </div>
    );
  }
  return (
    <div className="rounded border p-3">
      <p className="text-xs font-medium flex items-center gap-2">{icon}{title} ({items.length})</p>
      <p className="text-xs text-muted-foreground mt-1 mb-2">{hint}</p>
      <ScrollArea className="h-48 rounded bg-muted/30 p-2">
        <ul className="space-y-1">
          {items.map(p => (
            <li key={p} className="text-xs font-mono break-all">
              <a href={`${CANONICAL_ORIGIN}${p}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {p}
              </a>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
