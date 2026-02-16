import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import Papa from "papaparse";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../components/ui.tsx";

interface ParsedRow {
  name: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  pcpName?: string;
  pcpPhone?: string;
  notes?: string;
}

export function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function parseFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const mapped: ParsedRow[] = results.data.map((row) => ({
          name: row.name ?? row.Name ?? "",
          phone: row.phone ?? row.Phone ?? row.phone_number ?? "",
          emergencyContactName: row.emergency_contact_name ?? row.emergencyContactName ?? "",
          emergencyContactPhone: row.emergency_contact_phone ?? row.emergencyContactPhone ?? "",
          pcpName: row.pcp_name ?? row.pcpName ?? "",
          pcpPhone: row.pcp_phone ?? row.pcpPhone ?? "",
          notes: row.notes ?? row.Notes ?? "",
        }));
        setRows(mapped.filter((r) => r.name && r.phone));
      },
      error(err) {
        toast.error(`CSV parse error: ${err.message}`);
      },
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) parseFile(file);
    else toast.error("Please drop a .csv file");
  }, []);

  async function handleSubmit() {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const result = await api.post<{ count: number }>("/persons/upload", { rows });
      toast.success(`Uploaded ${result.count} persons successfully`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Upload Persons</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV file with columns: name, phone, emergency_contact_name, emergency_contact_phone, pcp_name, pcp_phone, notes
        </p>
        <a
          href="/sample-persons.csv"
          download="sample-persons.csv"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors mt-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download sample template
        </a>
      </div>

      {/* Drop zone */}
      <Card>
        <CardContent className="p-4">
          <div
            className={`relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-primary bg-primary-light/50"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />

            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
              <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            {fileName ? (
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-foreground font-medium">
                  Drop your CSV here, or <span className="text-primary">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">Supports .csv files</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card className="animate-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview ({rows.length} rows)</CardTitle>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Uploading..." : `Upload ${rows.length} Persons`}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Emergency Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">PCP</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0">
                      <td className="p-4 font-medium text-foreground">{row.name}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{row.phone}</td>
                      <td className="p-4 text-muted-foreground">{row.emergencyContactName || "—"}</td>
                      <td className="p-4 text-muted-foreground">{row.pcpName || "—"}</td>
                      <td className="p-4 text-muted-foreground truncate max-w-xs">{row.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="p-4 text-sm text-muted-foreground text-center border-t border-border/60">
                  ...and {rows.length - 20} more rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
