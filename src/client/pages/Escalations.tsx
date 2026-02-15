import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
import { Card, CardContent, Badge, TierBadge, Button, Spinner, EmptyState } from "../components/ui.tsx";

interface EscalationRow {
  escalation: {
    id: string;
    personId: string;
    tier: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
  };
  personName: string;
  personPhone: string;
}

const filters = [
  { key: "pending", label: "Pending" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

export function Escalations() {
  const [escalations, setEscalations] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadEscalations();
  }, [filter]);

  async function loadEscalations() {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await api.get<EscalationRow[]>(`/escalations${params}`);
      setEscalations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(id: string) {
    try {
      await api.patch(`/escalations/${id}/acknowledge`, {});
      toast.success("Escalation acknowledged");
      loadEscalations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function resolve(id: string) {
    try {
      await api.patch(`/escalations/${id}/resolve`, { resolvedBy: "admin" });
      toast.success("Escalation resolved");
      loadEscalations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Escalations</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage flagged concerns from wellness checks.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1 bg-muted rounded-xl w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              filter === f.key
                ? "bg-card text-foreground shadow-warm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Spinner className="py-20" />
          ) : escalations.length === 0 ? (
            <EmptyState title="No escalations" description={`No ${filter === "all" ? "" : filter + " "}escalations found.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tier</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Person</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Reason</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Details</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.map((row) => (
                    <tr key={row.escalation.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4"><TierBadge tier={row.escalation.tier} /></td>
                      <td className="p-4">
                        <Link to={`/persons/${row.escalation.personId}`} className="text-foreground hover:text-primary font-medium transition-colors">
                          {row.personName}
                        </Link>
                      </td>
                      <td className="p-4 text-foreground">{row.escalation.reason}</td>
                      <td className="p-4 text-muted-foreground truncate max-w-xs">{row.escalation.details || "—"}</td>
                      <td className="p-4"><Badge variant="outline">{row.escalation.status}</Badge></td>
                      <td className="p-4 text-muted-foreground">{new Date(row.escalation.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {row.escalation.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => acknowledge(row.escalation.id)}>
                              Acknowledge
                            </Button>
                          )}
                          {row.escalation.status !== "resolved" && (
                            <Button size="sm" variant="ghost" onClick={() => resolve(row.escalation.id)}>
                              Resolve
                            </Button>
                          )}
                        </div>
                      </td>
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
