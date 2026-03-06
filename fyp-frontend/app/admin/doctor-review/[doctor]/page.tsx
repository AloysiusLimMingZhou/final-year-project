"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import {
    ChevronLeft, Stethoscope, Mail, GraduationCap, Building2, IdCard,
    Phone, Clock, FileText, CheckCircle2, XCircle,
} from "lucide-react";

export default function DoctorReviewPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams<{ doctor: string }>();
    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchDoctor = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/${params.doctor}/doctor-review`);
            const data = await response.json();
            setDoctor(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.roles?.includes("admin") && params.doctor) fetchDoctor();
    }, [authLoading, user, params.doctor]);

    const approveDoctor = async () => {
        setBusy("approve");
        const res = await fetch(`/api/admin/${params.doctor}/approve-doctor`, { method: "POST" });
        setBusy(null);
        if (res.ok) router.push("/admin/doctors/pending");
        else alert(await res.text());
    };

    const rejectDoctor = async () => {
        setBusy("reject");
        const res = await fetch(`/api/admin/${params.doctor}/reject-doctor`, { method: "POST" });
        setBusy(null);
        if (res.ok) router.push("/admin/doctors/pending");
        else alert(await res.text());
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
                <Button variant="secondary" onClick={() => router.push("/admin/doctors/pending")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                    Back to Pending Doctors
                </Button>
                <Card><p style={{ color: "var(--hc-muted)" }}>Doctor application not found or already reviewed.</p></Card>
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
    ];

    return (
        <div className="space-y-4">
            <Button
                variant="secondary"
                onClick={() => router.push("/admin/doctors/pending")}
                iconLeft={<ChevronLeft className="h-4 w-4" />}
            >
                Back to Pending Doctors
            </Button>

            <Card title={`Doctor Application – ${doctor.name}`}>
                {/* Status badge */}
                <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-300">
                        <Clock className="h-3.5 w-3.5" /> Pending Review
                    </span>
                </div>

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

                {/* Actions */}
                <div className="mt-5 pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: "var(--hc-border)" }}>
                    <button
                        onClick={approveDoctor}
                        disabled={!!busy}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-60"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {busy === "approve" ? "Approving…" : "Approve Doctor"}
                    </button>
                    <button
                        onClick={rejectDoctor}
                        disabled={!!busy}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                        <XCircle className="h-4 w-4" />
                        {busy === "reject" ? "Rejecting…" : "Reject Doctor"}
                    </button>
                    <Button variant="secondary" onClick={() => router.push("/admin/doctors/pending")}>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}
