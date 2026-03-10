"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, ChevronLeft, ChevronRight, Stethoscope, Eye } from "lucide-react";

export default function DoctorsList() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            const response = await fetch(`/api/admin/doctors?${params.toString()}`);
            const data = await response.json();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes("admin")) fetchDoctors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page]);

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
                <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>Approved Doctors</h1>
                <p className="text-sm" style={{ color: "var(--hc-muted)" }}>All doctors who have been approved in the system.</p>
            </div>

            <Card>
                <form
                    onSubmit={(e) => { e.preventDefault(); fetchDoctors(); }}
                    className="flex gap-2"
                >
                    <div className="relative flex-1 max-w-sm">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                            style={{ color: "var(--hc-muted)" }}
                        />
                        <input
                            type="text"
                            placeholder="Search by doctor name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm bg-transparent"
                            style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                        />
                    </div>
                    <Button type="submit" variant="primary" iconLeft={<Search className="h-4 w-4" />}>
                        Search
                    </Button>
                </form>

                <div className="mt-4 overflow-auto rounded-2xl border" style={{ borderColor: "var(--hc-border)" }}>
                    <table className="min-w-[600px] w-full text-sm">
                        <thead>
                            <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Name</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Email</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Specialization</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading doctors…</td></tr>
                            ) : doctors.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-sm" style={{ color: "var(--hc-muted)" }}>No doctors found.</td></tr>
                            ) : (
                                doctors.map((doctor) => (
                                    <tr key={doctor.user_id} className="border-t" style={{ borderColor: "var(--hc-border)" }}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="rounded-full p-1.5" style={{ background: "rgba(16,185,129,0.1)" }}>
                                                    <Stethoscope className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
                                                </div>
                                                <span className="font-semibold" style={{ color: "var(--hc-text)" }}>
                                                    {doctor.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm" style={{ color: "var(--hc-muted)" }}>{doctor.email}</td>
                                        <td className="p-3 text-sm" style={{ color: "var(--hc-muted)" }}>
                                            {doctor.specialization || "—"}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => router.push(`/admin/doctors/${doctor.user_id}`)}
                                                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition hover:bg-blue-50"
                                                style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View
                                            </button>
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
                        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}
                            iconLeft={<ChevronLeft className="h-4 w-4" />}>Prev</Button>
                        <Button variant="secondary" onClick={() => setPage((p) => p + 1)}
                            iconRight={<ChevronRight className="h-4 w-4" />}>Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}