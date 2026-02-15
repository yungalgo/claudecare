import { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { Card, CardContent, Badge, Spinner, EmptyState } from "../components/ui.tsx";

interface CallRow {
  id: string;
  personId: string;
  callType: string;
  status: string;
  duration: number | null;
  summary: string | null;
  recordingUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function Calls() {
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CallRow[]>("/calls")
      .then(setCalls)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Call History</h1>
        <p className="text-muted-foreground text-sm mt-1">All wellness check calls across all persons.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Spinner className="py-20" />
          ) : calls.length === 0 ? (
            <EmptyState title="No calls yet" description="Trigger a call from a person's detail page." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Duration</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Summary</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Recording</th>
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
                      <td className="p-4 text-muted-foreground truncate max-w-sm">{call.summary || "—"}</td>
                      <td className="p-4">
                        {call.recordingUrl ? (
                          <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-xs font-medium transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Play
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
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
