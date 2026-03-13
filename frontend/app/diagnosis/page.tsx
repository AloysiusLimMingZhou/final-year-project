"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import SoftSelect from "../components/ui/Select";
import { ClipboardList, Loader2, ArrowRight, AlertTriangle, Info, X, UserCog } from "lucide-react";

type Band = "Low" | "Moderate" | "High";

type PredictResponse = {
  savedHealth: any;
  prediction: {
    model_version: string;
    probability: number;
    band: Band;
    risk_score: number;
  };
};

function riskTone(band: Band) {
  return band === "Low" ? "low" : band === "High" ? "high" : "mid";
}

export default function DiagnosisPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  // Profile data
  const [profileAge, setProfileAge] = React.useState<number | null>(null);
  const [profileSex, setProfileSex] = React.useState<number | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [showMissingPopup, setShowMissingPopup] = React.useState(false);

  // Backend DTO fields (age & sex fetched from profile)
  const [form, setForm] = React.useState({
    cp: 1,
    trestbps: 120,
    chol: 200,
    fbs: 0,
    restecg: 0,
    thalach: 170,
    exang: 0,
    oldpeak: 0.0,
    slope: 1,
    ca: 0,
    thal: 0,
  });

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();

        const age = data.age != null ? Number(data.age) : null;

        let sex: number | null = null;
        if (data.sex === "male") sex = 1;
        else if (data.sex === "female") sex = 0;
        else if (data.sex != null) sex = Number(data.sex);

        setProfileAge(age);
        setProfileSex(sex);

        if (age == null || sex == null) {
          setShowMissingPopup(true);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Could not load your profile. Please try again.");
      } finally {
        setProfileLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const profileMissing = profileAge == null || profileSex == null;

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    const numericFields = [
      { key: "trestbps", label: "Resting BP" },
      { key: "chol", label: "Cholesterol" },
      { key: "thalach", label: "Max HR" },
      { key: "oldpeak", label: "Oldpeak" },
    ];

    for (const { key, label } of numericFields) {
      const val = Number((form as any)[key]);
      if (val < 0) {
        errors[key] = `${label} cannot be negative`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (profileMissing) {
      setShowMissingPopup(true);
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/health/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          age: profileAge,
          sex: profileSex,
          cp: Number(form.cp),
          trestbps: Number(form.trestbps),
          chol: Number(form.chol),
          fbs: Number(form.fbs),
          restecg: Number(form.restecg),
          thalach: Number(form.thalach),
          exang: Number(form.exang),
          oldpeak: Number(form.oldpeak),
          slope: Number(form.slope),
          ca: Number(form.ca),
          thal: Number(form.thal),
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("Not logged in (401). Please login again.");
        throw new Error(msg || `Predict failed (${res.status})`);
      }

      const data = (await res.json()) as PredictResponse;

      sessionStorage.setItem("hc_latest_prediction", JSON.stringify(data));
      router.push("/results");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {showMissingPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              background: "var(--surface)",
              borderColor: "var(--borderSoft)",
              color: "var(--text)",
            }}
          >
            <button
              onClick={() => setShowMissingPopup(false)}
              className="absolute right-3 top-3 rounded-lg p-1 transition-colors hover:bg-black/10"
              type="button"
            >
              <X className="h-4 w-4" style={{ color: "var(--muted)" }} />
            </button>

            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="rounded-2xl border p-3"
                style={{
                  borderColor: "var(--borderSoft)",
                  background: "rgba(251,146,60,0.1)",
                }}
              >
                <UserCog className="h-8 w-8" style={{ color: "#FB923C" }} />
              </div>

              <h3 className="text-lg font-semibold">Profile Incomplete</h3>

              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Your <strong>age</strong> and <strong>sex</strong> are required for heart screening
                but are not set in your profile. Please update your profile before proceeding.
              </p>

              <div className="flex w-full gap-3">
                <Button variant="secondary" onClick={() => setShowMissingPopup(false)} type="button">
                  Cancel
                </Button>

                <Button
                  onClick={() => router.push("/profile")}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  type="button"
                >
                  Go to Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card title="Heart screening">
        {profileLoading ? (
          <div className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Loading your profile data…
          </div>
        ) : (
          <>
            <div
              className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm"
              style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
            >
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
              <div>
                <span className="font-semibold">Profile info:</span>{" "}
                Age = <strong>{profileAge ?? "Not set"}</strong>, Sex ={" "}
                <strong>
                  {profileSex === 1 ? "Male" : profileSex === 0 ? "Female" : "Not set"}
                </strong>
                {profileMissing && (
                  <span className="ml-2 text-xs" style={{ color: "#FB923C" }}>
                    — Please{" "}
                    <button
                      onClick={() => router.push("/profile")}
                      className="font-semibold underline"
                      style={{ color: "var(--accent)" }}
                      type="button"
                    >
                      update your profile
                    </button>
                  </span>
                )}
              </div>
            </div>

            {error ? (
              <div
                className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm"
                style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="font-semibold">Prediction failed</div>
                  <div style={{ color: "var(--muted)" }}>{error}</div>
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <FieldSelect
                  label="Chest pain (cp)"
                  value={form.cp}
                  onChange={(v) => setForm({ ...form, cp: v })}
                  options={[
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                    { label: "4", value: 4 },
                  ]}
                  description={
                    "chest pain type\n-- Value 1: typical angina\n-- Value 2: atypical angina\n-- Value 3: non-anginal pain\n-- Value 4: asymptomatic"
                  }
                />

                <FieldNumber
                  label="Resting BP (trestbps)"
                  value={form.trestbps}
                  onChange={(v) => setForm({ ...form, trestbps: v })}
                  description="resting blood pressure (in mm Hg on admission to the hospital)"
                  error={validationErrors.trestbps}
                  min={1}
                />

                <FieldNumber
                  label="Cholesterol (chol)"
                  value={form.chol}
                  onChange={(v) => setForm({ ...form, chol: v })}
                  description="serum cholestoral in mg/dl"
                  error={validationErrors.chol}
                  min={1}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FieldSelect
                  label="Fasting blood sugar (fbs)"
                  value={form.fbs}
                  onChange={(v) => setForm({ ...form, fbs: v })}
                  options={[
                    { label: "0", value: 0 },
                    { label: "1", value: 1 },
                  ]}
                  description="(fasting blood sugar > 120 mg/dl)  (1 = true; 0 = false)"
                />

                <FieldSelect
                  label="Rest ECG (restecg)"
                  value={form.restecg}
                  onChange={(v) => setForm({ ...form, restecg: v })}
                  options={[
                    { label: "0", value: 0 },
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                  ]}
                  description={
                    "resting electrocardiographic results\n-- Value 0: normal\n-- Value 1: having ST-T wave abnormality\n-- Value 2: showing probable or definite left ventricular hypertrophy"
                  }
                />

                <FieldNumber
                  label="Max HR (thalach)"
                  value={form.thalach}
                  onChange={(v) => setForm({ ...form, thalach: v })}
                  description="maximum heart rate achieved"
                  error={validationErrors.thalach}
                  min={1}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FieldSelect
                  label="Exercise angina (exang)"
                  value={form.exang}
                  onChange={(v) => setForm({ ...form, exang: v })}
                  options={[
                    { label: "0", value: 0 },
                    { label: "1", value: 1 },
                  ]}
                  description="exercise induced angina (1 = yes; 0 = no)"
                />

                <FieldNumber
                  label="Oldpeak"
                  step="0.1"
                  value={form.oldpeak}
                  onChange={(v) => setForm({ ...form, oldpeak: v })}
                  description="ST depression induced by exercise relative to rest"
                  error={validationErrors.oldpeak}
                  min={0}
                />

                <FieldSelect
                  label="Slope"
                  value={form.slope}
                  onChange={(v) => setForm({ ...form, slope: v })}
                  options={[
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                  ]}
                  description={
                    "the slope of the peak exercise ST segment\n-- Value 1: upsloping\n-- Value 2: flat\n-- Value 3: downsloping"
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FieldSelect
                  label="CA"
                  value={form.ca}
                  onChange={(v) => setForm({ ...form, ca: v })}
                  options={[
                    { label: "0", value: 0 },
                    { label: "1", value: 1 },
                    { label: "2", value: 2 },
                    { label: "3", value: 3 },
                  ]}
                  description="number of major vessels (0-3) colored by flourosopy"
                />

                <FieldSelect
                  label="Thal"
                  value={form.thal}
                  onChange={(v) => setForm({ ...form, thal: v })}
                  options={[
                    { label: "3", value: 0 },
                    { label: "6", value: 1 },
                    { label: "7", value: 2 },
                  ]}
                  description={"3 = normal\n6 = fixed defect\n7 = reversable defect (Thalassemia)"}
                />

                <div className="flex items-end justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/dashboard")}
                    iconLeft={<ClipboardList className="h-4 w-4" />}
                    type="button"
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={profileMissing || submitting}
                    iconLeft={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    iconRight={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
                  >
                    {submitting ? "Scanning..." : profileMissing ? "Profile incomplete" : "Scan now"}
                  </Button>
                </div>
              </div>

              <div
                className="rounded-xl border p-3 text-sm"
                style={{ borderColor: "var(--borderSoft)", color: "var(--muted)" }}
              >
                Educational estimate only. Not a medical diagnosis.
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  step,
  description,
  error,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  description?: string;
  error?: string;
  min?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
        {label}
        {description && (
          <div className="group relative flex cursor-help items-center">
            <Info className="h-3.5 w-3.5" />
            <div
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 whitespace-pre-wrap rounded-xl border p-2.5 text-xs font-normal leading-relaxed opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              style={{
                background: "var(--surface)",
                borderColor: "var(--borderSoft)",
                color: "var(--text)",
              }}
            >
              {description}
            </div>
          </div>
        )}
      </div>

      <input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm"
        style={{
          borderColor: error ? "#EF4444" : "var(--borderSoft)",
          color: "var(--text)",
        }}
      />

      {error && (
        <div className="mt-1 text-xs" style={{ color: "#EF4444" }}>
          {error}
        </div>
      )}
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { label: string; value: number }[];
  description?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
        {label}
        {description && (
          <div className="group relative flex cursor-help items-center">
            <Info className="h-3.5 w-3.5" />
            <div
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 whitespace-pre-wrap rounded-xl border p-2.5 text-xs font-normal leading-relaxed opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              style={{
                background: "var(--surface)",
                borderColor: "var(--borderSoft)",
                color: "var(--text)",
              }}
            >
              {description}
            </div>
          </div>
        )}
      </div>

      <SoftSelect
        value={String(value)}
        onChange={(v: string) => onChange(Number(v))}
        options={options.map((o) => ({
          label: o.label,
          value: String(o.value),
        }))}
      />
    </label>
  );
}