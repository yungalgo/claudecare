import { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { Card, CardContent, Spinner } from "../components/ui.tsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

interface AnalyticsData {
  calls: {
    total: number;
    completed: number;
    last24h: number;
    last48h: number;
    last7d: number;
    completionRate: number;
  };
  avgDuration: { last7d: number; last30d: number };
  personsCalled: { last24h: number; last48h: number; last7d: number };
  flagDistribution: Record<string, number>;
  avgScores: {
    meals: number;
    sleep: number;
    health: number;
    social: number;
    mobility: number;
    phq2: number;
    ottawa: number;
  } | null;
  callVolume: Array<{ date: string; count: number }>;
}

const FLAG_COLORS: Record<string, string> = {
  green: "#2F855A",
  yellow: "#D69E2E",
  red: "#C53030",
};

const FLAG_LABELS: Record<string, string> = {
  green: "Stable",
  yellow: "Monitor",
  red: "Alert",
};

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AnalyticsData>("/analytics")
      .then(setData)
      .catch((err) => console.error("Failed to load analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="py-32" />;
  if (!data) return <div className="text-center py-20 text-muted-foreground">Failed to load analytics</div>;

  const flagData = Object.entries(data.flagDistribution).map(([flag, count]) => ({
    name: FLAG_LABELS[flag] ?? flag,
    value: count,
    color: FLAG_COLORS[flag] ?? "#6B6B7B",
  }));

  const volumeData = data.callVolume.map((v) => ({
    date: formatDate(v.date),
    calls: v.count,
  }));

  const scoreData = data.avgScores
    ? [
        { name: "Meals", score: data.avgScores.meals, max: 5 },
        { name: "Sleep", score: data.avgScores.sleep, max: 5 },
        { name: "Health", score: data.avgScores.health, max: 5 },
        { name: "Social", score: data.avgScores.social, max: 5 },
        { name: "Mobility", score: data.avgScores.mobility, max: 5 },
        { name: "Ottawa", score: data.avgScores.ottawa, max: 4 },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Call activity, outcomes, and assessment trends across your care program.
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-in">
        <MetricCard label="Total Calls" value={data.calls.total} />
        <MetricCard label="Completed" value={data.calls.completed} accent="text-success" />
        <MetricCard label="Last 24h" value={data.calls.last24h} />
        <MetricCard label="Last 7 Days" value={data.calls.last7d} />
        <MetricCard label="Completion" value={`${data.calls.completionRate}%`} />
        <MetricCard label="Avg Duration (7d)" value={formatDuration(data.avgDuration.last7d)} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call volume — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Call Volume (30 days)</h3>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={volumeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D756E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0D756E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DB" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6B6B7B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E8E3DB" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B6B7B" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E8E3DB",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(26,26,46,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#0D756E"
                    strokeWidth={2}
                    fill="url(#callGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No call data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flag distribution pie */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Flag Distribution</h3>
            {flagData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={flagData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {flagData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #E8E3DB",
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(26,26,46,0.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {flagData.map((f) => (
                    <div key={f.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                      {f.name} ({f.value})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                No people enrolled
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: scores + persons called */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average CLOVA scores */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">Average Assessment Scores</h3>
            <p className="text-xs text-muted-foreground mb-4">Last 30 days across all persons</p>
            {scoreData.length > 0 && scoreData.some((s) => s.score > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6B6B7B" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E8E3DB" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B6B7B" }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 5]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E8E3DB",
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(26,26,46,0.06)",
                    }}
                    formatter={(value) => [Number(value).toFixed(1), "Avg Score"]}
                  />
                  <Bar dataKey="score" fill="#0D756E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No assessment data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Persons reached summary */}
        <Card>
          <CardContent className="p-5 space-y-5">
            <h3 className="font-display text-sm font-semibold text-foreground">Persons Reached</h3>
            <div className="space-y-4">
              <ReachRow label="Last 24 hours" value={data.personsCalled.last24h} />
              <ReachRow label="Last 48 hours" value={data.personsCalled.last48h} />
              <ReachRow label="Last 7 days" value={data.personsCalled.last7d} />
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Duration (30d)</span>
                <span className="text-sm font-semibold text-foreground font-display">
                  {formatDuration(data.avgDuration.last30d)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={`font-display text-xl font-semibold ${accent ?? "text-foreground"}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

function ReachRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}
