"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { HeartPulse, ClipboardList, MessageSquare, ChevronRight, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  AreaChart as ReAreaChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import SoftSelect from "../components/ui/Select";

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
  risk_score: number; // 0..1
  band: string; // backend string (Low/Medium/High etc.)
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function bandTone(bandRaw: string): "low" | "mid" | "high" | "info" {
  const b = (bandRaw || "").toLowerCase();
  if (b.includes("high")) return "high";
  if (b.includes("low")) return "low";
  if (b.includes("mod") || b.includes("med")) return "mid"; // moderate/medium
  return "info";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [tableHistory, setTableHistory] = useState<HealthRecord[]>([]);
  const [chartHistory, setChartHistory] = useState<HealthRecord[]>([]);
  const [expandedTable, setExpandedTable] = useState(false);

  // scopes
  const [trendScope, setTrendScope] = useState<"12" | "24" | "ytd" | "all" | "custom">("12");
  const [customN, setCustomN] = useState<number>(12);

  const [cholScope, setCholScope] = useState<"12" | "24" | "ytd" | "all" | "custom">("12");
  const [cholCustomN, setCholCustomN] = useState<number>(12);

  const [bpScope, setBpScope] = useState<"12" | "24" | "ytd" | "all" | "custom">("12");
  const [bpCustomN, setBpCustomN] = useState<number>(12);

  const requestLocation = async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await fetch("/api/users/location", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
        } catch (err) {
          console.error("Failed to update location", err);
        }
      },
      (err) => {
        console.error("Location Permission denied", err);
      }
    );
  };

  useEffect(() => {
    if (user) {
      requestLocation();

      fetch("/api/health/history")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch history");
          return res.json();
        })
        .then((data) => {
          if (!Array.isArray(data)) {
            console.error("History is not an array:", data);
            setChartHistory([]);
            setTableHistory([]);
            return;
          }

          const processedData = data.map((item: any) => ({
            ...item,
            band: Math.round((item.risk_score ?? 0) * 100) === 0 ? "Low" : item.band || "Moderate",
          }));

          const asc = [...processedData].sort(
            (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
          );
          const desc = [...asc].slice().reverse();

          setChartHistory(asc); // charts = ascending
          setTableHistory(desc); // table = newest first
        })
        .catch((err) => console.error("Failed to fetch history", err));
    }
  }, [user]);

  const exportToCSV = () => {
    if (tableHistory.length === 0) return;

    const header = [
      "Date",
      "Age",
      "Sex",
      "CP",
      "Trestbps",
      "Chol",
      "Fbs",
      "Restecg",
      "Thalach",
      "Exang",
      "Oldpeak",
      "Slope",
      "Ca",
      "Thal",
      "Risk Score",
      "Band",
    ];

    const rows = tableHistory.map((r) =>
      [
        `" ${new Date(r.recorded_at).toLocaleString()}"`,
        r.age,
        r.sex,
        r.cp,
        r.trestbps,
        r.chol,
        r.fbs,
        r.restecg,
        r.thalach,
        r.exang,
        r.oldpeak,
        r.slope,
        r.ca,
        r.thal,
        r.risk_score,
        r.band,
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
  };

  const sliceByScope = useMemo(() => {
    return (scope: "12" | "24" | "ytd" | "all" | "custom", n: number, source: HealthRecord[]) => {
      if (!source.length) return source;
      const sorted = [...source].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      const latest = sorted[sorted.length - 1];

      switch (scope) {
        case "12":
          return sorted.slice(-12);
        case "24":
          return sorted.slice(-24);
        case "all":
          return sorted;
        case "ytd": {
          const y = new Date(latest.recorded_at).getFullYear();
          return sorted.filter((h) => new Date(h.recorded_at).getFullYear() === y);
        }
        case "custom":
          return sorted.slice(-Math.max(2, Math.min(60, n || 12)));
        default:
          return sorted.slice(-12);
      }
    };
  }, []);

  const trendHistory = useMemo(() => sliceByScope(trendScope, customN, chartHistory), [chartHistory, trendScope, customN, sliceByScope]);
  const cholHistory = useMemo(() => sliceByScope(cholScope, cholCustomN, chartHistory), [chartHistory, cholScope, cholCustomN, sliceByScope]);
  const bpHistory = useMemo(() => sliceByScope(bpScope, bpCustomN, chartHistory), [chartHistory, bpScope, bpCustomN, sliceByScope]);

  const latest = tableHistory[0];

  const avg7 = useMemo(() => {
    const last7 = chartHistory.slice(-7);
    if (!last7.length) return 0;
    return Math.round((last7.reduce((a, b) => a + b.risk_score, 0) / last7.length) * 100);
  }, [chartHistory]);

  const deltaRisk = useMemo(() => {
    if (chartHistory.length < 2) return { label: "—", delta: 0 };
    const a = chartHistory[chartHistory.length - 2].risk_score;
    const b = chartHistory[chartHistory.length - 1].risk_score;
    const d = Math.round((b - a) * 100);
    return { label: d > 0 ? `+${d}%` : `${d}%`, delta: d };
  }, [chartHistory]);

  const cholDelta = useMemo(() => {
    if (cholHistory.length < 2) return null;
    return cholHistory[cholHistory.length - 1].chol - cholHistory[cholHistory.length - 2].chol;
  }, [cholHistory]);

  const bpDelta = useMemo(() => {
    if (bpHistory.length < 2) return null;
    return bpHistory[bpHistory.length - 1].trestbps - bpHistory[bpHistory.length - 2].trestbps;
  }, [bpHistory]);

  const trendData = useMemo(
    () =>
      trendHistory.map((h) => ({
        date: formatShortDate(h.recorded_at),
        scorePct: Math.round(h.risk_score * 100),
        band: h.band,
      })),
    [trendHistory]
  );

  const cholData = useMemo(
    () => cholHistory.map((h) => ({ date: formatShortDate(h.recorded_at), value: h.chol })),
    [cholHistory]
  );

  const bpData = useMemo(
    () =>
      bpHistory.map((h) => ({
        date: formatShortDate(h.recorded_at),
        bp: h.trestbps,
        maxHr: h.thalach,
      })),
    [bpHistory]
  );

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-[90rem] px-3 py-6 md:px-4 space-y-4">
      {/* Header strip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-2xl p-5 border"
        style={{ background: "var(--hc-surface)", borderColor: "var(--hc-border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
              Dashboard
            </div>
            <div className="mt-1 text-2xl font-semibold" style={{ color: "var(--hc-text)" }}>
              Overview
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--hc-muted)" }}>
              Quick, calm, and focused.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/diagnosis")} iconLeft={<ClipboardList className="h-4 w-4" />}>
              New screening
            </Button>
            <Button onClick={() => router.push("/chat")} iconLeft={<MessageSquare className="h-4 w-4" />}>
              Assistant
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Top row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl p-3 border" style={{ borderColor: "var(--hc-border)" }}>
                <HeartPulse className="h-6 w-6" style={{ color: "var(--hc-accent)" }} />
              </div>

              <div>
                <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                  Latest risk estimate
                </div>

                <div className="mt-1 text-4xl font-semibold" style={{ color: "var(--hc-text)" }}>
                  {latest ? `${Math.round(latest.risk_score * 100)}%` : "—"}
                </div>

                <div className="mt-2">
                  <Badge tone={latest ? bandTone(latest.band) : "info"}>{latest?.band ?? "No data"}</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => router.push("/diagnosis")} iconRight={<ChevronRight className="h-4 w-4" />}>
                View details
              </Button>
              <Button variant="secondary" onClick={exportToCSV} iconLeft={<Download className="h-4 w-4" />}>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-xl p-3 text-sm border" style={{ borderColor: "var(--hc-border)", color: "var(--hc-muted)" }}>
            Educational estimate only. Not a medical diagnosis. If you feel unwell or at risk, consult a qualified clinician.
          </div>
        </Card>

        <Card
          title="Heart disease risk trend"
          headerRight={
            <div className="flex items-center gap-2">
              <div className="w-32">
                <SoftSelect
                  value={trendScope}
                  onChange={(v) => setTrendScope(v as any)}
                  options={[
                    { label: "Last 12", value: "12" },
                    { label: "Last 24", value: "24" },
                    { label: "YTD", value: "ytd" },
                    { label: "All", value: "all" },
                    { label: "Custom", value: "custom" },
                  ]}
                />
              </div>

              {trendScope === "custom" ? (
                <input
                  value={customN}
                  onChange={(e) => setCustomN(Number(e.target.value))}
                  type="number"
                  min={2}
                  max={60}
                  className="w-16 rounded-xl border bg-transparent px-2 py-1 text-xs"
                  style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                />
              ) : null}
            </div>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm" style={{ color: "var(--hc-muted)" }}>
              {trendScope === "12"
                ? "Last 12 screenings"
                : trendScope === "24"
                  ? "Last 24 screenings"
                  : trendScope === "ytd"
                    ? "Year-to-date"
                    : trendScope === "all"
                      ? "All screenings"
                      : `Last ${Math.max(2, Math.min(60, customN || 12))} screenings`}
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-1 text-xs border" style={{ borderColor: "var(--hc-border)", color: "var(--hc-muted)" }}>
                Avg (7): <span style={{ color: "var(--hc-text)", fontWeight: 700 }}>{avg7}%</span>
              </span>

              <span
                className="rounded-full px-2 py-1 text-xs border"
                style={{
                  borderColor: "var(--hc-border)",
                  color: deltaRisk.delta > 0 ? "#DC2626" : deltaRisk.delta < 0 ? "#16A34A" : "var(--hc-muted)",
                }}
              >
                Δ last: <span style={{ fontWeight: 800 }}>{deltaRisk.label}</span>
              </span>
            </div>
          </div>

          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ReAreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--hc-accent)" stopOpacity={0.28} />
                    <stop offset="75%" stopColor="var(--hc-accent)" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="var(--hc-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.25)" />
                <XAxis dataKey="date" tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "var(--hc-surface)",
                    border: "1px solid var(--hc-border)",
                    borderRadius: 12,
                    color: "var(--hc-text)",
                  }}
                  labelStyle={{ color: "var(--hc-muted)" }}
                  formatter={(value: any, _name: any, item: any) => {
                    const band = item?.payload?.band;
                    return [`${value}% (${band})`, "Risk"];
                  }}
                />
                <Area type="monotone" dataKey="scorePct" stroke="var(--hc-accent)" fill="url(#riskFill)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </ReAreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Lower analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Cholesterol level (mg/dl)"
          headerRight={
            <div className="flex items-center gap-2">
              <div className="w-32">
                <SoftSelect
                  value={cholScope}
                  onChange={(v) => setCholScope(v as any)}
                  options={[
                    { label: "Last 12", value: "12" },
                    { label: "Last 24", value: "24" },
                    { label: "YTD", value: "ytd" },
                    { label: "All", value: "all" },
                    { label: "Custom", value: "custom" },
                  ]}
                />
              </div>

              {cholScope === "custom" ? (
                <input
                  value={cholCustomN}
                  onChange={(e) => setCholCustomN(Number(e.target.value))}
                  type="number"
                  min={2}
                  max={60}
                  className="w-16 rounded-xl border bg-transparent px-2 py-1 text-xs"
                  style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                />
              ) : null}
            </div>
          }
        >
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
              {cholScope}
            </div>

            <span
              className="rounded-full px-2 py-1 text-xs border"
              style={{
                borderColor: "var(--hc-border)",
                color: cholDelta == null ? "var(--hc-muted)" : cholDelta > 0 ? "#DC2626" : cholDelta < 0 ? "#16A34A" : "var(--hc-muted)",
              }}
            >
              Δ last: <span style={{ fontWeight: 800 }}>{cholDelta == null ? "—" : cholDelta > 0 ? `+${cholDelta}` : `${cholDelta}`}</span>
            </span>
          </div>

          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={cholData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.20)" />
                <XAxis dataKey="date" tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--hc-surface)", border: "1px solid var(--hc-border)", borderRadius: 12, color: "var(--hc-text)" }}
                  labelStyle={{ color: "var(--hc-muted)" }}
                />
                <Line type="monotone" dataKey="value" stroke="rgba(99,102,241,1)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Blood pressure vs max heart rate"
          headerRight={
            <div className="flex items-center gap-2">
              <div className="w-32">
                <SoftSelect
                  value={bpScope}
                  onChange={(v) => setBpScope(v as any)}
                  options={[
                    { label: "Last 12", value: "12" },
                    { label: "Last 24", value: "24" },
                    { label: "YTD", value: "ytd" },
                    { label: "All", value: "all" },
                    { label: "Custom", value: "custom" },
                  ]}
                />
              </div>

              {bpScope === "custom" ? (
                <input
                  value={bpCustomN}
                  onChange={(e) => setBpCustomN(Number(e.target.value))}
                  type="number"
                  min={2}
                  max={60}
                  className="w-16 rounded-xl border bg-transparent px-2 py-1 text-xs"
                  style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                />
              ) : null}
            </div>
          }
        >
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
              {bpScope}
            </div>

            <span
              className="rounded-full px-2 py-1 text-xs border"
              style={{
                borderColor: "var(--hc-border)",
                color: bpDelta == null ? "var(--hc-muted)" : bpDelta > 0 ? "#DC2626" : bpDelta < 0 ? "#16A34A" : "var(--hc-muted)",
              }}
            >
              Δ BP last: <span style={{ fontWeight: 800 }}>{bpDelta == null ? "—" : bpDelta > 0 ? `+${bpDelta}` : `${bpDelta}`}</span>
            </span>
          </div>

          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={bpData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.20)" />
                <XAxis dataKey="date" tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--hc-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--hc-surface)", border: "1px solid var(--hc-border)", borderRadius: 12, color: "var(--hc-text)" }}
                  labelStyle={{ color: "var(--hc-muted)" }}
                />
                <Legend wrapperStyle={{ color: "var(--hc-muted)", fontSize: 12 }} />
                <Line type="monotone" dataKey="maxHr" name="Max heart rate" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="bp" name="Resting blood pressure" stroke="var(--hc-accent)" strokeWidth={2} dot={{ r: 2 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Records */}
      <Card title="Recent health records">
        {tableHistory.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--hc-muted)" }}>
            No records found. Start by running a diagnosis.
          </div>
        ) : (
          <>
            <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--hc-border)" }}>
              <table className="min-w-full text-sm">
                <thead style={{ background: "rgba(100,116,139,0.08)" }}>
                  <tr>
                    {["Date", "Age", "BP", "Chol", "Max HR", "Risk", "Band"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--hc-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(expandedTable ? tableHistory : tableHistory.slice(0, 5)).map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: "var(--hc-border)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--hc-muted)" }}>
                        {new Date(r.recorded_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">{r.age}</td>
                      <td className="px-3 py-2">{r.trestbps}</td>
                      <td className="px-3 py-2">{r.chol}</td>
                      <td className="px-3 py-2">{r.thalach}</td>
                      <td className="px-3 py-2">{Math.round(r.risk_score * 100)}%</td>
                      <td className="px-3 py-2">
                        <span style={{ fontWeight: 800, color: r.band?.toLowerCase().includes("high") ? "#DC2626" : r.band?.toLowerCase().includes("low") ? "#16A34A" : "#F59E0B" }}>
                          {r.band}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => router.push("/history")}>
                View all history
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
