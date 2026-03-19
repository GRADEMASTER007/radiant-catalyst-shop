import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Search,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  FileText,
  Tag,
  Globe,
  Loader2,
  Sparkles,
  Send,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
} from "lucide-react";

interface ProductAudit {
  id: string;
  name: string;
  meta_title: string | null;
  meta_title_length: number;
  meta_description: string | null;
  meta_description_length: number;
  tags_count: number;
  issues: string[];
  score: number;
}

interface AuditSummary {
  total: number;
  avgScore: number;
  needsOptimization: number;
  optimized: number;
}

interface KeywordResearch {
  relatedKeywords: string[];
  questions: string[];
  competitorTitles: string[];
  competitorSnippets: string[];
}

const SITE_URL = "https://purelyhealthnutra.com";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const SEOManager = () => {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [keywordData, setKeywordData] = useState<KeywordResearch | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<any[] | null>(null);
  const [showRawXml, setShowRawXml] = useState(false);
  const [sitemapUrlCount, setSitemapUrlCount] = useState<number | null>(null);

  // Count URLs in sitemap
  useEffect(() => {
    fetch("/sitemap.xml")
      .then(r => r.text())
      .then(xml => {
        const matches = xml.match(/<url>/g);
        setSitemapUrlCount(matches ? matches.length : 0);
      })
      .catch(() => setSitemapUrlCount(null));
  }, []);

  const handleCopySitemapUrl = () => {
    navigator.clipboard.writeText(SITEMAP_URL);
    toast.success("Sitemap URL copied!");
  };

  // Submit sitemap to search engines
  const handleSubmitToSearchEngines = async () => {
    setIsSubmitting(true);
    setSubmissionResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("submit-to-search-engines", {
        body: { siteUrl: SITE_URL },
      });
      if (error) throw error;
      setSubmissionResults(data.submissions);
      toast.success(data.message);
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch SEO audit data
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ["seo-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("seo-optimizer", {
        body: { action: "audit" },
      });
      if (error) throw error;
      return data as { products: ProductAudit[]; summary: AuditSummary };
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase.functions.invoke("seo-optimizer", {
        body: { action: "optimize-product", productId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Optimized: ${data.optimized.meta_title}`);
      queryClient.invalidateQueries({ queryKey: ["seo-audit"] });
    },
    onError: (error) => {
      toast.error(`Failed to optimize: ${error.message}`);
    },
  });

  const bulkOptimizeMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { data, error } = await supabase.functions.invoke("seo-optimizer", {
        body: { action: "bulk-optimize", productIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      toast.success(`Optimized ${successCount} products!`);
      setSelectedProducts([]);
      queryClient.invalidateQueries({ queryKey: ["seo-audit"] });
    },
    onError: (error) => {
      toast.error(`Bulk optimization failed: ${error.message}`);
    },
  });

  const handleKeywordResearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-optimizer", {
        body: { action: "research", keyword: searchKeyword },
      });
      if (error) throw error;
      setKeywordData(data);
      toast.success("Keyword research complete!");
    } catch (error: any) {
      toast.error(`Research failed: ${error.message}`);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === auditData?.products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(auditData?.products.map(p => p.id) || []);
    }
  };

  const handleSelectNeedsOptimization = () => {
    const needsOpt = auditData?.products.filter(p => p.score < 80).map(p => p.id) || [];
    setSelectedProducts(needsOpt);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Determine submission statuses
  const googleResult = submissionResults?.find((r: any) => r.service?.toLowerCase().includes("google"));
  const bingResult = submissionResults?.find((r: any) => r.service?.toLowerCase().includes("bing") && !r.service?.toLowerCase().includes("index"));
  const indexNowResult = submissionResults?.find((r: any) => r.service?.toLowerCase().includes("index"));

  const getSubmissionIcon = (result: any) => {
    if (!result) return <span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block" />;
    if (result.status === "success") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (result.status === "manual") return <Info className="h-4 w-4 text-blue-500" />;
    if (result.status === "skipped") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getSubmissionLabel = (result: any) => {
    if (!result) return "";
    if (result.status === "success") return "Submitted ✓";
    if (result.status === "manual") return "Manual — use Console";
    if (result.status === "skipped") return "Skipped — covered by IndexNow";
    return result.details || "Error";
  };

  const getSubmissionColor = (result: any) => {
    if (!result) return "";
    if (result.status === "success") return "text-green-600";
    if (result.status === "manual") return "text-blue-600";
    if (result.status === "skipped") return "text-yellow-600";
    return "text-red-500";
  };

  const freeListingPlatforms = [
    { name: "Google Business Profile", desc: "Essential for local SEO", url: "https://business.google.com/" },
    { name: "Bing Places", desc: "Microsoft search visibility", url: "https://www.bingplaces.com/" },
    { name: "Yandex Webmaster", desc: "Russian search engine", url: "https://webmaster.yandex.com/" },
    { name: "Pinterest Business", desc: "Visual search & discovery", url: "https://business.pinterest.com/" },
    { name: "Schema.org Validator", desc: "Validate structured data", url: "https://validator.schema.org/" },
    { name: "Rich Results Test", desc: "Test Google rich snippets", url: "https://search.google.com/test/rich-results" },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Sitemap & Search Submission ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Globe className="h-7 w-7 text-primary" />
                Sitemap & Search Submission
              </CardTitle>
              <CardDescription>Manage your sitemap and submit to search engines</CardDescription>
            </div>
            <Button
              onClick={handleSubmitToSearchEngines}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit to Search Engines
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sitemap Status */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <CardTitle className="text-base">Sitemap Status</CardTitle>
                    <CardDescription className="text-xs">Your dynamic sitemap is live and auto-updating</CardDescription>
                  </div>
                </div>
                {sitemapUrlCount !== null && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {sitemapUrlCount} URLs indexed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input value={SITEMAP_URL} readOnly className="font-mono text-sm bg-muted/50" />
                <Button variant="outline" size="icon" onClick={handleCopySitemapUrl} title="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild title="Open sitemap">
                  <a href={SITEMAP_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" onClick={() => refetchAudit()} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>robots.txt is configured and pointing to this sitemap.</span>
              </div>

              <Collapsible open={showRawXml} onOpenChange={setShowRawXml}>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                  {showRawXml ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  View Raw XML ({sitemapUrlCount ?? "..."} URLs)
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 max-h-64 overflow-auto rounded border bg-muted/30 p-3">
                    <SitemapPreview />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Submit to Search Engines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submit to Search Engines</CardTitle>
              <CardDescription className="text-xs">Ping search engines to crawl your sitemap immediately</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              {/* Google */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">G</div>
                  <div>
                    <p className="font-medium text-sm">Google</p>
                    <p className="text-xs text-muted-foreground">Add your site in Search Console → Sitemaps → paste the URL and submit.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {googleResult && (
                     <div className="flex items-center gap-1 text-xs">
                       {getSubmissionIcon(googleResult)}
                       <span className={getSubmissionColor(googleResult)}>
                         {getSubmissionLabel(googleResult)}
                       </span>
                     </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> Console
                    </a>
                  </Button>
                </div>
              </div>

              {/* Bing */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">B</div>
                  <div>
                    <p className="font-medium text-sm">Bing</p>
                    <p className="text-xs text-muted-foreground">Add in Webmaster Tools → Sitemaps → submit the URL.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bingResult && (
                    <div className="flex items-center gap-1 text-xs">
                      {getSubmissionIcon(bingResult)}
                       <span className={getSubmissionColor(bingResult)}>
                         {getSubmissionLabel(bingResult)}
                       </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> Console
                    </a>
                  </Button>
                </div>
              </div>

              {/* IndexNow */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">I</div>
                  <div>
                    <p className="font-medium text-sm">IndexNow (Bing/Yandex/DuckDuckGo)</p>
                    <p className="text-xs text-muted-foreground">IndexNow instantly notifies multiple search engines of new content.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {indexNowResult && (
                    <div className="flex items-center gap-1 text-xs">
                      {getSubmissionIcon(indexNowResult)}
                      <span className={indexNowResult.status === "success" ? "text-green-600" : "text-red-500"}>
                        {getSubmissionLabel(indexNowResult)}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.indexnow.org/" target="_blank" rel="noopener noreferrer" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> Console
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free Listing & Validation Platforms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Free Listing & Validation Platforms</CardTitle>
              <CardDescription className="text-xs">Submit your site to these free platforms for maximum visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0">
                {freeListingPlatforms.map((platform, i) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded transition-colors ${
                      i % 2 === 0 ? "sm:border-r" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.desc}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* ─── SEO Manager (existing) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            SEO Manager
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Powered by SerpAPI - Optimize your product listings for search engines
          </p>
        </div>
        <Button onClick={() => refetchAudit()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Audit
        </Button>
      </div>

      {/* Summary Cards */}
      {auditData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold">{auditData.summary.total}</p>
                </div>
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average SEO Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(auditData.summary.avgScore)}`}>
                    {auditData.summary.avgScore}%
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <Progress value={auditData.summary.avgScore} className="mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Optimized</p>
                  <p className="text-3xl font-bold text-green-500">{auditData.summary.optimized}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Optimization</p>
                  <p className="text-3xl font-bold text-yellow-500">{auditData.summary.needsOptimization}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keyword Research Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Keyword Research
            </CardTitle>
            <CardDescription>Research trending keywords using Google search data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., dragon fruit plant"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleKeywordResearch()}
              />
              <Button onClick={handleKeywordResearch} disabled={isResearching} size="icon">
                {isResearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {keywordData && (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {keywordData.relatedKeywords.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Related Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {keywordData.relatedKeywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {keywordData.questions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        People Also Ask
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {keywordData.questions.slice(0, 5).map((q, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-primary">•</span> {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {keywordData.competitorTitles.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Globe className="h-4 w-4 text-primary" />
                        Competitor Titles
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {keywordData.competitorTitles.slice(0, 5).map((t, i) => (
                          <li key={i} className="line-clamp-2">{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Product SEO Audit */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Product SEO Audit
                </CardTitle>
                <CardDescription>One-click optimization for all your products</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectNeedsOptimization}>
                  Select Needs Optimization
                </Button>
                <Button
                  onClick={() => bulkOptimizeMutation.mutate(selectedProducts)}
                  disabled={selectedProducts.length === 0 || bulkOptimizeMutation.isPending}
                  className="gap-2"
                >
                  {bulkOptimizeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Optimize Selected ({selectedProducts.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg text-sm font-medium">
                    <Checkbox
                      checked={selectedProducts.length === auditData?.products.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="flex-1">Product</span>
                    <span className="w-16 text-center">Score</span>
                    <span className="w-20 text-center">Title</span>
                    <span className="w-20 text-center">Desc</span>
                    <span className="w-16 text-center">Tags</span>
                    <span className="w-24"></span>
                  </div>

                  {auditData?.products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors ${
                        selectedProducts.includes(product.id) ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.issues.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.issues.join(" • ")}
                          </p>
                        )}
                      </div>
                      <div className="w-16 flex items-center justify-center gap-1">
                        {getScoreIcon(product.score)}
                        <span className={`text-sm font-medium ${getScoreColor(product.score)}`}>
                          {product.score}
                        </span>
                      </div>
                      <div className="w-20 text-center">
                        <Badge variant={product.meta_title ? "secondary" : "destructive"} className="text-xs">
                          {product.meta_title_length}/60
                        </Badge>
                      </div>
                      <div className="w-20 text-center">
                        <Badge variant={product.meta_description ? "secondary" : "destructive"} className="text-xs">
                          {product.meta_description_length}/160
                        </Badge>
                      </div>
                      <div className="w-16 text-center">
                        <Badge variant={product.tags_count >= 3 ? "secondary" : "outline"} className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.tags_count}
                        </Badge>
                      </div>
                      <div className="w-24">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1"
                          onClick={() => optimizeMutation.mutate(product.id)}
                          disabled={optimizeMutation.isPending}
                        >
                          {optimizeMutation.isPending && optimizeMutation.variables === product.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Optimize
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/** Inline component to fetch and display raw sitemap XML */
const SitemapPreview = () => {
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    fetch("/sitemap.xml")
      .then(r => r.text())
      .then(setXml)
      .catch(() => setXml("Failed to load sitemap.xml"));
  }, []);

  if (!xml) return <Loader2 className="h-4 w-4 animate-spin mx-auto" />;

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
      {xml}
    </pre>
  );
};

export default SEOManager;
