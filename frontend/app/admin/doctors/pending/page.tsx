"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Search, ChevronLeft, ChevronRight, ClipboardList, CheckCircle2, XCircle, Eye } from "lucide-react";

export default function ListPendingDoctors() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            const response = await fetch(`/api/admin/pending-doctors?${params.toString()}`);
            const data = await response.json();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.roles?.includes("admin")) fetchDoctors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, page]);

    const approveDoctor = async (id: string) => {
        setBusy(id + "-approve");
        await fetch(`/api/admin/${id}/approve-doctor`, { method: "POST" });
        setBusy(null);
        fetchDoctors();
    };

    const rejectDoctor = async (id: string) => {
        setBusy(id + "-reject");
        await fetch(`/api/admin/${id}/reject-doctor`, { method: "POST" });
        setBusy(null);
        fetchDoctors();
    };

    if (authLoading) return <div className="py-10 text-sm" style={{ color: "var(--hc-muted)" }}>Loading…</div>;

    if (!user?.roles?.includes("admin")) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
                <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>Pending Doctor Applications</h1>
                <p className="text-sm" style={{ color: "var(--hc-muted)" }}>Review and approve or reject doctor applications.</p>
            </div>

            <Card>
                <form
                    onSubmit={(e) => { e.preventDefault(); fetchDoctors(); }}
                    className="flex gap-2"
                >
                    <div className="relative flex-1 max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                        <input
                            type="text"
                            placeholder="Search by applicant name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm bg-transparent"
                            style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                        />
                    </div>
                    <Button type="submit" variant="primary">Search</Button>
                </form>

                <div className="mt-4 overflow-auto rounded-2xl border" style={{ borderColor: "var(--hc-border)" }}>
                    <table className="min-w-[900px] w-full text-sm">
                        <thead>
                            <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                                {["Name", "Email", "Specialization", "Place of Practice", "Experience", "Actions"].map((h) => (
                                    <th key={h} className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-sm text-center" style={{ color: "var(--hc-muted)" }}>
                                        Loading applications…
                                    </td>
                                </tr>
                            ) : doctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-sm" style={{ color: "var(--hc-muted)" }}>
                                        No pending applications.
                                    </td>
                                </tr>
                            ) : (
                                doctors.map((doctor) => (
                                    <tr key={doctor.user_id} className="border-t" style={{ borderColor: "var(--hc-border)" }}>
                                        <td className="p-3">
                                            <button
                                                onClick={() => router.push(`/admin/doctor-review/${doctor.user_id}`)}
                                                className="font-semibold text-sm hover:underline text-left"
                                                style={{ color: "var(--hc-accent)" }}
                                            >
                                                {doctor.name}
                                            </button>
                                        </td>
                                        <td className="p-3 text-xs" style={{ color: "var(--hc-muted)" }}>{doctor.email}</td>
                                        <td className="p-3 text-xs" style={{ color: "var(--hc-muted)" }}>{doctor.specialization || "—"}</td>
                                        <td className="p-3 text-xs" style={{ color: "var(--hc-muted)" }}>{doctor.place_of_practice || "—"}</td>
                                        <td className="p-3 text-xs" style={{ color: "var(--hc-muted)" }}>
                                            {doctor.years_of_experience != null ? `${doctor.years_of_experience} yrs` : "—"}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/doctor-review/${doctor.user_id}`)}
                                                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition hover:bg-blue-50"
                                                    style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> Review
                                                </button>
                                                <button
                                                    onClick={() => approveDoctor(doctor.user_id)}
                                                    disabled={busy === doctor.user_id + "-approve"}
                                                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-emerald-300 text-emerald-600 transition hover:bg-emerald-50"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {busy === doctor.user_id + "-approve" ? "…" : "Approve"}
                                                </button>
                                                <button
                                                    onClick={() => rejectDoctor(doctor.user_id)}
                                                    disabled={busy === doctor.user_id + "-reject"}
                                                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-red-300 text-red-500 transition hover:bg-red-50"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    {busy === doctor.user_id + "-reject" ? "…" : "Reject"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                        Page <span className="font-bold" style={{ color: "var(--hc-text)" }}>{page}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} iconLeft={<ChevronLeft className="h-4 w-4" />}>Prev</Button>
                        <Button variant="secondary" onClick={() => setPage((p) => p + 1)} iconRight={<ChevronRight className="h-4 w-4" />}>Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}