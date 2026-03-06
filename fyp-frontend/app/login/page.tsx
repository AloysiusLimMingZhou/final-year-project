"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeartPulse, Mail, Lock, LogIn, Eye, EyeOff, Palette } from "lucide-react";
import { useTheme, THEMES } from "../context/ThemeContext";

export default function Login() {
    const { login } = useAuth();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { themeKey, cycleTheme } = useTheme();

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/auth/google";
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            await login(email, password);
        } catch (err) {
            setError("Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: "var(--hc-bg)" }}
        >
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
                            Welcome back
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: "var(--hc-muted)" }}>
                            Sign in to your HealthConnect account
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
                                    id="login-email"
                                    className="w-full rounded-xl border bg-transparent pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
                                    style={{
                                        borderColor: "var(--hc-border)",
                                        color: "var(--hc-text)",
                                        // @ts-ignore
                                        "--tw-ring-color": "var(--hc-accent)",
                                    }}
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
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
                                    id="login-password"
                                    className="w-full rounded-xl border bg-transparent pl-10 pr-10 py-2.5 text-sm outline-none transition-all focus:ring-2"
                                    style={{
                                        borderColor: "var(--hc-border)",
                                        color: "var(--hc-text)",
                                        // @ts-ignore
                                        "--tw-ring-color": "var(--hc-accent)",
                                    }}
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
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

                        {/* Login Button */}
                        <motion.button
                            id="login-submit"
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
                                <LogIn className="h-4 w-4" />
                            )}
                            {isLoading ? "Signing in…" : "Sign in"}
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
                        id="login-google"
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

                    {/* Register link */}
                    <div className="mt-6 text-center text-sm" style={{ color: "var(--hc-muted)" }}>
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-semibold transition-colors hover:underline"
                            style={{ color: "var(--hc-accent)" }}
                        >
                            Create one
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