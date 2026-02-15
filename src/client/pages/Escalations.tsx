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

export function Escalations() {
  const [escalations, setEscalations] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Escalations</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage flagged concerns.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["pending", "acknowledged", "resolved", "all"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Spinner className="py-16" />
          ) : escalations.length === 0 ? (
            <EmptyState title="No escalations" description={`No ${filter} escalations found.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Tier</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Person</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Details</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.map((row) => (
                    <tr key={row.escalation.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4"><TierBadge tier={row.escalation.tier} /></td>
                      <td className="p-4">
                        <Link to={`/persons/${row.escalation.personId}`} className="text-primary hover:underline font-medium">
                          {row.personName}
                        </Link>
                      </td>
                      <td className="p-4">{row.escalation.reason}</td>
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
                            <Button size="sm" variant="secondary" onClick={() => resolve(row.escalation.id)}>
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
