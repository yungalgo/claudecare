import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import Papa from "papaparse";
import { toast } from "sonner";
import { api } from "../lib/api.ts";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "../components/ui.tsx";

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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  async function handleSubmit() {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const result = await api.post<{ count: number }>("/persons/upload", { rows });
      toast.success(`Uploaded ${result.count} persons successfully`);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Persons</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV file with columns: name, phone, emergency_contact_name, emergency_contact_phone, pcp_name, pcp_phone, notes
        </p>
      </div>

      {/* File picker */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-sm text-muted-foreground">
              {fileName ? fileName : "Click to select a CSV file or drag and drop"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({rows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Emergency Contact</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">PCP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3">{row.name}</td>
                      <td className="p-3 text-muted-foreground">{row.phone}</td>
                      <td className="p-3 text-muted-foreground">{row.emergencyContactName || "—"}</td>
                      <td className="p-3 text-muted-foreground">{row.pcpName || "—"}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-xs">{row.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  ...and {rows.length - 20} more rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Uploading..." : `Upload ${rows.length} Persons`}
          </Button>
        </div>
      )}
    </div>
  );
}
