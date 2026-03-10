"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeartPulse, Mail, Lock, User, Calendar, Users, ShieldPlus, Eye, EyeOff, Palette, ShieldCheck, Info } from "lucide-react";
import { useTheme, THEMES } from "../context/ThemeContext";
import SoftSelect from "../components/ui/Select";

type VerifyStep = "none" | "user-otp" | "done";

export default function Register() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [sexCategories, setSexCategories] = useState<string[]>([]);
    const [sexCategory, setSexCategory] = useState("");
    const { themeKey, cycleTheme } = useTheme();

    // OTP verification state
    const [verifyStep, setVerifyStep] = useState<VerifyStep>("none");
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const fetchSexCategory = async () => {
        try {
            const response = await fetch("/api/users/sex-category");
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                setSexCategories(data);
            } else {
                setSexCategories(["male", "female"]);
            }
        } catch (err) {
            console.log(err);
            setSexCategories(["male", "female"]);
        }
    };

    useEffect(() => {
        fetchSexCategory();
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/auth/google";
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const age = formData.get("age") as string;
        const sex = sexCategory;
        const emergency_contact_email = formData.get("emergency_contact_email") as string;

        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            setIsLoading(false);
            return;
        }
        if (emergency_contact_email && !emailRegex.test(emergency_contact_email)) {
            setError("Please enter a valid emergency contact email address.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    age: Number(age),
                    sex,
                    ...(emergency_contact_email ? { emergency_contact_email } : {}),
                }),
            });

            if (response.ok) {
                setRegisteredEmail(email);
                setVerifyStep("user-otp");
                startResendCooldown();
            } else {
                const data = await response.json().catch(() => null);
                let msg = "Failed to register";
                if (data && data.message) {
                    msg = Array.isArray(data.message) ? data.message[0] : data.message;
                }
                setError(msg);
            }
        } catch (err) {
            setError("Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    function startResendCooldown() {
        setResendCooldown(60);
    }

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setOtpError("Please enter the 6-digit code.");
            return;
        }
        setOtpLoading(true);
        setOtpError("");
        try {
            const endpoint = "/api/email-verify/verify-otp";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: registeredEmail, otp }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Invalid OTP");
            }
            setOtp("");
            setVerifyStep("done");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setOtpError(err?.message || "Verification failed.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setOtpError("");
        try {
            const endpoint = "/api/email-verify/resend-user-otp";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: registeredEmail }),
            });
            if (!res.ok) throw new Error("Failed to resend");
            startResendCooldown();
        } catch {
            setOtpError("Failed to resend code. Please try again.");
        }
    };

    const inputClasses =
        "w-full rounded-xl border bg-transparent pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2";
    const inputStyle = {
        borderColor: "var(--hc-border)",
        color: "var(--hc-text)",
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: "var(--hc-bg)" }}
        >
            {/* OTP Verification Modal */}
            {verifyStep !== "none" && verifyStep !== "done" && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm rounded-2xl border p-8"
                        style={{ background: "var(--hc-surface)", borderColor: "var(--hc-border)" }}
                    >
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center rounded-2xl p-3 mb-4 border" style={{ borderColor: "var(--hc-border)" }}>
                                <ShieldCheck className="h-8 w-8" style={{ color: "var(--hc-accent)" }} />
                            </div>
                            <h2 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>
                                Verify Your Email
                            </h2>
                            <p className="mt-1 text-sm" style={{ color: "var(--hc-muted)" }}>
                                We sent a 6-digit code to {registeredEmail}
                            </p>
                        </div>

                        {otpError && (
                            <div className="mb-4 rounded-xl border px-4 py-3 text-sm"
                                style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#DC2626" }}>
                                {otpError}
                            </div>
                        )}

                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="w-full rounded-xl border bg-transparent px-4 py-3 text-center text-2xl font-bold tracking-[8px] outline-none transition-all focus:ring-2 mb-4"
                            style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                            autoFocus
                        />

                        <motion.button
                            onClick={handleVerifyOTP}
                            disabled={otpLoading}
                            whileHover={otpLoading ? {} : { y: -1 }}
                            whileTap={otpLoading ? {} : { scale: 0.985 }}
                            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition mb-3"
                            style={{ background: "var(--hc-accent)" }}
                        >
                            {otpLoading ? "Verifying…" : "Verify Code"}
                        </motion.button>

                        <div className="text-center">
                            <button
                                onClick={handleResendOTP}
                                disabled={resendCooldown > 0}
                                className="text-sm font-medium transition-colors"
                                style={{ color: resendCooldown > 0 ? "var(--hc-muted)" : "var(--hc-accent)", cursor: resendCooldown > 0 ? "default" : "pointer", background: "none", border: "none" }}
                            >
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Success message */}
            {verifyStep === "done" && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm rounded-2xl border p-8 text-center"
                        style={{ background: "var(--hc-surface)", borderColor: "var(--hc-border)" }}
                    >
                        <div className="inline-flex items-center justify-center rounded-full p-3 mb-4" style={{ background: "rgba(56,161,105,0.12)" }}>
                            <ShieldCheck className="h-10 w-10" style={{ color: "#38a169" }} />
                        </div>
                        <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--hc-text)" }}>Email Verified!</h2>
                        <p className="text-sm" style={{ color: "var(--hc-muted)" }}>Redirecting to login…</p>
                    </motion.div>
                </div>
            )}
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
                    style={{ background: "var(--hc-accent)" }}
                />
                <div
                    className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-10 blur-3xl"
                    style={{ background: "var(--hc-accent)" }}
                />
            </div>

            {/* Theme toggle */}
            <motion.button
                onClick={cycleTheme}
                whileHover={{ y: -1, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none"
                style={{
                    borderColor: "var(--hc-border)",
                    color: "var(--hc-text)",
                    background: "var(--hc-surface)",
                }}
                title="Switch theme"
            >
                <Palette className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
                <span className="hidden sm:inline">{THEMES[themeKey].name}</span>
            </motion.button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative"
            >
                {/* Card */}
                <div
                    className="rounded-2xl shadow-sm border p-8"
                    style={{
                        background: "var(--hc-surface)",
                        borderColor: "var(--hc-border)",
                    }}
                >
                    {/* Logo & Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center justify-center rounded-2xl p-3 mb-4 border" style={{ borderColor: "var(--hc-border)" }}>
                            <HeartPulse className="h-8 w-8" style={{ color: "var(--hc-accent)" }} />
                        </div>
                        <h1 className="text-2xl font-semibold" style={{ color: "var(--hc-text)" }}>
                            Create your account
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: "var(--hc-muted)" }}>
                            Join HealthConnect to start tracking your heart health
                        </p>
                    </motion.div>

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 rounded-xl border px-4 py-3 text-sm"
                            style={{
                                background: "rgba(239, 68, 68, 0.08)",
                                borderColor: "rgba(239, 68, 68, 0.2)",
                                color: "#DC2626",
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <User className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                </div>
                                <input
                                    id="register-name"
                                    className={inputClasses}
                                    style={inputStyle}
                                    type="text"
                                    placeholder="Your name"
                                    name="name"
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Mail className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                </div>
                                <input
                                    id="register-email"
                                    className={inputClasses}
                                    style={inputStyle}
                                    type="email"
                                    placeholder="you@example.com"
                                    name="email"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Age & Sex row */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Age */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                    Age
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <Calendar className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                    </div>
                                    <input
                                        id="register-age"
                                        className={inputClasses}
                                        style={inputStyle}
                                        type="number"
                                        placeholder="Age"
                                        name="age"
                                        min={1}
                                        max={120}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Sex */}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                    Sex
                                </label>
                                <div className="relative">
                                    <FieldSelect
                                        value={sexCategory}
                                        onChange={(v: string) => setSexCategory(v)}
                                        options={sexCategories.map((cat) => ({
                                            label: cat.charAt(0).toUpperCase() + cat.slice(1),
                                            value: cat
                                        }))}
                                        leftIcon={<Users className="h-4 w-4" />}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency contact email */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                Emergency Contact Email{" "}
                                <span className="font-normal" style={{ color: "var(--hc-muted)", opacity: 0.6 }}>
                                    (optional)
                                </span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <ShieldPlus className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                </div>
                                <input
                                    id="register-emergency"
                                    className={inputClasses}
                                    style={inputStyle}
                                    type="email"
                                    placeholder="emergency@example.com"
                                    name="emergency_contact_email"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--hc-muted)" }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Lock className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                </div>
                                <input
                                    id="register-password"
                                    className="w-full rounded-xl border bg-transparent pl-10 pr-10 py-2.5 text-sm outline-none transition-all focus:ring-2"
                                    style={inputStyle}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                    ) : (
                                        <Eye className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            id="register-submit"
                            type="submit"
                            disabled={isLoading}
                            whileHover={isLoading ? {} : { y: -1 }}
                            whileTap={isLoading ? {} : { scale: 0.985 }}
                            transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "var(--hc-accent)" }}
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                                <HeartPulse className="h-4 w-4" />
                            )}
                            {isLoading ? "Creating account…" : "Create account"}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px" style={{ background: "var(--hc-border)" }} />
                        <span className="text-xs" style={{ color: "var(--hc-muted)" }}>or</span>
                        <div className="flex-1 h-px" style={{ background: "var(--hc-border)" }} />
                    </div>

                    {/* Google */}
                    <motion.button
                        id="register-google"
                        type="button"
                        onClick={handleGoogleLogin}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none"
                        style={{
                            borderColor: "var(--hc-border)",
                            color: "var(--hc-text)",
                            background: "transparent",
                        }}
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            width="18"
                            height="18"
                            alt="Google"
                        />
                        Continue with Google
                    </motion.button>

                    {/* Login link */}
                    <div className="mt-6 text-center text-sm" style={{ color: "var(--hc-muted)" }}>
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold transition-colors hover:underline"
                            style={{ color: "var(--hc-accent)" }}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-6 text-center text-xs"
                    style={{ color: "var(--hc-muted)" }}
                >
                    HealthConnect — Your heart health companion
                </motion.div>
            </motion.div>
        </div>
    );
}
function FieldSelect({
    label,
    value,
    onChange,
    options,
    description,
    leftIcon,
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    description?: string;
    leftIcon?: React.ReactNode;
}) {
    return (
        <label className="block w-full">
            {label && (
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
            )}

            <SoftSelect
                value={value}
                onChange={onChange}
                options={options}
                leftIcon={leftIcon}
            />
        </label>
    );
}