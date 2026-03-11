"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ChevronLeft, User, Clock, Tag, Pencil, Trash2 } from "lucide-react";

export default function PendingBlogDetail() {
    const { user, loading: authLoading } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const router = useRouter();
    const params = useParams<{ pendingBlog: string }>();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/posts/${params.pendingBlog}/pending-posts`);
            if (!response.ok) { router.push("/blogs/pending-blogs"); return; }
            const data = await response.json();
            setPost(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.roles?.includes("doctor") && params.pendingBlog) fetchPost();
    }, [user, params.pendingBlog]);

    const deletePost = async () => {
        if (!confirm(`Delete blog "${post?.title}"?\n\nThis cannot be undone.`)) return;
        setBusy(true);
        const res = await fetch(`/api/posts/${params.pendingBlog}/delete-post`, { method: "DELETE" });
        setBusy(false);
        if (res.ok) router.push("/blogs/pending-blogs");
        else alert(await res.text());
    };

    if (authLoading || loading) {
        return <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading…</div>;
    }

    if (!user?.roles?.includes("doctor")) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
                <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="space-y-4">
                <Button variant="secondary" onClick={() => router.push("/blogs/pending-blogs")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                    My Pending Blogs
                </Button>
                <Card><p style={{ color: "var(--hc-muted)" }}>Post not found or not accessible.</p></Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Button
                variant="secondary"
                onClick={() => router.push("/blogs/pending-blogs")}
                iconLeft={<ChevronLeft className="h-4 w-4" />}
            >
                My Pending Blogs
            </Button>

            <Card title={post.title}>
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-4" style={{ color: "var(--hc-muted)" }}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: "var(--hc-border)" }}>
                        <Tag className="h-3.5 w-3.5" style={{ color: "var(--hc-accent)" }} />
                        {post.category || "General"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: "var(--hc-border)" }}>
                        <User className="h-3.5 w-3.5" style={{ color: "var(--hc-accent)" }} />
                        {post.author_name || "Unknown"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1" style={{ borderColor: "var(--hc-border)" }}>
                        <Clock className="h-3.5 w-3.5" style={{ color: "var(--hc-accent)" }} />
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 bg-amber-50 border-amber-200 text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> Pending Admin Review
                    </span>
                </div>

                {/* Content */}
                <div
                    className="rounded-2xl border p-4 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ borderColor: "var(--hc-border)", background: "rgba(100,116,139,0.04)", color: "var(--hc-text)" }}
                >
                    {post.content}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: "var(--hc-border)" }}>
                    <button
                        onClick={deletePost}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                        <Trash2 className="h-4 w-4" />
                        {busy ? "Deleting…" : "Delete Blog"}
                    </button>
                </div>
            </Card>
        </div>
    );
}