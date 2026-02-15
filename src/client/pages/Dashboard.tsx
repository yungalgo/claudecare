import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api.ts";
import { Card, CardContent, CardHeader, CardTitle, Input, Badge, FlagBadge, Button, Spinner, EmptyState } from "../components/ui.tsx";

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

  // Stats
  const total = persons.length;
  const greenCount = persons.filter((p) => p.flag === "green").length;
  const yellowCount = persons.filter((p) => p.flag === "yellow").length;
  const redCount = persons.filter((p) => p.flag === "red").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of all enrolled persons and their status.
          </p>
        </div>
        <Link to="/upload">
          <Button variant="primary">Upload CSV</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Enrolled" value={total} />
        <StatCard label="Green" value={greenCount} color="text-success" />
        <StatCard label="Yellow" value={yellowCount} color="text-warning" />
        <StatCard label="Red" value={redCount} color="text-danger" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Person table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Spinner className="py-16" />
          ) : persons.length === 0 ? (
            <EmptyState title="No persons found" description="Upload a CSV to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Flag</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Last Call</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Calls</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {persons.map((person) => (
                    <tr key={person.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Link to={`/persons/${person.id}`} className="text-primary hover:underline font-medium">
                          {person.name}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground">{person.phone}</td>
                      <td className="p-4"><FlagBadge flag={person.flag} /></td>
                      <td className="p-4 text-muted-foreground">
                        {person.lastCallAt ? new Date(person.lastCallAt).toLocaleDateString() : "Never"}
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

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color ?? "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
