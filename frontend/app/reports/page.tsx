"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface HealthRecord {
  id: string;
  recorded_at: string;
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
  risk_score: number;
  band: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [csvStatus, setCsvStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [csvError, setCsvError] = useState<string | null>(null);

  const [pdfStatus, setPdfStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Fetch health history once user is ready
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError(null);
    fetch("/api/health/history", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: HealthRecord[]) => {
        const sorted = Array.isArray(data)
          ? [...data].map(item => ({
            ...item,
            band: Math.round((item.risk_score ?? 0) * 100) === 0 ? "Low" : item.band || "Moderate"
          })).sort(
            (a, b) =>
              new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
          )
          : [];
        setHistory(sorted);
      })
      .catch((err) => setHistoryError(err.message ?? "Failed to load history"))
      .finally(() => setHistoryLoading(false));
  }, [user]);

  const exportToCSV = () => {
    if (history.length === 0) {
      setCsvError("No records to export. Run at least one screening first.");
      setCsvStatus("error");
      return;
    }

    setCsvStatus("busy");
    setCsvError(null);

    try {
      const header = [
        "Date", "Age", "Sex", "CP", "Trestbps", "Chol", "Fbs",
        "Restecg", "Thalach", "Exang", "Oldpeak", "Slope", "Ca", "Thal",
        "Risk Score", "Band",
      ];

      const rows = history.map((r) =>
        [
          `" ${new Date(r.recorded_at).toLocaleString()}"`,
          r.age, r.sex, r.cp, r.trestbps, r.chol, r.fbs, r.restecg,
          r.thalach, r.exang, r.oldpeak, r.slope, r.ca, r.thal,
          r.risk_score != null ? (r.risk_score * 100).toFixed(1) : "",
          r.band ?? "",
        ].join(",")
      );

      const csvContent = header.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const currentDate = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `health_history_${user?.name ?? "user"}_${currentDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvStatus("done");
      setTimeout(() => setCsvStatus("idle"), 3000);
    } catch (err: any) {
      setCsvError(err?.message ?? "Failed to generate CSV");
      setCsvStatus("error");
    }
  };

  const downloadPDF = async () => {
    setPdfStatus("busy");
    setPdfError(null);

    try {
      const res = await fetch("/api/users/diagnosis/download", {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text
            ? `Server error (${res.status}): ${text.slice(0, 120)}`
            : `Server returned ${res.status}`
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `diagnosis_${user?.name ?? "user"}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setPdfStatus("done");
      setTimeout(() => setPdfStatus("idle"), 3000);
    } catch (err: any) {
      setPdfError(err?.message ?? "Failed to download PDF");
      setPdfStatus("error");
    }
  };

  if (loading) return <div className="p-8 text-sm">Loading…</div>;

  const recordCount = history.length;
  const latest = history[0];

  return (
    <div className="space-y-4">
      <Card title="Reports">
        {/* Summary strip */}
        <div
          className="rounded-2xl border p-4 mb-4 flex flex-wrap gap-4 items-center justify-between"
          style={{ borderColor: "var(--borderSoft)" }}
        >
          <div>
            <div className="text-sm font-semibold">
              {historyLoading
                ? "Loading records…"
                : historyError
                  ? "Could not load records"
                  : `${recordCount} screening record${recordCount !== 1 ? "s" : ""} on file`}
            </div>
            {latest && !historyLoading && (
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                Latest:{" "}
                {new Date(latest.recorded_at).toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                })}{" "}
                — Risk:{" "}
                <span style={{ fontWeight: 700 }}>
                  {latest.risk_score != null
                    ? `${Math.round(latest.risk_score * 100)}%`
                    : "—"}
                </span>{" "}
                ({latest.band ?? "—"})
              </div>
            )}
            {historyError && (
              <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#DC2626" }}>
                <AlertCircle className="h-3 w-3" />
                {historyError}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={() => router.push("/history")}>
            View full history →
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ borderColor: "var(--borderSoft)" }}
          >
            <div>
              <div className="font-semibold">Export screening history</div>
              <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Download all your health records as a CSV file — identical to
                the export on the dashboard, ready for analysis and documentation.
              </div>
            </div>

            {recordCount > 0 && !historyLoading && (
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {recordCount} record{recordCount !== 1 ? "s" : ""} will be exported
              </div>
            )}

            <Button
              variant="secondary"
              iconLeft={
                csvStatus === "busy" ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : csvStatus === "done" ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: "#16A34A" }} />
                ) : (
                  <Download className="h-4 w-4" />
                )
              }
              onClick={exportToCSV}
              disabled={csvStatus === "busy" || historyLoading}
            >
              {csvStatus === "busy" ? "Exporting…" : csvStatus === "done" ? "Downloaded!" : "Export CSV"}
            </Button>

            {csvStatus === "error" && csvError && (
              <div className="flex items-start gap-1 text-xs" style={{ color: "#DC2626" }}>
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {csvError}
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ borderColor: "var(--borderSoft)" }}
          >
            <div>
              <div className="font-semibold">Latest diagnosis PDF</div>
              <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Download a PDF report of your most recent diagnosis data,
                generated by the server and ready to share with your clinician.
              </div>
            </div>

            {latest && !historyLoading && (
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Latest record:{" "}
                {new Date(latest.recorded_at).toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </div>
            )}

            <Button
              iconLeft={
                pdfStatus === "busy" ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : pdfStatus === "done" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )
              }
              onClick={downloadPDF}
              disabled={pdfStatus === "busy" || historyLoading || recordCount === 0}
            >
              {pdfStatus === "busy"
                ? "Generating…"
                : pdfStatus === "done"
                  ? "Downloaded!"
                  : "Download PDF"}
            </Button>

            {recordCount === 0 && !historyLoading && (
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                No records yet.{" "}
                <button className="underline" onClick={() => router.push("/diagnosis")}>
                  Run a screening first.
                </button>
              </div>
            )}

            {pdfStatus === "error" && pdfError && (
              <div className="flex items-start gap-1 text-xs" style={{ color: "#DC2626" }}>
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {pdfError}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Back
          </Button>
          <Button variant="ghost" onClick={() => router.push("/results")}>
            Open results
          </Button>
          <Button variant="ghost" onClick={() => router.push("/diagnosis")}>
            New screening
          </Button>
        </div>
      </Card>
    </div>
  );
}
