import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
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

export function Person() {
  const { id } = useParams<{ id: string }>();
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
      // Refresh calls
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

  // Chart data (reverse so chronological)
  const chartData = [...assessments].reverse().map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Meals: a.meals,
    Sleep: a.sleep,
    Health: a.health,
    Social: a.social,
    Mobility: a.mobility,
    "PHQ-2": a.phq2Score,
    Ottawa: a.ottawaScore,
  }));

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-foreground">{person.name}</h1>
            <FlagBadge flag={person.flag} />
            <Badge variant={person.status === "active" ? "success" : "outline"}>{person.status}</Badge>
          </div>
        </div>
        <Button onClick={triggerCall} disabled={calling}>
          {calling ? "Calling..." : "Call Now"}
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Phone</dt><dd>{person.phone}</dd></div>
              <div><dt className="text-muted-foreground">Last Call</dt><dd>{person.lastCallAt ? new Date(person.lastCallAt).toLocaleString() : "Never"}</dd></div>
              <div><dt className="text-muted-foreground">Total Calls</dt><dd>{person.callCount}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd>{person.emergencyContactName || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{person.emergencyContactPhone || "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Primary Care Provider</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd>{person.pcpName || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{person.pcpPhone || "—"}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {person.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{person.notes}</p></CardContent>
        </Card>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Assessment Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" fontSize={12} stroke="#64748B" />
                <YAxis fontSize={12} stroke="#64748B" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Meals" stroke="#16A34A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Sleep" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Health" stroke="#0F766E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Social" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Mobility" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Escalations */}
      {escalations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Escalations</CardTitle></CardHeader>
          <CardContent className="p-0 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Tier</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((e) => (
                  <tr key={e.escalation.id} className="border-b border-border last:border-0">
                    <td className="p-3"><TierBadge tier={e.escalation.tier} /></td>
                    <td className="p-3">{e.escalation.reason}</td>
                    <td className="p-3"><Badge variant="outline">{e.escalation.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{new Date(e.escalation.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Call history */}
      <Card>
        <CardHeader><CardTitle>Call History</CardTitle></CardHeader>
        <CardContent className="p-0 pt-4">
          {calls.length === 0 ? (
            <EmptyState title="No calls yet" description="Trigger a call to get started." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Duration</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Summary</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id} className="border-b border-border last:border-0">
                    <td className="p-3"><Badge variant="outline">{call.callType}</Badge></td>
                    <td className="p-3">
                      <Badge variant={call.status === "completed" ? "success" : call.status === "failed" ? "danger" : "outline"}>
                        {call.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}` : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground truncate max-w-sm">{call.summary || "—"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(call.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
