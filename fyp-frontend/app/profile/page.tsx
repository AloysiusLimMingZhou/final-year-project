"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { UserCircle2, Stethoscope, ShieldCheck, ShieldX, KeyRound, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type ProfileApi = {
  id: string;
  name: string;
  email?: string;
  roles?: string[];
  age?: number | null;
  sex?: string | null;
  emergency_contact_email?: string | null;
  provider?: string | null;
  isverified?: boolean;
  emergency_contact_isverified?: boolean;
  // Doctor-specific fields
  specialization?: string | null;
  place_of_practice?: string | null;
  years_of_experience?: number | null;
  phone_number?: string | null;
};

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [profile, setProfile] = React.useState<ProfileApi | null>(null);
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState<string>("");
  const [sex, setSex] = React.useState<string>("");
  const [emergencyEmail, setEmergencyEmail] = React.useState("");
  const [originalEmergencyEmail, setOriginalEmergencyEmail] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Doctor fields
  const [specialization, setSpecialization] = React.useState("");
  const [placeOfPractice, setPlaceOfPractice] = React.useState("");
  const [yearsOfExperience, setYearsOfExperience] = React.useState<string>("");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // Sex categories from API
  const [sexCategories, setSexCategories] = React.useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Toast notifications
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  // Change Password OTP modal
  const [showPasswordOTP, setShowPasswordOTP] = React.useState(false);
  const [passwordOtp, setPasswordOtp] = React.useState("");
  const [passwordOtpError, setPasswordOtpError] = React.useState("");
  const [passwordOtpLoading, setPasswordOtpLoading] = React.useState(false);
  const [passwordOtpSending, setPasswordOtpSending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Emergency Contact OTP modal
  const [showEmergencyOTP, setShowEmergencyOTP] = React.useState(false);
  const [emergencyOtp, setEmergencyOtp] = React.useState("");
  const [emergencyOtpError, setEmergencyOtpError] = React.useState("");
  const [emergencyOtpLoading, setEmergencyOtpLoading] = React.useState(false);
  const [emergencyOtpSending, setEmergencyOtpSending] = React.useState(false);

  const isAdmin = (profile?.roles || []).some((r) => String(r).toLowerCase() === "admin");
  const isDoctor = (user?.roles || []).some((r) => String(r).toLowerCase() === "doctor");
  const isLocal = profile?.provider === "local";

  function addToast(message: string, type: Toast["type"] = "info") {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // Fetch sex categories and profile in parallel
        const [profileRes, sexRes] = await Promise.all([
          fetch("/api/users/profile", { cache: "no-store" }),
          fetch("/api/users/sex-category"),
        ]);

        if (!profileRes.ok) throw new Error(await profileRes.text());
        const data = (await profileRes.json()) as ProfileApi;

        let categories = ["male", "female"];
        try {
          const sexData = await sexRes.json();
          if (Array.isArray(sexData) && sexData.length > 0) categories = sexData;
        } catch { }

        if (!mounted) return;

        setProfile(data);
        setName(data.name ?? "");
        setAge(data.age != null ? String(data.age) : "");
        setSex(data.sex ?? "");
        setEmergencyEmail(data.emergency_contact_email ?? "");
        setOriginalEmergencyEmail(data.emergency_contact_email ?? "");
        setSexCategories(categories);

        // Doctor fields
        if (data.specialization != null) setSpecialization(data.specialization);
        if (data.place_of_practice != null) setPlaceOfPractice(data.place_of_practice);
        if (data.years_of_experience != null) setYearsOfExperience(String(data.years_of_experience));
        if (data.phone_number != null) setPhoneNumber(data.phone_number);

        if (data.id) {
          const key = `hc_avatar_${data.id}`;
          const stored = localStorage.getItem(key);
          setAvatarUrl(stored);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onPickAvatar(file?: File) {
    if (!file) return;
    if (!profile?.id) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please use an image under 2MB.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    const key = `hc_avatar_${profile.id}`;
    localStorage.setItem(key, dataUrl);
    setAvatarUrl(dataUrl);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Name cannot be empty.";

    if (age !== "" && Number(age) < 0) errs.age = "Age cannot be negative.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emergencyEmail && !emailRegex.test(emergencyEmail)) {
      errs.emergencyEmail = "Invalid email format.";
    }

    if (isDoctor) {
      if (yearsOfExperience !== "" && Number(yearsOfExperience) < 0) {
        errs.yearsOfExperience = "Years of experience cannot be negative.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function saveProfile() {
    if (saving) return;
    if (!profile?.id) return;

    if (!validate()) return;

    const emergencyEmailChanged = emergencyEmail !== originalEmergencyEmail;

    try {
      setSaving(true);

      const body: any = {
        name: name.trim(),
      };
      if (age !== "") body.age = Number(age);
      if (sex) body.sex = sex;
      if (emergencyEmail) body.emergency_contact_email = emergencyEmail;
      else body.emergency_contact_email = null;

      // Doctor fields (only if doctor role)
      if (isDoctor) {
        if (specialization) body.specialization = specialization;
        if (placeOfPractice) body.place_of_practice = placeOfPractice;
        if (yearsOfExperience !== "") body.years_of_experience = Number(yearsOfExperience);
        if (phoneNumber) body.phone_number = phoneNumber;
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      await refresh(); // update header name

      setProfile((p) => (p ? {
        ...p,
        name: name.trim(),
        age: age ? Number(age) : p.age,
        sex: sex || p.sex,
        emergency_contact_email: emergencyEmail || null,
        emergency_contact_isverified: emergencyEmailChanged ? false : p.emergency_contact_isverified,
      } : p));

      setOriginalEmergencyEmail(emergencyEmail);
      addToast("Profile updated successfully!", "success");

      // If emergency email changed, send re-verification
      if (emergencyEmailChanged && emergencyEmail) {
        try {
          await fetch("/api/users/resend-emergency-verification", {
            method: "POST",
            credentials: "include",
          });
          addToast(`Verification email sent to ${emergencyEmail}`, "info");
        } catch {
          addToast("Failed to send verification email to emergency contact.", "error");
        }
      }
    } catch (e: any) {
      addToast(e?.message ?? "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  // Change Password Flow
  async function handleRequestPasswordChange() {
    setPasswordOtpSending(true);
    setPasswordOtpError("");
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to send verification email.");
      }
      setShowPasswordOTP(true);
      setResendCooldown(60);
      addToast("Verification code sent to your email.", "info");
    } catch (e: any) {
      addToast(e?.message ?? "Failed to request password change.", "error");
    } finally {
      setPasswordOtpSending(false);
    }
  }

  async function handleVerifyPasswordOTP() {
    if (!passwordOtp || passwordOtp.length !== 6) {
      setPasswordOtpError("Please enter the 6-digit code.");
      return;
    }
    setPasswordOtpLoading(true);
    setPasswordOtpError("");
    try {
      const res = await fetch("/api/email-verify/verify-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email || user?.email, otp: passwordOtp }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Invalid OTP");
      }
      const data = await res.json();

      // Store session token in sessionStorage for the change-password page
      sessionStorage.setItem("hc_password_session", data.sessionToken);
      setShowPasswordOTP(false);
      setPasswordOtp("");
      router.push("/profile/change-password");
    } catch (e: any) {
      setPasswordOtpError(e?.message || "Verification failed.");
    } finally {
      setPasswordOtpLoading(false);
    }
  }

  async function handleResendPasswordOTP() {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch("/api/email-verify/resend-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email || user?.email }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      setResendCooldown(60);
      addToast("Verification code resent.", "info");
    } catch {
      setPasswordOtpError("Failed to resend code.");
    }
  }

  // Emergency Contact Verification Flow
  async function handleRequestEmergencyOTP() {
    setEmergencyOtpSending(true);
    setEmergencyOtpError("");
    try {
      const res = await fetch("/api/users/resend-emergency-verification", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send verification email.");
      setShowEmergencyOTP(true);
      setResendCooldown(60);
      addToast("Verification code sent to emergency contact.", "info");
    } catch {
      addToast("Failed to request verification email.", "error");
    } finally {
      setEmergencyOtpSending(false);
    }
  }

  async function handleVerifyEmergencyOTP() {
    if (!emergencyOtp || emergencyOtp.length !== 6) {
      setEmergencyOtpError("Please enter the 6-digit code.");
      return;
    }
    setEmergencyOtpLoading(true);
    setEmergencyOtpError("");
    try {
      const res = await fetch("/api/email-verify/verify-emergency-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.emergency_contact_email, otp: emergencyOtp }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Invalid OTP");
      }
      setShowEmergencyOTP(false);
      setEmergencyOtp("");
      addToast("Emergency contact email verified!", "success");
      await refresh();
      setProfile((p) => p ? { ...p, emergency_contact_isverified: true } : p);
    } catch (e: any) {
      setEmergencyOtpError(e?.message || "Verification failed.");
    } finally {
      setEmergencyOtpLoading(false);
    }
  }

  async function handleResendEmergencyOTP() {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch("/api/email-verify/resend-emergency-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email || user?.email }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      setResendCooldown(60);
      addToast("Verification code resent.", "info");
    } catch {
      setEmergencyOtpError("Failed to resend code.");
    }
  }

  const inputClass = "rounded-xl border px-3 py-2 bg-transparent text-sm";
  const inputStyle = { borderColor: "var(--borderSoft)", color: "var(--text)" };
  const errorInputStyle = { borderColor: "#EF4444", color: "var(--text)" };

  const VerifiedBadge = ({ verified }: { verified?: boolean }) => (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: verified ? "rgba(56,161,105,0.12)" : "rgba(239,68,68,0.08)",
        color: verified ? "#38a169" : "#e53e3e",
      }}
    >
      {verified ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
      {verified ? "Verified" : "Unverified"}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2" style={{ maxWidth: 380 }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg"
              style={{
                background: t.type === "success" ? "rgba(56,161,105,0.12)" : t.type === "error" ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.08)",
                borderColor: t.type === "success" ? "#38a169" : t.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)",
                color: t.type === "success" ? "#276749" : t.type === "error" ? "#c53030" : "#4338ca",
              }}
            >
              {t.type === "success" && <ShieldCheck className="h-4 w-4 flex-shrink-0" />}
              {t.type === "error" && <ShieldX className="h-4 w-4 flex-shrink-0" />}
              {t.type === "info" && <Mail className="h-4 w-4 flex-shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Password Change OTP Modal */}
      {showPasswordOTP && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border p-8"
            style={{ background: "var(--surface)", borderColor: "var(--borderSoft)" }}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center rounded-2xl p-3 mb-4 border" style={{ borderColor: "var(--borderSoft)" }}>
                <KeyRound className="h-8 w-8" style={{ color: "var(--accent)" }} />
              </div>
              <h2 className="text-xl font-semibold">Verify Identity</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Enter the 6-digit code sent to your email to confirm the password change.
              </p>
            </div>

            {passwordOtpError && (
              <div className="mb-4 rounded-xl border px-4 py-3 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#DC2626" }}>
                {passwordOtpError}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={passwordOtp}
              onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-xl border bg-transparent px-4 py-3 text-center text-2xl font-bold tracking-[8px] outline-none transition-all focus:ring-2 mb-4"
              style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
              autoFocus
            />

            <Button onClick={handleVerifyPasswordOTP} style={{ width: "100%", marginBottom: 12 }}>
              {passwordOtpLoading ? "Verifying…" : "Verify & Continue"}
            </Button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleResendPasswordOTP}
                disabled={resendCooldown > 0}
                className="text-sm font-medium"
                style={{ color: resendCooldown > 0 ? "var(--muted)" : "var(--accent)", cursor: resendCooldown > 0 ? "default" : "pointer", background: "none", border: "none" }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
              <button
                onClick={() => { setShowPasswordOTP(false); setPasswordOtp(""); setPasswordOtpError(""); }}
                className="text-sm"
                style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Update your display name, profile picture, and personal details.
          </p>
        </div>

        {/* Simple badge pill */}
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ borderColor: "var(--borderSoft)" }}
        >
          {isAdmin ? "Admin" : isDoctor ? "Doctor" : "Patient"}
        </span>
      </div>

      <Card>
        {loading ? (
          <div className="py-10 text-sm" style={{ color: "var(--muted)" }}>
            Loading profile…
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            {/* Avatar */}
            <div className="space-y-3">
              <div
                className="rounded-2xl border overflow-hidden grid place-items-center"
                style={{
                  borderColor: "var(--borderSoft)",
                  background: "var(--surface)",
                  height: 220,
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid place-items-center gap-2">
                    <UserCircle2 className="h-16 w-16" style={{ color: "var(--muted)" }} />
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      No profile picture
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Profile picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                  className="block w-full text-sm rounded-xl border px-3 py-2"
                  style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
                />
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Choose an image (max 2MB). It will show in the header immediately.
                </div>
              </div>

              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Stored locally for now (shows in header immediately). Max 2MB.
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Display name */}
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  style={errors.name ? errorInputStyle : inputStyle}
                  placeholder="Your name"
                />
                {errors.name && <div className="text-xs" style={{ color: "#EF4444" }}>{errors.name}</div>}
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  This is shown in the header and across the app.
                </div>
              </div>

              {/* Email (read-only) with verification badge */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold">Email</label>
                  <VerifiedBadge verified={profile?.isverified} />
                </div>
                <input
                  value={profile?.email ?? user?.email ?? ""}
                  disabled
                  className={`${inputClass} opacity-70`}
                  style={inputStyle}
                />
              </div>

              {/* Age & Sex row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Age</label>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={inputClass}
                    style={errors.age ? errorInputStyle : inputStyle}
                    placeholder="Your age"
                  />
                  {errors.age && <div className="text-xs" style={{ color: "#EF4444" }}>{errors.age}</div>}
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {sexCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Contact Email with verification badge */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold">
                    Emergency Contact Email{" "}
                    <span className="font-normal text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
                      (optional)
                    </span>
                  </label>
                  {profile?.emergency_contact_email && (
                    <VerifiedBadge verified={profile?.emergency_contact_isverified} />
                  )}
                </div>
                <input
                  type="email"
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  className={inputClass}
                  style={errors.emergencyEmail ? errorInputStyle : inputStyle}
                  placeholder="emergency@example.com"
                />
                {errors.emergencyEmail && <div className="text-xs" style={{ color: "#EF4444" }}>{errors.emergencyEmail}</div>}
                {emergencyEmail && emergencyEmail !== originalEmergencyEmail && (
                  <div className="text-xs" style={{ color: "var(--accent)" }}>
                    A verification email will be sent to this address when you save.
                  </div>
                )}
                {profile?.emergency_contact_email && !profile.emergency_contact_isverified && emergencyEmail === originalEmergencyEmail && (
                  <div className="mt-1">
                    <Button
                      variant="secondary"
                      onClick={handleRequestEmergencyOTP}
                      disabled={emergencyOtpSending || saving}
                      style={{ fontSize: 13, padding: "6px 14px", width: "100%", justifyContent: "center" }}
                    >
                      {emergencyOtpSending ? "Sending..." : "Verify Emergency Contact"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={saveProfile}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>

                {/* Change Password - only for local provider */}
                {isLocal && (
                  <Button
                    variant="secondary"
                    onClick={handleRequestPasswordChange}
                    disabled={passwordOtpSending}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <KeyRound className="h-4 w-4" />
                    {passwordOtpSending ? "Sending…" : "Change Password"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Doctor Details Section - only visible for doctor role */}
      {isDoctor && !loading && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl p-2" style={{ background: "rgba(16,185,129,0.1)" }}>
              <Stethoscope className="h-5 w-5" style={{ color: "#10B981" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Doctor Details</h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Update your professional information displayed on your doctor profile.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Specialization</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Cardiology"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Place of Practice</label>
              <input
                value={placeOfPractice}
                onChange={(e) => setPlaceOfPractice(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. City General Hospital"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Years of Experience</label>
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className={inputClass}
                style={errors.yearsOfExperience ? errorInputStyle : inputStyle}
                placeholder="e.g. 5"
              />
              {errors.yearsOfExperience && <div className="text-xs" style={{ color: "#EF4444" }}>{errors.yearsOfExperience}</div>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Phone Number</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. +60123456789"
              />
            </div>
          </div>

          <div className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
            Doctor details are saved together when you click "Save changes" above.
          </div>
        </Card>
      )}

      {/* Verify Emergency Contact OTP Modal */}
      <AnimatePresence>
        {showEmergencyOTP && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border p-8"
              style={{ background: "var(--surface)", borderColor: "var(--borderSoft)" }}
            >
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center rounded-2xl p-3 mb-4 border"
                  style={{ borderColor: "var(--borderSoft)" }}
                >
                  <ShieldCheck className="h-8 w-8" style={{ color: "var(--accent)" }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
                  Verify Emergency Contact
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  We sent a 6-digit code to {profile?.emergency_contact_email}
                </p>
              </div>

              {emergencyOtpError && (
                <div
                  className="mb-4 rounded-xl border px-4 py-3 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#DC2626" }}
                >
                  {emergencyOtpError}
                </div>
              )}

              <input
                type="text"
                maxLength={6}
                value={emergencyOtp}
                onChange={(e) => setEmergencyOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-center text-2xl font-bold tracking-[8px] outline-none transition-all focus:ring-2 mb-4"
                style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
                autoFocus
              />

              <motion.button
                onClick={handleVerifyEmergencyOTP}
                disabled={emergencyOtpLoading}
                whileHover={emergencyOtpLoading ? {} : { y: -1 }}
                whileTap={emergencyOtpLoading ? {} : { scale: 0.985 }}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition mb-3"
                style={{ background: "var(--accent)" }}
              >
                {emergencyOtpLoading ? "Verifying…" : "Verify Code"}
              </motion.button>

              <div className="text-center flex flex-col gap-2 mt-4">
                <button
                  onClick={handleResendEmergencyOTP}
                  disabled={resendCooldown > 0}
                  className="text-sm font-medium transition-colors"
                  style={{
                    color: resendCooldown > 0 ? "var(--muted)" : "var(--accent)",
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                <button
                  onClick={() => { setShowEmergencyOTP(false); setEmergencyOtp(""); }}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
