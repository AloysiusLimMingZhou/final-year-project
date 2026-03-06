"use client"

import { FormEvent, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"
import { Card } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ChangePassword() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    // Verify that we came from the OTP flow
    useEffect(() => {
        const sessionToken = sessionStorage.getItem("hc_password_session");
        if (!sessionToken && !loading) {
            router.push('/profile');
        }
    }, [loading, router]);

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!newPassword || newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const sessionToken = sessionStorage.getItem("hc_password_session");
        if (!sessionToken) {
            setError("Session expired. Please request a new password change from your profile.");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken, newPassword }),
            });

            if (response.ok) {
                sessionStorage.removeItem("hc_password_session");
                setSuccess(true);
                setTimeout(() => router.push('/profile'), 2000);
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data?.message || 'Failed to change password.');
            }
        } catch (err) {
            console.error(err);
            setError('Server error! Please try again.');
        } finally {
            setSaving(false);
        }
    }

    const inputClass = "w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm outline-none transition-all focus:ring-2";
    const inputStyle = { borderColor: "var(--borderSoft)", color: "var(--text)" };

    return (
        <div className="space-y-4" style={{ maxWidth: 480 }}>
            {/* Success overlay */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="rounded-2xl border p-8 text-center"
                            style={{ background: "var(--surface)", borderColor: "var(--borderSoft)" }}
                        >
                            <div className="inline-flex items-center justify-center rounded-full p-3 mb-4" style={{ background: "rgba(56,161,105,0.12)" }}>
                                <ShieldCheck className="h-10 w-10" style={{ color: "#38a169" }} />
                            </div>
                            <h2 className="text-xl font-semibold mb-1">Password Changed!</h2>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>Redirecting to profile…</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div>
                <h1 className="text-xl font-semibold">Change Password</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                    Your identity has been verified. Enter your new password below.
                </p>
            </div>

            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-xl p-2" style={{ background: "rgba(99,102,241,0.1)" }}>
                        <KeyRound className="h-5 w-5" style={{ color: "#6366f1" }} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold">Set New Password</h2>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                            Choose a strong password with at least 8 characters.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border px-4 py-3 text-sm"
                        style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#DC2626" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold">New Password</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClass}
                                style={inputStyle}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                tabIndex={-1}
                            >
                                {showNew
                                    ? <EyeOff className="h-4 w-4" style={{ color: "var(--muted)" }} />
                                    : <Eye className="h-4 w-4" style={{ color: "var(--muted)" }} />
                                }
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-semibold">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass}
                                style={inputStyle}
                                placeholder="Re-enter new password"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                tabIndex={-1}
                            >
                                {showConfirm
                                    ? <EyeOff className="h-4 w-4" style={{ color: "var(--muted)" }} />
                                    : <Eye className="h-4 w-4" style={{ color: "var(--muted)" }} />
                                }
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Changing…" : "Change Password"}
                        </Button>
                        <Button variant="secondary" type="button" onClick={() => router.push("/profile")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}