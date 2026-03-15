"use client";

import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Mail,
  CheckCircle,
  Building2,
  MapPin,
  Navigation,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Band = "Low" | "Moderate" | "High";
type Stored = {
  savedHealth: any;
  prediction: { model_version: string; probability: number; band: Band; risk_score: number };
};
type EmailStatus = "idle" | "sending" | "sent" | "error";
type EmergencyEmailStatus = "idle" | "sending" | "sent" | "error";

interface Hospital {
  name: string;
  type: string;
  distance: number; // km
  latitude: number;
  longitude: number;
}

type HospitalLoadState = "idle" | "loading" | "done" | "error" | "unavailable";

function mapsUrl(lat: number, lng: number, name: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&center=${lat},${lng}`;
}

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function HospitalCard({ hospital }: { hospital: Hospital }) {
  const isHospital = hospital.type === "hospital";

  return (
    <a
      href={mapsUrl(hospital.latitude, hospital.longitude, hospital.name)}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: "10px",
        border: "1px solid var(--hc-border, rgba(255,255,255,0.1))",
        background: "var(--hc-surface, rgba(0,0,0,0.15))",
        padding: "14px 16px",
        transition: "box-shadow 0.18s, border-color 0.18s, transform 0.18s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent, #6366f1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hc-border, rgba(255,255,255,0.1))";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: isHospital
              ? "rgba(229,62,62,0.10)"
              : "rgba(99,102,241,0.10)",
            color: isHospital ? "#e53e3e" : "#6366f1",
          }}
        >
          <Building2 size={17} />
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--hc-text, #f8fafc)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
              title={hospital.name}
            >
              {hospital.name}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: isHospital ? "rgba(229,62,62,0.12)" : "rgba(99,102,241,0.12)",
                color: isHospital ? "#c53030" : "#4f46e5",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {typeLabel(hospital.type)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 5,
            }}
          >
            <Navigation size={12} style={{ color: "var(--hc-muted, #94a3b8)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--hc-muted, #94a3b8)" }}>
              {hospital.distance} km away
            </span>
            <ExternalLink
              size={11}
              style={{ marginLeft: "auto", color: "var(--hc-muted, #94a3b8)", flexShrink: 0 }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

// Main Page

export default function ResultsPage() {
  const router = useRouter();

  // prediction state
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<Stored | null>(null);

  // email state
  const [emailStatus, setEmailStatus] = React.useState<EmailStatus>("idle");
  const [emailError, setEmailError] = React.useState<string | null>(null);

  // emergency contact email state
  const [emergencyEmailStatus, setEmergencyEmailStatus] = React.useState<EmergencyEmailStatus>("idle");
  const [emergencyEmailError, setEmergencyEmailError] = React.useState<string | null>(null);
  const [emergencyContactEmail, setEmergencyContactEmail] = React.useState<string | null>(null);
  const [emergencyContactVerified, setEmergencyContactVerified] = React.useState(false);

  // hospitals state – lazy loaded independently
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [hospitalState, setHospitalState] = React.useState<HospitalLoadState>("idle");
  const [hospitalError, setHospitalError] = React.useState<string | null>(null);

  // Load prediction result
  React.useEffect(() => {
    const raw = sessionStorage.getItem("hc_latest_prediction");
    if (raw) {
      try {
        setData(JSON.parse(raw));
        setLoading(false);
        return;
      } catch { }
    }

    (async () => {
      try {
        const res = await fetch("/api/health/history", { credentials: "include" });
        const hist = await res.json();
        if (Array.isArray(hist) && hist.length > 0) {
          const h = hist[0];
          setData({
            savedHealth: h,
            prediction: {
              model_version: "history",
              probability: h.probability ?? h.risk_score ?? 0,
              band: (Math.round((h.risk_score ?? 0) * 100) === 0 ? "Low" : h.band) as Band,
              risk_score: h.risk_score ?? 0,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Fetch user profile for emergency contact status ───────────────────────
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/profile", { credentials: "include" });
        if (res.ok) {
          const profile = await res.json();
          setEmergencyContactEmail(profile.emergency_contact_email || null);
          setEmergencyContactVerified(profile.emergency_contact_isverified === true);
        }
      } catch { }
    })();
  }, []);

  // Lazily load hospitals once prediction is done
  React.useEffect(() => {
    if (loading) return; // wait until prediction is resolved first
    setHospitalState("loading");

    (async () => {
      try {
        const res = await fetch("/api/health/hospitals", { credentials: "include" });
        if (res.status === 400 || res.status === 404) {
          // No location set on user profile
          setHospitalState("unavailable");
          return;
        }
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const list: Hospital[] = await res.json();
        setHospitals(list);
        setHospitalState("done");
      } catch (err: any) {
        setHospitalError(err?.message ?? "Could not fetch nearby hospitals.");
        setHospitalState("error");
      }
    })();
  }, [loading]); // fires as soon as loading flips to false

  // Email handler
  const handleSendEmail = async () => {
    setEmailStatus("sending");
    setEmailError(null);
    try {
      const res = await fetch("/api/health/send-report-email", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Server error ${res.status}`);
      }
      setEmailStatus("sent");
    } catch (err: any) {
      setEmailError(err?.message ?? "Failed to send email. Please try again.");
      setEmailStatus("error");
    }
  };

  // Emergency email handler
  const handleSendEmergencyEmail = async () => {
    setEmergencyEmailStatus("sending");
    setEmergencyEmailError(null);
    try {
      const res = await fetch("/api/users/send-emergency-contact-email", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Server error ${res.status}`);
      }
      setEmergencyEmailStatus("sent");
    } catch (err: any) {
      setEmergencyEmailError(err?.message ?? "Failed to send email.");
      setEmergencyEmailStatus("error");
    }
  };

  // Prediction loading skeleton
  if (loading) {
    return (
      <Card title="Latest result">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title="Latest result">
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          No result found yet. Run a screening first.
        </div>
        <div className="mt-4">
          <Button onClick={() => router.push("/diagnosis")}>Go to screening</Button>
        </div>
      </Card>
    );
  }

  const band = data.prediction.band;
  const score = Math.round((data.prediction.risk_score ?? 0) * 100);
  const tone = band === "Low" ? "low" : band === "High" ? "high" : "mid";
  const Icon = tone === "low" ? CheckCircle2 : tone === "mid" ? AlertTriangle : XCircle;

  // Render
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Result card */}
      <Card title="Latest result">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8" style={{ color: "var(--accent)" }} />
          <div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Risk estimate
            </div>
            <div className="text-2xl font-semibold">{score}%</div>
            <div className="mt-2">
              <Badge tone={tone}>{band}</Badge>
            </div>
            <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              Model:{" "}
              <span style={{ color: "var(--text)", fontWeight: 700 }}>
                {data.prediction.model_version}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
          <Button onClick={() => router.push("/diagnosis")}>New screening</Button>
          <Button variant="secondary" onClick={() => router.push("/reports")}>
            Reports
          </Button>
        </div>
      </Card>

      {/* Email card */}
      <Card title="Email my results">
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Receive a copy of your latest screening result directly in your inbox. The email colour
          will reflect your risk level — green for low, orange for moderate, and red for high risk.
        </p>

        <div className="flex gap-2 flex-wrap items-center">
          {emailStatus === "sent" ? (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{
                background: "rgba(56,161,105,0.12)",
                color: "#276749",
                border: "1px solid #38a169",
              }}
            >
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Report sent to your inbox
            </div>
          ) : (
            <Button
              onClick={handleSendEmail}
              disabled={emailStatus === "sending"}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {emailStatus === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send report to my email
                </>
              )}
            </Button>
          )}

          {/* Emergency Contact Button - only shown when verified */}
          {emergencyContactEmail && emergencyContactVerified && (
            emergencyEmailStatus === "sent" ? (
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{
                  background: "rgba(56,161,105,0.12)",
                  color: "#276749",
                  border: "1px solid #38a169",
                }}
              >
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                Sent to emergency contact!
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={handleSendEmergencyEmail}
                disabled={emergencyEmailStatus === "sending"}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {emergencyEmailStatus === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Send to emergency contact
                  </>
                )}
              </Button>
            )
          )}
        </div>

        {emailStatus === "error" && emailError && (
          <p
            className="mt-3 text-xs rounded px-3 py-2"
            style={{
              color: "#c53030",
              background: "rgba(229,62,62,0.08)",
              border: "1px solid rgba(229,62,62,0.3)",
            }}
          >
            {emailError}
          </p>
        )}

        {emergencyEmailStatus === "error" && emergencyEmailError && (
          <p
            className="mt-3 text-xs rounded px-3 py-2"
            style={{
              color: "#c53030",
              background: "rgba(229,62,62,0.08)",
              border: "1px solid rgba(229,62,62,0.3)",
            }}
          >
            {emergencyEmailError}
          </p>
        )}
      </Card>

      {/* Nearby Hospitals card */}
      <Card title="Nearby hospitals & clinics">
        {/* Loading */}
        {hospitalState === "loading" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "28px 0",
            }}
          >
            {/* Animated pulse ring */}
            <div style={{ position: "relative", width: 48, height: 48 }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "3px solid var(--accent, #6366f1)",
                  opacity: 0.25,
                  animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
              <MapPin
                size={24}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "var(--accent, #6366f1)",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--muted, #718096)",
                margin: 0,
                textAlign: "center",
              }}
            >
              Searching for hospitals near you…
              <br />
              <span style={{ fontSize: 11 }}>This may take a few seconds</span>
            </p>
            <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
          </div>
        )}

        {/* No location set */}
        {hospitalState === "unavailable" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "14px",
              borderRadius: 8,
              background: "rgba(160,174,192,0.08)",
              border: "1px solid rgba(160,174,192,0.25)",
            }}
          >
            <MapPin size={16} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              No location found on your profile. Update your location in{" "}
              <button
                onClick={() => router.push("/profile")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Profile settings
              </button>{" "}
              to see nearby hospitals.
            </p>
          </div>
        )}

        {/* Error */}
        {hospitalState === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "14px",
              borderRadius: 8,
              background: "rgba(229,62,62,0.06)",
              border: "1px solid rgba(229,62,62,0.25)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "#e53e3e", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "#c53030", fontWeight: 600 }}>
                Could not load nearby hospitals
              </p>
              {hospitalError && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  {hospitalError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty result */}
        {hospitalState === "done" && hospitals.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "24px 0",
              color: "var(--muted)",
            }}
          >
            <Building2 size={28} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 13, textAlign: "center" }}>
              No hospitals or clinics found within 5 km of your location.
            </p>
          </div>
        )}

        {/* Hospital list */}
        {hospitalState === "done" && hospitals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>
              Showing {hospitals.length} nearest result{hospitals.length !== 1 ? "s" : ""} within 5 km · click any to open in Google Maps
            </p>
            {hospitals.map((h, i) => (
              <HospitalCard key={`${h.name}-${i}`} hospital={h} />
            ))}
          </div>
        )}
      </Card>

      {/* Reminder card */}
      <Card title="Reminder">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Educational estimate only. Not a medical diagnosis. If you feel unwell or at risk, consult
          a qualified clinician.
        </p>
      </Card>
    </div >
  );
}
