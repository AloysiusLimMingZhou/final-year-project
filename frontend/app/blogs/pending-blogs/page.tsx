"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import SoftSelect from "../../components/ui/Select";
import { Search, Filter, ChevronLeft, ChevronRight, Clock, User, Tag, Eye } from "lucide-react";

export default function GetPendingBlogs() {
    const { user, loading: authLoading } = useAuth();
    const [pendingPosts, setPendingPosts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/posts/category");
            const data = await response.json();
            setCategories(["All", ...data]);
        } catch {
            setCategories(["All", "Heart", "Lifestyle", "Nutrition", "Fitness", "General"]);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const fetchPendingPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (category && category !== "All") params.set("category", category);
            params.set("page", page.toString());
            params.set("limit", limit.toString());
            const response = await fetch(`/api/posts/pending-posts?${params.toString()}`);
            const data = await response.json();
            setPendingPosts(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes("doctor")) fetchPendingPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, category, page]);

    const truncateWords = (text: string, limit: number) => {
        if (!text) return "";
        const words = text.split(/\s+/);
        if (words.length <= limit) return text;
        return words.slice(0, limit).join(" ") + "…";
    };

    if (authLoading) return <div className="py-10 text-sm" style={{ color: "var(--hc-muted)" }}>Loading…</div>;

    if (!user?.roles?.includes("doctor")) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
                <p className="text-sm" style={{ color: "var(--hc-muted)" }}>Only doctors can view pending blogs.</p>
                <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card
                title="My Pending Blogs"
                headerRight={
                    <Button variant="secondary" onClick={() => router.push("/blogs")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                        All Blogs
                    </Button>
                }
            >
                <p className="text-sm mb-4" style={{ color: "var(--hc-muted)" }}>
                    These are your submitted blog posts currently awaiting admin review.
                </p>

                {/* Filters */}
                <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                    <form
                        onSubmit={(e) => { e.preventDefault(); setPage(1); fetchPendingPosts(); }}
                        className="flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                            <input
                                type="text"
                                placeholder="Search title or content…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm bg-transparent"
                                style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                            />
                        </div>
                        <Button type="submit" variant="primary">Search</Button>
                    </form>

                    <SoftSelect
                        value={category}
                        onChange={(v) => { setCategory(v); setPage(1); }}
                        options={categories.map((c) => ({
                            value: String(c),
                            label: String(c).charAt(0).toUpperCase() + String(c).slice(1).toLowerCase(),
                        }))}
                        leftIcon={<Filter className="h-4 w-4" />}
                    />
                </div>

                {/* Posts */}
                <div className="mt-4 grid gap-3">
                    {loading ? (
                        <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading…</div>
                    ) : pendingPosts.length === 0 ? (
                        <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--hc-border)", color: "var(--hc-muted)" }}>
                            No pending posts found.
                        </div>
                    ) : (
                        pendingPosts.map((post) => (
                            <div
                                key={post.id}
                                className="rounded-2xl border p-4 transition hover:shadow-sm"
                                style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                                            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5" style={{ borderColor: "var(--hc-border)", color: "var(--hc-muted)" }}>
                                                <Tag className="h-3 w-3" /> {post.category || "General"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-amber-50 border-amber-200 text-amber-600">
                                                <Clock className="h-3 w-3" /> Pending Review
                                            </span>
                                        </div>
                                        <div className="text-base font-semibold truncate" style={{ color: "var(--hc-text)" }}>{post.title}</div>
                                        <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: "var(--hc-muted)" }}>
                                            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {post.author_name}</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--hc-muted)" }}>
                                            {truncateWords(post.content, 40)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        onClick={() => router.push(`/blogs/pending-blogs/${post.id}`)}
                                        iconLeft={<Eye className="h-4 w-4" />}
                                    >
                                        View
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
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