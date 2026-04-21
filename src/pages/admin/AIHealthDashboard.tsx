import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle2, Clock, RefreshCw, TrendingDown, Zap, AlertTriangle, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type LogRow = {
  provider_name: string;
  model_id: string;
  function_type: string;
  success: boolean;
  response_time_ms: number | null;
  total_tokens: number | null;
  error_message: string | null;
  created_at: string;
};

const RANGES = {
  "1h": 1,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
} as const;

type RangeKey = keyof typeof RANGES;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export default function AIHealthDashboard() {
  const [range, setRange] = useState<RangeKey>("24h");

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ai-health", range],
    queryFn: async () => {
      const since = new Date(Date.now() - RANGES[range] * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("ai_usage_log")
        .select("provider_name,model_id,function_type,success,response_time_ms,total_tokens,error_message,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    const rows = logs ?? [];
    const total = rows.length;
    const successes = rows.filter((r) => r.success).length;
    const failures = total - successes;
    const latencies = rows.map((r) => r.response_time_ms ?? 0).filter((n) => n > 0);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95 = Math.round(percentile(latencies, 95));
    const successRate = total ? (successes / total) * 100 : 0;
    return { total, successes, failures, avgLatency, p95, successRate };
  }, [logs]);

  const perProvider = useMemo(() => {
    const map = new Map<string, LogRow[]>();
    (logs ?? []).forEach((r) => {
      const key = r.provider_name || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries())
      .map(([provider, rows]) => {
        const total = rows.length;
        const successes = rows.filter((r) => r.success).length;
        const latencies = rows.map((r) => r.response_time_ms ?? 0).filter((n) => n > 0);
        const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
        const p95v = Math.round(percentile(latencies, 95));
        const tokens = rows.reduce((acc, r) => acc + (r.total_tokens ?? 0), 0);
        return {
          provider,
          total,
          successRate: total ? (successes / total) * 100 : 0,
          failures: total - successes,
          avgLatency: avg,
          p95: p95v,
          tokens,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [logs]);

  // Fallback usage: define primary provider as the most-used one overall.
  // Anything else counts as fallback usage.
  const fallback = useMemo(() => {
    if (!perProvider.length) return { primary: null as string | null, fallbackPct: 0, fallbackCount: 0, primaryCount: 0 };
    const primary = perProvider[0].provider;
    const primaryCount = perProvider[0].total;
    const fallbackCount = perProvider.slice(1).reduce((acc, p) => acc + p.total, 0);
    const total = primaryCount + fallbackCount;
    return {
      primary,
      primaryCount,
      fallbackCount,
      fallbackPct: total ? (fallbackCount / total) * 100 : 0,
    };
  }, [perProvider]);

  // Time series buckets
  const series = useMemo(() => {
    const rows = logs ?? [];
    if (!rows.length) return [];
    const bucketMs = range === "1h" ? 60 * 1000 : range === "24h" ? 30 * 60 * 1000 : 6 * 60 * 60 * 1000;
    const buckets = new Map<number, { t: number; total: number; success: number; latencySum: number; latencyN: number }>();
    rows.forEach((r) => {
      const t = Math.floor(new Date(r.created_at).getTime() / bucketMs) * bucketMs;
      const b = buckets.get(t) ?? { t, total: 0, success: 0, latencySum: 0, latencyN: 0 };
      b.total += 1;
      if (r.success) b.success += 1;
      if (r.response_time_ms) {
        b.latencySum += r.response_time_ms;
        b.latencyN += 1;
      }
      buckets.set(t, b);
    });
    return Array.from(buckets.values())
      .sort((a, b) => a.t - b.t)
      .map((b) => ({
        time: new Date(b.t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        successRate: b.total ? Math.round((b.success / b.total) * 100) : 0,
        avgLatency: b.latencyN ? Math.round(b.latencySum / b.latencyN) : 0,
        requests: b.total,
      }));
  }, [logs, range]);

  const recentErrors = useMemo(
    () => (logs ?? []).filter((r) => !r.success && r.error_message).slice(0, 8),
    [logs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            AI Gateway Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Latency, success rate and fallback usage across providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<Zap className="h-5 w-5 text-primary" />}
          label="Total requests"
          value={stats.total.toLocaleString()}
          sub={`${stats.failures} failed`}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Success rate"
          value={`${stats.successRate.toFixed(1)}%`}
          sub={stats.successRate >= 99 ? "Healthy" : stats.successRate >= 95 ? "Degraded" : "Unhealthy"}
          tone={stats.successRate >= 99 ? "good" : stats.successRate >= 95 ? "warn" : "bad"}
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-primary" />}
          label="Avg latency"
          value={`${stats.avgLatency} ms`}
          sub={`p95 ${stats.p95} ms`}
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5 text-amber-600" />}
          label="Fallback usage"
          value={`${fallback.fallbackPct.toFixed(1)}%`}
          sub={fallback.primary ? `Primary: ${fallback.primary}` : "No data"}
          tone={fallback.fallbackPct > 20 ? "warn" : "good"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success rate over time</CardTitle>
            <CardDescription>Per bucket success percentage</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : series.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="successRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avg latency over time</CardTitle>
            <CardDescription>Milliseconds per bucket</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : series.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgLatency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-provider table + chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-provider breakdown</CardTitle>
          <CardDescription>Volume, success rate and latency by provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {perProvider.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perProvider}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="provider" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Requests" fill="hsl(var(--primary))" />
                    <Bar dataKey="failures" name="Failures" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Avg ms</TableHead>
                    <TableHead className="text-right">p95 ms</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perProvider.map((p) => (
                    <TableRow key={p.provider}>
                      <TableCell className="font-medium">{p.provider}</TableCell>
                      <TableCell className="text-right">{p.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.successRate >= 99 ? "default" : p.successRate >= 95 ? "secondary" : "destructive"}>
                          {p.successRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{p.avgLatency}</TableCell>
                      <TableCell className="text-right">{p.p95}</TableCell>
                      <TableCell className="text-right">{p.tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.provider === fallback.primary ? "default" : "outline"}>
                          {p.provider === fallback.primary ? "Primary" : "Fallback"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Recent errors
          </CardTitle>
          <CardDescription>Last failed requests in selected window</CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No errors in this window. 🎉</p>
          ) : (
            <div className="space-y-2">
              {recentErrors.map((e, i) => (
                <div key={i} className="p-3 rounded-md bg-muted/40 text-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline">{e.provider_name}</Badge>
                    <Badge variant="secondary">{e.model_id}</Badge>
                    <Badge variant="outline">{e.function_type}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-destructive break-words">{e.error_message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-green-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "bad"
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className={`text-xs mt-1 ${toneClass}`}>{sub}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      No usage data in this window yet.
    </div>
  );
}
