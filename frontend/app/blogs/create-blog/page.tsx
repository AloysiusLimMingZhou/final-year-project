"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { BookOpen, ChevronLeft, Info } from "lucide-react";
import SoftSelect from "@/app/components/ui/Select";

export default function CreateBlog() {
    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/posts/category");
            const data = await response.json();
            const fetchedCategories = Array.isArray(data) ? data : [];
            setCategories(fetchedCategories);
            if (fetchedCategories.length > 0) setSelectedCategory(fetchedCategories[0]);
        } catch {
            const fallbackCategories = ["Heart", "Lifestyle", "Nutrition", "Fitness", "General"];
            setCategories(fallbackCategories);
            setSelectedCategory(fallbackCategories[0]);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    if (authLoading) return <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading…</div>;

    if (!user?.roles?.includes("doctor")) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
                <p className="text-sm" style={{ color: "var(--hc-muted)" }}>Only doctors can create blog posts.</p>
                <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const category = selectedCategory;

        try {
            const response = await fetch("/api/posts/create-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, category }),
            });
            if (response.ok) {
                router.push("/blogs/pending-blogs");
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData?.message || "Failed to create post");
            }
        } catch {
            setError("Failed to create post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = "w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent transition focus:outline-none focus-visible:ring-2";
    const inputStyle = { borderColor: "var(--hc-border)", color: "var(--hc-text)" };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <Button variant="secondary" onClick={() => router.push("/blogs")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                Back to Blogs
            </Button>

            <Card
                title="Create Blog Post"
                headerRight={
                    <div className="rounded-xl p-2" style={{ background: "rgba(59,130,246,0.1)" }}>
                        <BookOpen className="h-4 w-4" style={{ color: "#3B82F6" }} />
                    </div>
                }
            >
                <p className="text-sm mb-5" style={{ color: "var(--hc-muted)" }}>
                    Submit a new blog post for admin review. Once approved, it will be published for all users to read.
                </p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>Title</label>
                        <input
                            className={inputCls}
                            style={inputStyle}
                            type="text"
                            name="title"
                            placeholder="Enter blog title…"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <FieldSelect
                            label="Category"
                            value={selectedCategory}
                            onChange={(v) => setSelectedCategory(v)}
                            options={categories.map((cat) => ({
                                label: cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(),
                                value: cat,
                            }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>Content</label>
                        <textarea
                            className={inputCls}
                            style={{ ...inputStyle, minHeight: "200px", resize: "vertical" }}
                            name="content"
                            placeholder="Write your blog content here…"
                            required
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Submitting…" : "Submit for Review"}
                        </Button>
                        <Button variant="secondary" onClick={() => router.push("/blogs")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

function FieldSelect({
    label,
    value,
    onChange,
    options,
    description,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    description?: string;
}) {
    return (
        <label className="block">
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--hc-text)" }}>
                {label}
                {description && (
                    <div className="group relative flex cursor-help items-center">
                        <Info className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} />
                        <div
                            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 whitespace-pre-wrap rounded-xl border p-2.5 text-xs font-normal leading-relaxed opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                            style={{
                                background: "var(--surface)",
                                borderColor: "var(--borderSoft)",
                                color: "var(--text)",
                            }}
                        >
                            {description}
                        </div>
                    </div>
                )}
            </div>

            <SoftSelect
                value={value}
                onChange={onChange}
                options={options}
            />
        </label>
    );
}