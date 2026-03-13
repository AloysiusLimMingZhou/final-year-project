"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import SoftSelect from "../components/ui/Select";
import { Search, Filter, ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";

export default function Blogs() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/posts/category");
      const data = await response.json();
      setCategories(["All", ...(Array.isArray(data) ? data : [])]);
    } catch (err) {
      console.error(err);
      setCategories(["All", "Heart", "Lifestyle", "Nutrition", "Fitness", "General"]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "All") params.set("category", category);
    if (page) params.set("page", page.toString());
    if (limit) params.set("limit", limit.toString());

    const response = await fetch(`/api/posts?${params.toString()}`);
    const data = await response.json();
    setPosts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, page, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const truncateWords = (text: string, wordLimit: number) => {
    if (!text) return "";
    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  const canNext = useMemo(() => posts.length === limit, [posts.length, limit]);

  if (loading) {
    return (
      <Card title="Blogs">
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        title="Blogs"
        headerRight={
          user?.roles?.includes("doctor") ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push("/blogs/create-blog")}
                iconLeft={<Plus className="h-4 w-4" />}
              >
                Create
              </Button>
              <Button variant="secondary" onClick={() => router.push("/blogs/pending-blogs")}>
                Pending
              </Button>
            </div>
          ) : null
        }
      >
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="text"
                placeholder="Search title or content"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-transparent pl-9 pr-3 py-2 text-sm"
                style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
              />
            </div>

            <Button variant="primary">Search</Button>
          </form>

          <SoftSelect
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            options={categories.map((c: any) => ({
              value: String(c),
              label: String(c).charAt(0).toUpperCase() + String(c).slice(1).toLowerCase(),
            }))}
            leftIcon={<Filter className="h-4 w-4" />}
          />

        </div>

        {/* Posts */}
        <div className="mt-4 grid gap-3">
          {posts.map((post: any) => (
            <div
              key={post.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--borderSoft)", background: "var(--surface)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {post.category || "General"}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{post.title}</div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {post.author_name || "Unknown"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}
                    </span>
                    {post.reviewed_at ? (
                      <span className="inline-flex items-center gap-1">
                        ✓ Reviewed {post.reviewer_name ? `by ${post.reviewer_name}` : ""}{" "}
                        {post.reviewed_at ? `(${new Date(post.reviewed_at).toLocaleDateString()})` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => router.push(`/blogs/${post.id}`)}>
                    Read more
                  </Button>
                </div>
              </div>

              <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {truncateWords(post.content, 60)}
              </div>
            </div>
          ))}

          {posts.length === 0 ? (
            <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--borderSoft)", color: "var(--muted)" }}>
              No posts found!
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Page <span style={{ color: "var(--text)", fontWeight: 700 }}>{page}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <span className="inline-flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </span>
            </Button>

            <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
              <span className="inline-flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>

        {/* Optional: prevent going next when no more data */}
        {!canNext ? (
          <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            No more posts to load.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
