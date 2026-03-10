"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ChevronLeft, Trash2, User, Mail, Calendar, Clock, Shield } from "lucide-react";

export default function UserDetailPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams<{ user: string }>();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${params.user}`);
            if (!response.ok) { router.push("/admin/users"); return; }
            const data = await response.json();
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes("admin") && params.user) fetchUser();
    }, [user, params.user]);

    const calculateAccountAge = () => {
        if (!profile) return null;
        const now = new Date();
        const created = new Date(profile.created_at);
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    };

    const handleDelete = async () => {
        if (!confirm(`Delete user "${profile?.name}"?\n\nThis cannot be undone.`)) return;
        try {
            setBusy(true);
            const res = await fetch(`/api/users/${params.user}`, { method: "DELETE" });
            if (res.ok) router.push("/admin/users");
            else alert(await res.text());
        } catch {
            alert("Failed to delete user.");
        } finally {
            setBusy(false);
        }
    };

    if (authLoading || loading) {
        return <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading…</div>;
    }

    if (!user?.roles?.includes("admin")) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
                <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="space-y-4">
                <Button variant="secondary" onClick={() => router.push("/admin/users")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                    Back to Users
                </Button>
                <Card><p style={{ color: "var(--hc-muted)" }}>User not found.</p></Card>
            </div>
        );
    }

    const fields = [
        { icon: User, label: "Full Name", value: profile.name },
        { icon: Mail, label: "Email", value: profile.email },
        { icon: Shield, label: "Roles", value: (profile.roles || []).join(", ") || "user" },
        { icon: Calendar, label: "Age", value: profile.age ?? "—" },
        { icon: User, label: "Sex", value: profile.sex ?? "—" },
        { icon: Mail, label: "Emergency Contact", value: profile.emergency_contact_email ?? "—" },
        {
            icon: Clock,
            label: "Joined",
            value: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—",
        },
        {
            icon: Clock,
            label: "Account Age",
            value: calculateAccountAge() !== null ? `${calculateAccountAge()} days` : "—",
        },
    ];

    return (
        <div className="space-y-4">
            <Button
                variant="secondary"
                onClick={() => router.push("/admin/users")}
                iconLeft={<ChevronLeft className="h-4 w-4" />}
            >
                Back to Users
            </Button>

            <Card title={`User: ${profile.name}`}>
                <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex items-start gap-3 rounded-2xl border p-3"
                            style={{ borderColor: "var(--hc-border)" }}
                        >
                            <div
                                className="mt-0.5 rounded-lg p-1.5"
                                style={{ background: "rgba(59,130,246,0.1)" }}
                            >
                                <Icon className="h-4 w-4" style={{ color: "#3B82F6" }} />
                            </div>
                            <div>
                                <div className="text-xs" style={{ color: "var(--hc-muted)" }}>{label}</div>
                                <div className="text-sm font-semibold mt-0.5" style={{ color: "var(--hc-text)" }}>
                                    {String(value)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t flex gap-3" style={{ borderColor: "var(--hc-border)" }}>
                    <Button
                        onClick={handleDelete}
                        disabled={busy}
                        iconLeft={<Trash2 className="h-4 w-4" />}
                        style={{ background: "#EF4444", color: "#fff" }}
                    >
                        {busy ? "Deleting…" : "Delete User"}
                    </Button>
                    <Button variant="secondary" onClick={() => router.push("/admin/users")}>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}