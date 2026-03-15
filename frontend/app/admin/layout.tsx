"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";

const tabs = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "ML-Models", href: "/admin/ml" },
  { label: "Blog Review", href: "/admin/post-review" },
  { label: "Doctors", href: "/admin/doctors" },
  { label: "Pending Doctors", href: "/admin/doctors/pending" },
];

function AdminTabButton({
  label,
  active,
  onClick,
  hoverBg,
  activeBg,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  hoverBg: string;
  activeBg: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, backgroundColor: hoverBg }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
      className="rounded-xl px-4 py-2 text-sm font-semibold border transition cursor-pointer focus:outline-none focus-visible:ring-2"
      style={{
        borderColor: active ? "var(--hc-accent)" : "var(--hc-border)",
        background: active ? activeBg : "transparent",
        color: "var(--hc-text)",
        boxShadow: active ? "inset 0 0 0 1px var(--hc-accent)" : "none",
      }}
    >
      {label}
    </motion.button>
  );
}

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
      <div className="py-10 text-sm" style={{ color: "var(--hc-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const hoverBg =
    "rgba(236, 72, 153, 0.10)";

  const activeBg =
    "rgba(236, 72, 153, 0.08)";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href;

            return (
              <AdminTabButton
                key={t.href}
                label={t.label}
                active={active}
                hoverBg={hoverBg}
                activeBg={activeBg}
                onClick={() => router.push(t.href)}
              />
            );
          })}
        </div>
      </Card>

      {children}
    </div>
  );
}