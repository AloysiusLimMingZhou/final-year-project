"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, RefreshCw, Trash2, Eye } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  roles?: string[];
  created_at?: string;
};

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [page, setPage] = React.useState<number>(1);
  const [limit] = React.useState<number>(10);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (q.trim()) params.append("search", q.trim());
      const res = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const data = await res.json();
      const list: AdminUser[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : [];
      setUsers(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (user?.roles?.includes("admin")) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  async function deleteUser(u: AdminUser) {
    if (busy) return;
    const ok = confirm(`Delete user "${u.name}" (${u.email})?\n\nThis cannot be undone.`);
    if (!ok) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/users/${u.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete user");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className="py-10 text-sm" style={{ color: "var(--hc-muted)" }}>Loading…</div>;

  if (!user?.roles?.includes("admin")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <h1 className="text-2xl font-bold text-red-500">403 Forbidden</h1>
        <p className="text-sm" style={{ color: "var(--hc-muted)" }}>You are not authorized to view this page.</p>
        <Button onClick={() => router.push("/dashboard")}>Go Home</Button>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      (u.roles || []).join(",").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>Users</h1>
        <p className="text-sm" style={{ color: "var(--hc-muted)" }}>
          View and manage patient accounts.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form
            onSubmit={(e) => { e.preventDefault(); load(); }}
            className="flex gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-[300px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--hc-muted)" }}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, role…"
                className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm bg-transparent"
                style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
              />
            </div>
            <Button type="submit" variant="primary">Search</Button>
          </form>
          <Button variant="secondary" onClick={load} iconLeft={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>
              Loading users…
            </div>
          ) : err ? (
            <div className="py-6 text-sm" style={{ color: "var(--hc-muted)" }}>
              <div className="font-semibold" style={{ color: "var(--hc-text)" }}>Couldn't load users</div>
              <div className="mt-1 break-words">{err}</div>
            </div>
          ) : (
            <div className="overflow-auto rounded-2xl border" style={{ borderColor: "var(--hc-border)" }}>
              <table className="min-w-[700px] w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                    <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Name</th>
                    <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Email</th>
                    <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Roles</th>
                    <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Joined</th>
                    <th className="text-left p-3 font-semibold" style={{ color: "var(--hc-text)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: "var(--hc-border)" }}>
                      <td className="p-3 font-semibold" style={{ color: "var(--hc-text)" }}>{u.name}</td>
                      <td className="p-3" style={{ color: "var(--hc-muted)" }}>{u.email}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border"
                          style={{ borderColor: "var(--hc-border)", color: "var(--hc-muted)" }}
                        >
                          {(u.roles || []).join(", ") || "user"}
                        </span>
                      </td>
                      <td className="p-3 text-xs" style={{ color: "var(--hc-muted)" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition hover:bg-blue-50"
                            style={{ borderColor: "var(--hc-border)", color: "var(--hc-text)" }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition hover:bg-red-50 text-red-500"
                            style={{ borderColor: "#FCA5A5" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="p-4 text-sm" colSpan={5} style={{ color: "var(--hc-muted)" }}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
            Page <span className="font-bold" style={{ color: "var(--hc-text)" }}>{page}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}