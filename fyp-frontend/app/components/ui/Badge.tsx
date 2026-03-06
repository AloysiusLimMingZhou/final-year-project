import React from "react";
import { cx } from "./cx";

export function Badge({
  tone,
  children,
}: {
  tone: "low" | "mid" | "high" | "info";
  children: React.ReactNode;
}) {
  const map = {
    low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    mid: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    high: "bg-rose-500/15 text-rose-600 border-rose-500/20",
    info: "bg-sky-500/15 text-sky-600 border-sky-500/20",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}
