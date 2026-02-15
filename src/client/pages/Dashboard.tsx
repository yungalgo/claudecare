import { useEffect, useState } from "react";
import { Link } from "react-router";
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

export function Dashboard() {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        <Link to="/upload">
          <Button>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload CSV
          </Button>
        </Link>
      </div>

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
            <EmptyState title="No persons found" description="Upload a CSV to get started." />
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
