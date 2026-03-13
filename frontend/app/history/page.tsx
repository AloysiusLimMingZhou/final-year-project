"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ChevronLeft, Loader2, FileText } from "lucide-react";

type Band = "Low" | "Moderate" | "High";

function toneFromBand(b?: string) {
  const band = (b || "").toLowerCase();
  if (band.includes("low")) return "low";
  if (band.includes("high")) return "high";
  return "mid";
}

export default function HistoryPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health/history", { credentials: "include" });
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Card
        title="Medical history"
        headerRight={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/dashboard")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => router.push("/reports")} iconLeft={<FileText className="h-4 w-4" />}>
              Reports
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            No history yet. Run a screening first.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--borderSoft)" }}>
            <table className="min-w-[900px] w-full text-sm">
              <thead style={{ background: "rgba(15,23,42,0.03)" }}>
                <tr>
                  <Th>Date</Th>
                  <Th>Age</Th>
                  <Th>BP</Th>
                  <Th>Chol</Th>
                  <Th>Max HR</Th>
                  <Th>Risk</Th>
                  <Th>Band</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const risk = Math.round(((r?.risk_score ?? r?.probability ?? 0) as number) * 100);
                  const band = (risk === 0 ? "Low" : (r?.band || "Moderate")) as Band;
                  return (
                    <tr key={r?.id ?? idx} className="border-t" style={{ borderColor: "var(--borderSoft)" }}>
                      <Td style={{ color: "var(--muted)" }}>
                        {r?.recorded_at ? new Date(r.recorded_at).toLocaleDateString() : "—"}
                      </Td>
                      <Td>{r?.age ?? "—"}</Td>
                      <Td>{r?.trestbps ?? r?.bp ?? "—"}</Td>
                      <Td>{r?.chol ?? "—"}</Td>
                      <Td>{r?.thalach ?? r?.max_hr ?? "—"}</Td>
                      <Td>{Number.isFinite(risk) ? `${risk}%` : "—"}</Td>
                      <Td>
                        <Badge tone={toneFromBand(band)}>{band}</Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-semibold" style={{ color: "var(--muted)" }}>
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td className="px-4 py-3" style={style}>
      {children}
    </td>
  );
}
