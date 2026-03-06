"use client";

import React from "react";
import { motion } from "framer-motion";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Badge({
  tone,
  children,
}: {
  tone: "low" | "mid" | "high" | "info";
  children: React.ReactNode;
}) {
  const map = {
    low: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    mid: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    high: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
    info: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border", map[tone])}>
      {children}
    </span>
  );
}

export function Card({ title, headerRight, children }: { title?: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      className="rounded-2xl shadow-sm border"
      style={{ background: "var(--surface, #fff)", borderColor: "var(--borderSoft, rgba(15,23,42,0.12))" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {title ? (
        <div className="border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "var(--borderSoft, rgba(15,23,42,0.12))" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text, #0F172A)" }}>
            {title}
          </div>
          <div>{headerRight}</div>
        </div>
      ) : null}
      <div className="p-5" style={{ color: "var(--text, #0F172A)" }}>
        {children}
      </div>
    </motion.div>
  );
}


export function Button({
  children,
  onClick,
  variant = "primary",
  iconLeft,
  iconRight,
  type = "button",
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const styles = {
    primary: "text-white",
    secondary: "border bg-transparent",
    ghost: "bg-transparent",
  };

  const styleObj = {
    ...(variant === "primary"
      ? { background: "var(--accent, #0EA5A4)", color: "#fff" }
      : variant === "secondary"
        ? { color: "var(--text, #0F172A)", borderColor: "var(--borderSoft, rgba(15,23,42,0.12))" }
        : { color: "var(--text, #0F172A)" }),
    ...style,
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.();
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
      className={cx(
        base,
        styles[variant],
        variant === "ghost" && "hover:bg-black/5 dark:hover:bg-white/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={styleObj as any}
    >
      {iconLeft}
      {children}
      {iconRight}
    </motion.button>
  );
}
