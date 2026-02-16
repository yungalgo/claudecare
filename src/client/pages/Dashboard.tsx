import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
import { Card, CardContent, Input, Badge, FlagBadge, Button, Spinner, EmptyState } from "../components/ui.tsx";

interface PersonRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  flag: string;
  lastCallAt: string | null;
  callCount: number;
  createdAt: string;
}

type DemoCallStatus = "idle" | "creating" | "dialing" | "in-progress" | "completed" | "failed";

/** Normalize a phone input to E.164 format (+1XXXXXXXXXX) for US/Canada. Returns null if invalid. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function DemoCallCard({ onCallComplete }: { onCallComplete: () => void }) {
  const [phone, setPhone] = useState("");
  const [callType, setCallType] = useState<"standard" | "comprehensive">("standard");
  const [status, setStatus] = useState<DemoCallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const normalized = normalizePhone(phone);
  const phoneError = phone.trim().length > 0 && !normalized
    ? "Enter a valid US/Canada number (10 digits)"
    : null;

  async function handleCall() {
    if (!normalized) return;
    setError(null);
    setStatus("creating");

    try {
      // Step 1: Create a demo person
      const person = await api.post<{ id: string }>("/persons", {
        name: "Demo Call",
        phone: normalized,
      });

      // Step 2: Trigger the call
      setStatus("dialing");
      await api.post("/calls/trigger", {
        personId: person.id,
        callType,
      });

      // Step 3: Poll for status updates
      pollRef.current = setInterval(async () => {
        try {
          const calls = await api.get<{ id: string; status: string }[]>(
            `/calls?personId=${person.id}`
          );
          if (calls.length > 0) {
            const latest = calls[0]!;
            if (latest.status === "in-progress") {
              setStatus("in-progress");
            } else if (latest.status === "completed") {
              setStatus("completed");
              cleanup();
              onCallComplete();
            } else if (latest.status === "failed" || latest.status === "no-answer") {
              setStatus("failed");
              setError(`Call ${latest.status}`);
              cleanup();
            }
          }
        } catch {
          // polling errors are non-fatal, just keep trying
        }
      }, 3000);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function resetDemo() {
    cleanup();
    setStatus("idle");
    setError(null);
    setPhone("");
  }

  const isActive = status !== "idle" && status !== "completed" && status !== "failed";

  return (
    <div className="rounded-xl p-[2px] bg-gradient-to-r from-primary via-secondary to-primary/60 shadow-warm">
      <Card className="border-0 shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Left: info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PhoneOutIcon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">Try a Demo Call</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-[46px]">
                Enter a phone number and Claude Care will call with a wellness check-in.
              </p>
            </div>

            {/* Right: controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:min-w-[480px]">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isActive}
                  className={`h-11 ${phoneError ? "border-danger focus:ring-danger/20 focus:border-danger" : ""}`}
                />
                <p className={`text-xs mt-1 h-4 ${phoneError ? "text-danger" : "invisible"}`}>
                  {phoneError || "\u00A0"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Call type</label>
                <div className="flex rounded-[var(--radius)] border border-border overflow-hidden h-11 w-[240px]">
                  <button
                    type="button"
                    onClick={() => setCallType("standard")}
                    disabled={isActive}
                    className={`flex-1 text-sm font-medium transition-colors cursor-pointer ${
                      callType === "standard"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallType("comprehensive")}
                    disabled={isActive}
                    className={`flex-1 text-sm font-medium transition-colors border-l border-border cursor-pointer ${
                      callType === "comprehensive"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    Comprehensive
                  </button>
                </div>
              </div>

              {status === "completed" || status === "failed" ? (
                <Button onClick={resetDemo} variant="outline" size="md" className="h-11 shrink-0">
                  Try Again
                </Button>
              ) : (
                <Button
                  onClick={handleCall}
                  disabled={!normalized || isActive}
                  size="md"
                  className="h-11 shrink-0 min-w-[120px]"
                >
                  <PhoneOutIcon className="w-4 h-4" />
                  {status === "idle" ? "Call Me" : status === "creating" ? "Setting up..." : "Calling..."}
                </Button>
              )}
            </div>
          </div>

          {/* Status indicator (fixed height to prevent layout shift) */}
          <div className="mt-4 ml-[46px] min-h-[28px]">
            {status !== "idle" && (
              <>
                {error ? (
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-danger-light border border-danger/20">
                    <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                    <span className="text-sm text-danger font-medium">{error}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <DemoStatusStep label="Creating" active={status === "creating"} done={status !== "creating"} />
                    <StepArrow />
                    <DemoStatusStep label="Dialing" active={status === "dialing"} done={status === "in-progress" || status === "completed"} />
                    <StepArrow />
                    <DemoStatusStep label="In Progress" active={status === "in-progress"} done={status === "completed"} />
                    <StepArrow />
                    <DemoStatusStep label="Completed" active={false} done={status === "completed"} />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoStatusStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full transition-colors ${
          done ? "bg-success" : active ? "bg-primary animate-pulse" : "bg-border"
        }`}
      />
      <span
        className={`text-xs font-medium transition-colors ${
          done ? "text-success" : active ? "text-primary" : "text-muted-foreground/50"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepArrow() {
  return (
    <svg className="w-3 h-3 text-muted-foreground/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface ActiveCall {
  id: string;
  personId: string;
  personName: string;
  status: string;
  callType: string;
  startedAt: string | null;
  createdAt: string;
}

function CallerStatus() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const data = await api.get<ActiveCall[]>("/calls/active");
        if (!cancelled) {
          setActiveCalls(data);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!loaded) return null;

  if (activeCalls.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <PhoneOutIcon className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Caller Idle</p>
              <p className="text-xs text-muted-foreground/60">No active calls right now</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary-light/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            {activeCalls.length} Active Call{activeCalls.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-2.5">
          {activeCalls.map((call) => (
            <div key={call.id} className="flex items-center justify-between bg-card rounded-lg px-3.5 py-2.5 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <PhoneOutIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <Link to={`/persons/${call.personId}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {call.personName}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{call.callType}</Badge>
                    <span className="capitalize">{call.status.replace("-", " ")}</span>
                  </div>
                </div>
              </div>
              {call.startedAt && <ElapsedTime startedAt={call.startedAt} />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function update() {
      const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      if (seconds < 0) { setElapsed("0:00"); return; }
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className="text-sm font-mono text-muted-foreground tabular-nums">{elapsed}</span>;
}

function PhoneOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

export function Dashboard() {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    if (!confirm("This will replace all existing persons with demo data. Continue?")) return;
    setSeeding(true);
    try {
      const result = await api.post<{ persons: number; calls: number; assessments: number; escalations: number }>("/seed", {});
      toast.success(`Seeded ${result.persons} persons, ${result.calls} calls, ${result.assessments} assessments`);
      loadPersons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    loadPersons();
  }, []);

  async function loadPersons() {
    setLoading(true);
    try {
      const data = await api.get<PersonRow[]>(`/persons${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setPersons(data);
    } catch (err) {
      console.error("Failed to load persons:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadPersons, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const total = persons.length;
  const greenCount = persons.filter((p) => p.flag === "green").length;
  const yellowCount = persons.filter((p) => p.flag === "yellow").length;
  const redCount = persons.filter((p) => p.flag === "red").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of all enrolled persons and their current status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Populating..." : "Populate Demo Data"}
          </Button>
          <Link to="/upload">
            <Button>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload CSV
            </Button>
          </Link>
        </div>
      </div>

      {/* Caller Status */}
      <CallerStatus />

      {/* Demo Call Card */}
      <DemoCallCard onCallComplete={loadPersons} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-in">
        <StatCard label="Total Enrolled" value={total} icon={<UsersIcon />} />
        <StatCard label="Stable" value={greenCount} icon={<CheckIcon />} accent="text-success bg-success-light" />
        <StatCard label="Monitoring" value={yellowCount} icon={<EyeIcon />} accent="text-yellow-700 bg-warning-light" />
        <StatCard label="Needs Attention" value={redCount} icon={<AlertIcon />} accent="text-danger bg-danger-light" />
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Spinner className="py-20" />
          ) : persons.length === 0 ? (
            <EmptyState title="No people found" description="Upload a CSV to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Flag</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Last Call</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Calls</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {persons.map((person) => (
                    <tr key={person.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-4">
                        <Link to={`/persons/${person.id}`} className="text-foreground hover:text-primary font-medium transition-colors">
                          {person.name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{person.phone}</td>
                      <td className="p-4"><FlagBadge flag={person.flag} /></td>
                      <td className="p-4 text-muted-foreground">
                        {person.lastCallAt ? new Date(person.lastCallAt).toLocaleDateString() : <span className="text-muted-foreground/40">Never</span>}
                      </td>
                      <td className="p-4 text-muted-foreground">{person.callCount}</td>
                      <td className="p-4">
                        <Badge variant={person.status === "active" ? "success" : "outline"}>
                          {person.status}
                        </Badge>
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

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ?? "text-muted-foreground bg-muted"}`}>
            {icon}
          </div>
        </div>
        <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
