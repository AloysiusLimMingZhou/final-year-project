"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Users, BookOpen, Stethoscope, ClipboardList, ShieldCheck, Activity } from "lucide-react";

const statCards = [
  {
    label: "Users",
    description: "View and manage all patient accounts",
    href: "/admin/users",
    icon: Users,
    accent: "#3B82F6",
  },
  {
    label: "ML Models",
    description: "Monitor and test machine learning models",
    href: "/admin/ml",
    icon: Activity,
    accent: "#EC4899",
  },
  {
    label: "Blog Review",
    description: "Review and approve pending blog posts",
    href: "/admin/post-review",
    icon: BookOpen,
    accent: "#8B5CF6",
  },
  {
    label: "Doctors",
    description: "View all approved doctors in the system",
    href: "/admin/doctors",
    icon: Stethoscope,
    accent: "#10B981",
  },
  {
    label: "Pending Doctors",
    description: "Review and approve doctor applications",
    href: "/admin/doctors/pending",
    icon: ClipboardList,
    accent: "#F59E0B",
  },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = (user?.roles || []).some((r) => String(r).toLowerCase() === "admin");

  React.useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="py-10 text-sm" style={{ color: "var(--hc-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
          <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>
            Admin Dashboard
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--hc-muted)" }}>
          Welcome back, {user.name}. Manage users, doctors, and content from here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="text-left rounded-2xl border p-5 transition hover:shadow-md focus:outline-none"
              style={{
                background: "var(--hc-surface)",
                borderColor: "var(--hc-border)",
              }}
            >
              <div
                className="mb-3 inline-flex items-center justify-center rounded-xl p-2"
                style={{ background: card.accent + "22" }}
              >
                <Icon className="h-5 w-5" style={{ color: card.accent }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>
                {card.label}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--hc-muted)" }}>
                {card.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
