import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
import { usePlayer } from "../components/AudioPlayer.tsx";
import { Card, CardContent, CardHeader, CardTitle, Badge, FlagBadge, TierBadge, Button, Spinner, EmptyState } from "../components/ui.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PersonData {
  id: string;
  name: string;
  phone: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  pcpName: string | null;
  pcpPhone: string | null;
  notes: string | null;
  status: string;
  flag: string;
  lastCallAt: string | null;
  callCount: number;
}

interface CallData {
  id: string;
  callType: string;
  status: string;
  duration: number | null;
  summary: string | null;
  recordingUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface AssessmentData {
  id: string;
  meals: number | null;
  sleep: number | null;
  health: number | null;
  social: number | null;
  mobility: number | null;
  phq2Score: number | null;
  ottawaScore: number | null;
  flag: string;
  createdAt: string;
}

interface EscalationData {
  escalation: {
    id: string;
    tier: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
  };
  personName: string;
  personPhone: string;
}

const chartColors = {
  Meals: "#2F855A",
  Sleep: "#2563EB",
  Health: "#0D756E",
  Social: "#D69E2E",
  Mobility: "#7C3AED",
};

export function Person() {
  const { id } = useParams<{ id: string }>();
  const { play } = usePlayer();
  const [person, setPerson] = useState<PersonData | null>(null);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [escalations, setEscalations] = useState<EscalationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<PersonData>(`/persons/${id}`),
      api.get<CallData[]>(`/calls?personId=${id}`),
      api.get<AssessmentData[]>(`/assessments?personId=${id}`),
      api.get<EscalationData[]>(`/escalations?personId=${id}`),
    ])
      .then(([p, c, a, e]) => {
        setPerson(p);
        setCalls(c);
        setAssessments(a);
        setEscalations(e);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function triggerCall() {
    if (!id) return;
    setCalling(true);
    try {
      await api.post("/calls/trigger", { personId: id, callType: "weekly" });
      toast.success("Call triggered successfully");
      const c = await api.get<CallData[]>(`/calls?personId=${id}`);
      setCalls(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger call");
    } finally {
      setCalling(false);
    }
  }

  if (loading) return <Spinner className="py-32" />;
  if (!person) return <EmptyState title="Person not found" />;

  const chartData = [...assessments].reverse().map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Meals: a.meals,
    Sleep: a.sleep,
    Health: a.health,
    Social: a.social,
    Mobility: a.mobility,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-foreground">{person.name}</h1>
            <FlagBadge flag={person.flag} />
            <Badge variant={person.status === "active" ? "success" : "outline"}>{person.status}</Badge>
          </div>
        </div>
        <Button onClick={triggerCall} disabled={calling} variant="secondary">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          {calling ? "Calling..." : "Call Now"}
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-in">
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Phone" value={person.phone} mono />
              <InfoRow label="Last Call" value={person.lastCallAt ? new Date(person.lastCallAt).toLocaleString() : "Never"} />
              <InfoRow label="Total Calls" value={String(person.callCount)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Name" value={person.emergencyContactName} />
              <InfoRow label="Phone" value={person.emergencyContactPhone} mono />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Primary Care Provider</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <InfoRow label="Name" value={person.pcpName} />
              <InfoRow label="Phone" value={person.pcpPhone} mono />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {person.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{person.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Assessment Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DB" />
                <XAxis dataKey="date" fontSize={12} stroke="#6B6B7B" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="#6B6B7B" tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E8E3DB",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(26,26,46,0.06)",
                    fontSize: "13px",
                  }}
                />
                <Legend />
                {Object.entries(chartColors).map(([key, color]) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Escalations */}
      {escalations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Escalations</CardTitle></CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tier</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Reason</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.map((e) => (
                    <tr key={e.escalation.id} className="border-b border-border/60 last:border-0">
                      <td className="p-4"><TierBadge tier={e.escalation.tier} /></td>
                      <td className="p-4 text-foreground">{e.escalation.reason}</td>
                      <td className="p-4"><Badge variant="outline">{e.escalation.status}</Badge></td>
                      <td className="p-4 text-muted-foreground">{new Date(e.escalation.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call history */}
      <Card>
        <CardHeader><CardTitle>Call History</CardTitle></CardHeader>
        <CardContent className="p-0 pt-2">
          {calls.length === 0 ? (
            <EmptyState title="No calls yet" description="Trigger a call to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Duration</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Recording</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Summary</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4"><Badge variant="outline">{call.callType}</Badge></td>
                      <td className="p-4">
                        <Badge variant={call.status === "completed" ? "success" : call.status === "failed" ? "danger" : "outline"}>
                          {call.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">
                        {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}` : "—"}
                      </td>
                      <td className="p-4">
                        {call.recordingUrl ? (
                          <button onClick={() => play(call.id)} className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors cursor-pointer">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Play
                          </button>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground truncate max-w-sm">{call.summary || "—"}</td>
                      <td className="p-4 text-muted-foreground">{new Date(call.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={`text-foreground text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value || <span className="text-muted-foreground/40">—</span>}
      </dd>
    </div>
  );
}
