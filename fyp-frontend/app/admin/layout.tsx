"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";

const tabs = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Blog Review", href: "/admin/post-review" },
  { label: "Doctors", href: "/admin/doctors" },
  { label: "Pending Doctors", href: "/admin/doctors/pending" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = (user?.roles || []).some((r) => String(r).toLowerCase() === "admin");

  React.useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="py-10 text-sm" style={{ color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <button
                key={t.href}
                onClick={() => router.push(t.href)}
                className="rounded-xl px-3 py-2 text-sm font-semibold border"
                style={{
                  borderColor: "var(--borderSoft)",
                  background: active ? "rgba(15,23,42,0.04)" : "transparent",
                  color: "var(--text)",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      {children}
    </div>
  );
}
