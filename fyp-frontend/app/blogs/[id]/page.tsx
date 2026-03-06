"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "../../components/ui-kit";
import { ChevronLeft, Clock, Tag, User, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Post = {
  id: string | number;
  user_id?: string | number;
  title: string;
  content: string;
  category?: string;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
};

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/posts/${params.id}`);
        if (!res.ok) throw new Error(`Failed to load post (${res.status})`);
        setPost(await res.json());
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load blog");
      } finally {
        setLoading(false);
      }
    }
    if (params?.id) run();
  }, [params?.id]);

  if (loading || authLoading) {
    return (
      <Card title="Blog">
        <div className="text-sm" style={{ color: "var(--muted)" }}>Loading…</div>
      </Card>
    );
  }

  if (err || !post) {
    return (
      <div className="space-y-3">
        <Button variant="secondary" onClick={() => router.push("/blogs")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
          Back to blogs
        </Button>
        <Card title="Blog">
          <div className="text-sm" style={{ color: "var(--muted)" }}>{err ?? "Blog not found."}</div>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.roles?.includes("admin");
  const isAuthorDoctor =
    user?.roles?.includes("doctor") &&
    post.user_id !== undefined &&
    String(user.id) === String(post.user_id);

  const handleDelete = async () => {
    if (!confirm(`Delete blog "${post.title}"?\n\nThis cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/blogs");
    else alert(await res.text());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => router.push("/blogs")}
          iconLeft={<ChevronLeft className="h-4 w-4" />}
        >
          Back to blogs
        </Button>

        {isAuthorDoctor && (
          <Button variant="secondary" onClick={() => router.push(`/blogs/edit/${post.id}`)}
            iconLeft={<Pencil className="h-4 w-4" />}>
            Edit
          </Button>
        )}

        {(isAdmin || isAuthorDoctor) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>

      <Card title={post.title}>
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--borderSoft)" }}>
            <Tag className="h-4 w-4" style={{ color: "var(--accent)" }} />
            {post.category || "General"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--borderSoft)" }}>
            <User className="h-4 w-4" style={{ color: "var(--accent)" }} />
            {post.author_name || "Unknown"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--borderSoft)" }}>
            <Clock className="h-4 w-4" style={{ color: "var(--accent)" }} />
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}
          </span>
          {post.reviewed_at ? (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "var(--borderSoft)" }}>
              ✓ Reviewed{post.reviewer_name ? ` by ${post.reviewer_name}` : ""}{" "}
              {`(${new Date(post.reviewed_at).toLocaleDateString()})`}
            </span>
          ) : null}
        </div>

        {/* Content */}
        <div
          className="mt-4 rounded-2xl border p-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ borderColor: "var(--borderSoft)", background: "rgba(100,116,139,0.04)" }}
        >
          {post.content}
        </div>

        {/* Bottom actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button onClick={() => router.push("/diagnosis")}>New screening</Button>
        </div>
      </Card>
    </div>
  );
}
