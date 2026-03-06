"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import {
    ChevronLeft, Stethoscope, Mail, GraduationCap, Building2, IdCard,
    Phone, Clock, FileText, ShieldX
} from "lucide-react";

export default function DoctorProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const router = useRouter();
    const params = useParams<{ doctor: string }>();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchDoctor = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/${params.doctor}/doctor`);
            if (response.ok) setDoctor(await response.json());
        } catch (err) {
            console.error("Failed to fetch doctor", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes("admin") && params.doctor) fetchDoctor();
    }, [user, params.doctor]);

    const revokeDoctor = async () => {
        if (!confirm(`Revoke doctor status for "${doctor?.name}"?\n\nThis will remove their doctor role.`)) return;
        try {
            setBusy(true);
            const res = await fetch(`/api/admin/${params.doctor}/revoke-doctor`, { method: "POST" });
            if (res.ok) router.push("/admin/doctors");
            else alert(await res.text());
        } catch {
            alert("Failed to revoke doctor.");
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

    if (!doctor) {
        return (
            <div className="space-y-4">
                <Button variant="secondary" onClick={() => router.push("/admin/doctors")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                    Back to Doctors
                </Button>
                <Card><p style={{ color: "var(--hc-muted)" }}>Doctor not found.</p></Card>
            </div>
        );
    }

    const fields = [
        { icon: Stethoscope, label: "Name", value: doctor.name, accent: "#10B981" },
        { icon: Mail, label: "Email", value: doctor.email, accent: "#3B82F6" },
        { icon: Stethoscope, label: "Specialization", value: doctor.specialization || "—", accent: "#10B981" },
        { icon: GraduationCap, label: "Graduated From", value: doctor.graduated_from || "—", accent: "#8B5CF6" },
        { icon: Building2, label: "Place of Practice", value: doctor.place_of_practice || "—", accent: "#F59E0B" },
        { icon: IdCard, label: "Type of Registration", value: doctor.type_of_registration || "—", accent: "#06B6D4" },
        { icon: Clock, label: "Years of Experience", value: doctor.years_of_experience?.toString() || "—", accent: "#F97316" },
        { icon: Phone, label: "Phone Number", value: doctor.phone_number || "—", accent: "#6366F1" },
        { icon: IdCard, label: "Identification Number", value: doctor.identification_number || "—", accent: "#EC4899" },
        {
            icon: Clock,
            label: "Approved At",
            value: doctor.reviewed_at ? new Date(doctor.reviewed_at).toLocaleDateString() : "—",
            accent: "#10B981",
        },
    ];

    return (
        <div className="space-y-4">
            <Button
                variant="secondary"
                onClick={() => router.push("/admin/doctors")}
                iconLeft={<ChevronLeft className="h-4 w-4" />}
            >
                Back to Doctors
            </Button>

            <Card title={`Dr. ${doctor.name}`}>
                <div className="grid gap-3 sm:grid-cols-2">
                    {fields.map(({ icon: Icon, label, value, accent }) => (
                        <div
                            key={label}
                            className="flex items-start gap-3 rounded-2xl border p-3"
                            style={{ borderColor: "var(--hc-border)" }}
                        >
                            <div className="mt-0.5 rounded-lg p-1.5" style={{ background: accent + "22" }}>
                                <Icon className="h-4 w-4" style={{ color: accent }} />
                            </div>
                            <div>
                                <div className="text-xs" style={{ color: "var(--hc-muted)" }}>{label}</div>
                                <div className="text-sm font-semibold mt-0.5" style={{ color: "var(--hc-text)" }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* License */}
                {doctor.doctor_license_url && (
                    <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--hc-border)" }}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" style={{ color: "#3B82F6" }} />
                            <span className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>Doctor License</span>
                        </div>
                        <a
                            href={doctor.doctor_license_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm rounded-xl border px-4 py-2 font-semibold transition hover:bg-blue-50"
                            style={{ borderColor: "var(--hc-border)", color: "#3B82F6" }}
                        >
                            <FileText className="h-4 w-4" /> View / Download License PDF
                        </a>
                    </div>
                )}

                <div className="mt-5 pt-4 border-t flex gap-3" style={{ borderColor: "var(--hc-border)" }}>
                    <Button
                        onClick={revokeDoctor}
                        disabled={busy}
                        iconLeft={<ShieldX className="h-4 w-4" />}
                        style={{ background: "#EF4444", color: "#fff" }}
                    >
                        {busy ? "Revoking…" : "Revoke Doctor Status"}
                    </Button>
                    <Button variant="secondary" onClick={() => router.push("/admin/doctors")}>
                        Back
                    </Button>
                </div>
            </Card>
        </div>
    );
}